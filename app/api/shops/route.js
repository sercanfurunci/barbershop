import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchTerms, buildFieldOR, buildCityClause } from "@/lib/searchNormalize";
import { haversine } from "@/lib/geo";

export const dynamic = "force-dynamic";

// GET /api/shops
// Params: search, city, district, shopType, service, minRating, openNow, sort, take, skip
// All filters compose with AND — no filter can override another.
// Returns { shops, total }.

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export async function GET(request) {
  const url = new URL(request.url);
  const search    = url.searchParams.get("search")?.trim()   || "";
  const city      = url.searchParams.get("city")?.trim()     || "";
  const district  = url.searchParams.get("district")?.trim() || "";
  const shopType  = url.searchParams.get("shopType")?.trim() || "";
  const service   = url.searchParams.get("service")?.trim()  || "";
  const minRating = parseFloat(url.searchParams.get("minRating") || "0") || 0;
  const openNow   = url.searchParams.get("openNow") === "true";
  const sort      = url.searchParams.get("sort") || "popular";
  const take      = Math.min(50, Math.max(1, Number(url.searchParams.get("take")) || 12));
  const skip      = Math.min(10_000, Math.max(0, Number(url.searchParams.get("skip")) || 0));
  const userLat   = parseFloat(url.searchParams.get("userLat") || "");
  const userLng   = parseFloat(url.searchParams.get("userLng") || "");
  const hasUserLoc = !isNaN(userLat) && !isNaN(userLng);

  // Amenity filters — each is boolean true when requested
  const amenities = {};
  for (const f of ["wifi","parking","creditCard","airConditioning","disabledAccess","childFriendly","hasPromotions"]) {
    if (url.searchParams.get(f) === "true") amenities[f] = true;
  }

  // Turkey is UTC+3 year-round (no DST)
  const trNow     = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const trDayNum  = trNow.getUTCDay();                           // 0=Sun … 6=Sat
  const trDay     = DAY_KEYS[trDayNum];
  const trMin     = trNow.getUTCHours() * 60 + trNow.getUTCMinutes();
  const trDateStr = trNow.toISOString().slice(0, 10);
  const trTimeStr = `${String(trNow.getUTCHours()).padStart(2,"0")}:${String(trNow.getUTCMinutes()).padStart(2,"0")}`;

  // Every filter goes into andClauses — guarantees all conditions are AND'd.
  // No top-level spread, no risk of key collision.
  const andClauses = [];

  if (search) {
    const terms = searchTerms(search);
    andClauses.push({ OR: [
      ...buildFieldOR(terms, "name"),
      ...buildFieldOR(terms, "city"),
      ...buildFieldOR(terms, "address"),
      ...buildFieldOR(terms, "addressLine"),
      ...buildFieldOR(terms, "description"),
      ...buildFieldOR(terms, "about"),
      { barbers: { some: { OR: buildFieldOR(terms, "nameTr") } } },
      { services: { some: { AND: [{ active: true }, { OR: buildFieldOR(terms, "nameTr") }] } } },
    ]});
  }

  if (city) {
    // equals, not contains — prevents "Ankara Caddesi, Kocaeli" matching city=Ankara
    andClauses.push(buildCityClause(city, "city"));
  }

  if (district) {
    // District lives in addressLine / address — substring match is correct here
    const terms = searchTerms(district);
    andClauses.push({ OR: [
      ...buildFieldOR(terms, "addressLine"),
      ...buildFieldOR(terms, "address"),
    ]});
  }

  if (shopType) {
    andClauses.push({ shopType });
  }

  if (minRating > 0) {
    andClauses.push({ googleRating: { gte: minRating } });
  }

  if (service) {
    const terms = searchTerms(service);
    andClauses.push({
      services: { some: { AND: [{ active: true }, { OR: buildFieldOR(terms, "nameTr") }] } }
    });
  }

  // Amenity filters — each boolean must be true on the shop
  if (Object.keys(amenities).length > 0) {
    andClauses.push(amenities);
  }

  // Map "search this area": restrict to current viewport bounds
  const bounds = ["neLat", "neLng", "swLat", "swLng"].map((k) => parseFloat(url.searchParams.get(k) || ""));
  if (bounds.every((n) => !isNaN(n))) {
    const [neLat, neLng, swLat, swLng] = bounds;
    andClauses.push({
      latitude:  { gte: swLat, lte: neLat },
      longitude: { gte: swLng, lte: neLng },
    });
  }

  if (openNow) {
    // Both shop-level holiday and per-barber checks go into one AND clause.
    // Keeping it here (not as a top-level spread) prevents any key collision
    // with search-related barbers.some clauses.
    andClauses.push({
      // No shop-wide holiday today (barberId null = shop-level)
      holidays: { none: { date: trDateStr, barberId: null } },
      // At least one available barber is working right now
      barbers: {
        some: {
          available: true,
          workingHours: {
            [`${trDay}Start`]: { lte: trMin },
            [`${trDay}End`]:   { gt: trMin },
          },
          // Barber not on personal holiday today
          holidays: { none: { date: trDateStr } },
          // Barber not mid-break right now (HH:MM string comparison is lexicographically correct).
          // One-off breaks (date set) only count if they are today; date:null = recurring.
          breaks: {
            none: {
              start: { lte: trTimeStr },
              end:   { gte: trTimeStr },
              OR: [
                { date: trDateStr },                  // one-off break today
                { date: null, dayOfWeek: null },      // recurring every day
                { date: null, dayOfWeek: trDayNum },  // recurring this weekday
              ],
            },
          },
        },
      },
    });
  }

  const where = {
    status: "ACTIVE",
    deletedAt: null,
    ...(andClauses.length > 0 ? { AND: andClauses } : {}),
  };

  // "nearest" sort is applied post-query once distances are computed.
  // "popular" = most-booked shops (appointment count), so it differs from "rating".
  // Every sort ends with id asc — a deterministic tiebreaker. Without it, tied
  // rows come back in random order between requests: skip/take pagination can
  // duplicate/miss rows, and client re-fetches reorder the list (scroll jumps).
  const orderBy =
    sort === "newest"        ? [{ createdAt: "desc" }, { id: "asc" }]
    : sort === "alpha"       ? [{ name: "asc" }, { id: "asc" }]
    : sort === "mostReviewed"? [{ googleTotalRatings: "desc" }, { googleRating: "desc" }, { id: "asc" }]
    : sort === "rating"      ? [{ googleRating: "desc" }, { googleTotalRatings: "desc" }, { id: "asc" }]
    : [{ appointments: { _count: "desc" } }, { googleRating: "desc" }, { id: "asc" }]; // "popular" default + "nearest" fallback

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      take,
      skip,
      orderBy,
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        addressLine: true,
        address: true,
        formattedAddress: true,
        latitude: true,
        longitude: true,
        phone: true,
        whatsappNumber: true,
        logo: true,
        coverImage: true,
        gallery: true,
        featuredImage: true,
        mobileSettings: true,
        avgRating: true,
        totalReviews: true,
        googleRating: true,
        googleTotalRatings: true,
        googlePlaceId: true,
        googlePlacesKey: true,
        description: true,
        shopType: true,
        wifi: true,
        parking: true,
        creditCard: true,
        airConditioning: true,
        disabledAccess: true,
        childFriendly: true,
        hasPromotions: true,
        // Shop-wide holiday today → openNow badge must be false
        holidays: {
          where: { date: trDateStr, barberId: null },
          select: { id: true },
          take: 1,
        },
        services: {
          where: { active: true },
          select: { id: true, nameTr: true, price: true },
          take: 5,
          orderBy: { sortOrder: "asc" },
        },
        // For openNow computation — barbers with working hours
        barbers: {
          where: { available: true },
          select: {
            workingHours: {
              select: {
                monStart: true, monEnd: true, tueStart: true, tueEnd: true,
                wedStart: true, wedEnd: true, thuStart: true, thuEnd: true,
                friStart: true, friEnd: true, satStart: true, satEnd: true,
                sunStart: true, sunEnd: true,
              },
            },
          },
          take: 5,
        },
      },
    }),
    prisma.shop.count({ where }),
  ]);

  // Background-refresh Google rating for shops that have a Place ID but no cached rating yet.
  // Fire-and-forget: first request returns null, subsequent ones return the cached value.
  const globalApiKey = process.env.GOOGLE_PLACES_API_KEY;
  for (const s of shops) {
    if (s.googlePlaceId && s.googleRating === null) {
      const apiKey = s.googlePlacesKey || globalApiKey;
      if (apiKey) {
        fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${s.googlePlaceId}&fields=rating,user_ratings_total&key=${apiKey}`)
          .then(r => r.json())
          .then(d => {
            if (d.result?.rating != null) {
              return prisma.shop.update({
                where: { id: s.id },
                data: { googleRating: d.result.rating, googleTotalRatings: d.result.user_ratings_total ?? 0 },
              });
            }
          })
          .catch(() => {});
      }
    }
  }

  // Annotate shops with distance and openNow
  const annotated = shops.map((s) => {
    const { barbers, holidays, googlePlaceId, googlePlacesKey, ...rest } = s;
    const shopHolidayToday = (holidays?.length ?? 0) > 0;

    // Distance from user (km, 2 decimal places)
    let distance = undefined;
    if (hasUserLoc && s.latitude != null && s.longitude != null) {
      distance = Math.round(haversine(userLat, userLng, s.latitude, s.longitude) * 100) / 100;
    }

    // openNow: true if any barber is currently working (reuses TR time computed above)
    const openNow = (() => {
      if (shopHolidayToday) return false;
      if (!barbers?.length) return false;
      for (const b of barbers) {
        const wh = b.workingHours;
        if (!wh) continue;
        const start = wh[`${trDay}Start`];
        const end   = wh[`${trDay}End`];
        if (start != null && end != null && trMin >= start && trMin < end) return true;
      }
      return false;
    })();

    // Today's opening span across barbers (earliest start – latest end), "HH:MM - HH:MM"
    const todayHours = (() => {
      let min = null, max = null;
      for (const b of barbers ?? []) {
        const wh = b.workingHours;
        const start = wh?.[`${trDay}Start`];
        const end   = wh?.[`${trDay}End`];
        if (start == null || end == null) continue;
        min = min == null ? start : Math.min(min, start);
        max = max == null ? end   : Math.max(max, end);
      }
      if (min == null) return null;
      const f = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      return `${f(min)} - ${f(max)}`;
    })();

    return { ...rest, openNow, todayHours, ...(distance !== undefined ? { distance } : {}) };
  });

  // Post-query sort for "nearest" (requires computed distances)
  if (sort === "nearest" && hasUserLoc) {
    annotated.sort((a, b) => {
      const da = a.distance ?? Infinity;
      const db = b.distance ?? Infinity;
      return da - db;
    });
  }

  return NextResponse.json({ shops: annotated, total });
}

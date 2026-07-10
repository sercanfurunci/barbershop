import { prisma } from "@/lib/prisma";
import { searchTerms, buildFieldOR, buildCityClause } from "@/lib/searchNormalize";
import SalonsClient from "./SalonsClient";

export const metadata = {
  title: "Salonları Keşfet",
  description: "Türkiye genelinde berber ve kuaförleri keşfet. En iyi salonları bul, anında randevu al.",
};

export const dynamic = "force-dynamic";

const TAKE = 12;

export default async function SalonsPage({ searchParams }) {
  const params    = await searchParams;
  const q         = params?.q?.trim()        || "";
  const city      = params?.city?.trim()     || "";
  const district  = params?.district?.trim() || "";
  const sort      = params?.sort             || "popular";
  const shopType  = params?.type?.trim()     || "";
  const service   = params?.service?.trim()  || "";
  const minRating = parseFloat(params?.rating || "0") || 0;
  const openNow   = params?.open === "true";

  const andClauses = [];

  if (q) {
    const terms = searchTerms(q);
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
    andClauses.push(buildCityClause(city, "city"));
  }

  if (district) {
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

  // ponytail: openNow on SSR skips the real-time holiday/break check (no trNow in static render).
  // Client will immediately re-fetch with correct openNow if param is set.

  const where = {
    status: "ACTIVE",
    deletedAt: null,
    ...(andClauses.length > 0 ? { AND: andClauses } : {}),
  };

  // Must match /api/shops exactly (incl. id tiebreaker) — a differing initial
  // order makes the client's first refetch reorder the list and jump carousels.
  const orderBy =
    sort === "newest"        ? [{ createdAt: "desc" }, { id: "asc" }]
    : sort === "alpha"       ? [{ name: "asc" }, { id: "asc" }]
    : sort === "mostReviewed"? [{ googleTotalRatings: "desc" }, { googleRating: "desc" }, { id: "asc" }]
    : sort === "rating"      ? [{ googleRating: "desc" }, { googleTotalRatings: "desc" }, { id: "asc" }]
    : [{ appointments: { _count: "desc" } }, { googleRating: "desc" }, { id: "asc" }];

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      take: TAKE,
      orderBy,
      select: {
        id: true, slug: true, name: true, city: true, addressLine: true,
        coverImage: true, gallery: true, logo: true,
        googleRating: true, googleTotalRatings: true, description: true, shopType: true,
        services: { where: { active: true }, select: { id: true, nameTr: true }, take: 3, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.shop.count({ where }),
  ]);

  return (
    <SalonsClient
      initialShops={shops}
      initialTotal={total}
      initialQ={q}
      initialCity={city}
      initialDistrict={district}
      initialSort={sort}
      initialShopType={shopType}
      initialService={service}
      initialMinRating={minRating}
      initialOpenNow={openNow}
    />
  );
}

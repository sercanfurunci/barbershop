import { prisma } from "@/lib/prisma";
import { resolveShopBySlug } from "@/lib/shop";
import { getGoogleReviews } from "@/lib/googleReviews";
import { todayStr, nowMinutes, toDateStr } from "@/lib/utils";
import { captureException } from "@/lib/observability";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import IdentityBlock from "@/components/landing/IdentityBlock";
import SectionNav from "@/components/landing/SectionNav";
import About from "@/components/landing/About";
import BookingCard from "@/components/landing/BookingCard";
import StickyActionBar from "@/components/landing/StickyActionBar";
import TrackPageView from "@/components/landing/TrackPageView";

// ponytail: below-fold sections deferred via next/dynamic. SSR stays on so
// SEO + initial paint are unchanged; only the JS bundle is split out and
// fetched on demand. Each of these imports framer-motion which is heavy.
const Services       = dynamic(() => import("@/components/landing/Services"));
const Barbers        = dynamic(() => import("@/components/landing/Barbers"));
const Gallery        = dynamic(() => import("@/components/landing/Gallery"));
const Testimonials   = dynamic(() => import("@/components/landing/Testimonials"));
const FAQ            = dynamic(() => import("@/components/landing/FAQ"));
const SalonInfo      = dynamic(() => import("@/components/landing/SalonInfo"));
import ChatWidgetLoader from "@/components/chat/ChatWidgetLoader";

export const revalidate = 300;

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// ponytail: take the broadest envelope across barbers per day. If you want
// per-day-different copy ("Hafta içi 09-19, Cumartesi 10-18"), groupBy here.
function aggregateHours(rows) {
  if (!rows.length) return null;
  return DAY_KEYS.map((d) => {
    let start = null, end = null;
    for (const r of rows) {
      const s = r[`${d}Start`], e = r[`${d}End`];
      if (s != null) start = start == null ? s : Math.min(start, s);
      if (e != null) end   = end   == null ? e : Math.max(end,   e);
    }
    return { day: d, start, end };
  });
}

// ponytail: per-barber earliest slot — walks up to 7 days ahead, considering
// the barber's working hours, breaks, holidays, and already-booked appointments.
// Uses a 30-min lead time to match /api/availability (the actual booking step).
// Slot size is 30 min — matches the booking grid; the chip is a "fits a 30-min
// service" hint, not a guarantee for longer services.
// Time math runs in Europe/Istanbul via lib/utils helpers; raw Date methods
// would read UTC on Vercel and skew the chip by 3 hours.
const DOW_KEYS = ["sun","mon","tue","wed","thu","fri","sat"];
const SLOT = 30;
const DEFAULT_DUR = 30;

function hhmmToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nextBarberAvailable(wh, breaks, appts, holidays) {
  if (!wh) return null;
  const cutoff = nowMinutes() + 30;
  const today = todayStr();
  // Anchor at noon UTC so daylight savings / TZ shifts can't roll the
  // date when we step forward by 1 day.
  const base = new Date(today + "T12:00:00Z");
  for (let off = 0; off < 7; off++) {
    const date = new Date(base); date.setUTCDate(date.getUTCDate() + off);
    const dateStr = toDateStr(date);
    const dow = new Date(dateStr + "T12:00:00Z").getUTCDay();
    const key = DOW_KEYS[dow];
    const start = wh[`${key}Start`];
    const end   = wh[`${key}End`];
    if (start == null || end == null) continue;

    if (holidays.some(h => h.date === dateStr)) continue;

    const blocked = [];
    for (const b of breaks) {
      const matches = b.date ? b.date === dateStr : (b.dayOfWeek == null || b.dayOfWeek === dow);
      if (!matches) continue;
      blocked.push({ start: hhmmToMin(b.start), end: hhmmToMin(b.end) });
    }
    for (const a of appts) {
      if (a.date !== dateStr) continue;
      if (a.status === "CANCELLED" || a.status === "NOSHOW") continue;
      const s = hhmmToMin(a.time);
      blocked.push({ start: s, end: s + a.duration });
    }

    const floor = off === 0 ? Math.max(start, Math.ceil(cutoff / SLOT) * SLOT) : start;
    for (let t = floor; t + DEFAULT_DUR <= end; t += SLOT) {
      const slotEnd = t + DEFAULT_DUR;
      const overlaps = blocked.some(b => t < b.end && slotEnd > b.start);
      if (!overlaps) return { dayOffset: off, minutes: t };
    }
  }
  return null;
}

function minNextAvailable(items) {
  let best = null;
  for (const n of items) {
    if (!n) continue;
    if (!best || n.dayOffset < best.dayOffset || (n.dayOffset === best.dayOffset && n.minutes < best.minutes)) {
      best = n;
    }
  }
  return best;
}

export async function generateMetadata({ params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop) return { title: "Bulunamadı" };

  const title = `${shop.name} | Online Randevu`;
  const description =
    shop.about ||
    shop.description ||
    `${shop.name} — online randevu alın, bekleme yok. Premium saç ve sakal bakımı.`;
  const url = shop.customDomain
    ? `https://${shop.customDomain}`
    : `/${shop.slug}`;
  const ogImage = shop.coverImage || shop.logo || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "website", locale: "tr_TR",
      siteName: shop.name,
      ...(ogImage && { images: [ogImage] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title, description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function ShopHome({ params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop || shop.status !== "ACTIVE") notFound();

  let services = [], barbers = [], last24h = 0, hours = null, googleReviews = null;
  try {
    const now = new Date();
    const since = new Date(now.getTime() - 86_400_000);
    const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
    const todayDateStr = todayStr();
    const weekAheadStr = toDateStr(weekAhead);

    const [dbServices, dbBarbers, completedByBarber, count24h, upcomingAppts, holidays, gReviews] = await Promise.all([
      prisma.service.findMany({
        where: { shopId: shop.id, active: true },
        select: {
          id: true, nameTr: true, nameEn: true, descTr: true, descEn: true,
          duration: true, price: true, icon: true, category: true, popular: true,
        },
        orderBy: [{ category: "asc" }, { price: "asc" }],
      }),
      prisma.barber.findMany({
        where: { shopId: shop.id },
        select: {
          id: true, slug: true, nameTr: true, titleTr: true, titleEn: true,
          bioTr: true, bioEn: true, rating: true, reviewCount: true,
          specialties: true, avatar: true, color: true, available: true, yearsExp: true,
          workingHours: true,
          breaks: true,
        },
        orderBy: [{ available: "desc" }, { createdAt: "asc" }],
      }),
      prisma.appointment.groupBy({
        by: ["barberId"],
        where: { shopId: shop.id, status: "COMPLETED" },
        _count: { _all: true },
      }),
      prisma.appointment.count({
        where: {
          shopId: shop.id,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          createdAt: { gte: since },
        },
      }),
      prisma.appointment.findMany({
        where: {
          shopId: shop.id,
          date: { gte: todayDateStr, lte: weekAheadStr },
          status: { notIn: ["CANCELLED", "NOSHOW"] },
        },
        select: { barberId: true, date: true, time: true, duration: true, status: true },
      }),
      prisma.holiday.findMany({
        where: { shopId: shop.id, date: { gte: todayDateStr, lte: weekAheadStr } },
        select: { barberId: true, date: true },
      }),
      getGoogleReviews(shop.id),
    ]);

    const completedMap = new Map(completedByBarber.map(r => [r.barberId, r._count._all]));
    const apptsByBarber = new Map();
    for (const a of upcomingAppts) {
      const list = apptsByBarber.get(a.barberId) ?? [];
      list.push(a);
      apptsByBarber.set(a.barberId, list);
    }
    const shopHolidays = holidays.filter(h => h.barberId == null);
    const holidaysByBarber = new Map();
    for (const h of holidays.filter(h => h.barberId != null)) {
      const list = holidaysByBarber.get(h.barberId) ?? [];
      list.push(h);
      holidaysByBarber.set(h.barberId, list);
    }

    last24h = count24h;
    hours = aggregateHours(dbBarbers.filter(b => b.available && b.workingHours).map(b => b.workingHours));
    googleReviews = gReviews;

    services = dbServices.map((s) => ({
      id: s.id,
      name: { tr: s.nameTr, en: s.nameEn },
      description: { tr: s.descTr, en: s.descEn },
      duration: s.duration, price: s.price,
      icon: s.icon, category: s.category.toLowerCase(), popular: s.popular,
    }));

    barbers = dbBarbers.map((b) => {
      const barberHolidays = [...shopHolidays, ...(holidaysByBarber.get(b.id) ?? [])];
      const nextAvailable = b.available
        ? nextBarberAvailable(b.workingHours, b.breaks ?? [], apptsByBarber.get(b.id) ?? [], barberHolidays)
        : null;
      return {
        id: b.id, slug: b.slug, name: b.nameTr,
        title: { tr: b.titleTr, en: b.titleEn },
        bio: { tr: b.bioTr, en: b.bioEn },
        rating: b.rating, reviews: b.reviewCount,
        specialties: { tr: b.specialties, en: b.specialties },
        avatar: b.avatar, color: b.color, available: b.available, yearsExp: b.yearsExp,
        completedCount: completedMap.get(b.id) ?? 0,
        nextAvailable,
      };
    });
  } catch (err) {
    captureException(err, { tags: { page: "ShopHome", shopSlug } });
  }

  const localBusinessLd = buildLocalBusinessLd(shop, googleReviews, hours);
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Salonlar", item: "https://makas.furunci.tech/salons" },
      { "@type": "ListItem", position: 2, name: shop.name, item: shop.customDomain ? `https://${shop.customDomain}` : `https://makas.furunci.tech/${shop.slug}` },
    ],
  };

  // Conditional anchor nav — only sections with content get a link.
  const sectionLinks = [
    (shop.gallery?.length      ?? 0) > 0 && { id: "gallery",      label: { tr: "Galeri",        en: "Gallery"   } },
    !!(shop.about?.trim())                && { id: "about",        label: { tr: "Hakkımızda",    en: "About"     } },
    services.length                       && { id: "services",     label: { tr: "Hizmetler",     en: "Services"  } },
    barbers.length                        && { id: "barbers",      label: { tr: "Ekip",          en: "Team"      } },
    !!googleReviews?.reviews?.length      && { id: "testimonials", label: { tr: "Değerlendirmeler", en: "Reviews" } },
    true                                  && { id: "faq",          label: { tr: "S.S.S",         en: "FAQ"       } },
    true                                  && { id: "location",     label: { tr: "Konum",         en: "Location"  } },
  ].filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e") }} />
      <TrackPageView shopId={shop.id} />
      <Navbar />
      <main className="flex-1">
        {/* Hero: identity only (full width, no cover). Respects iOS safe-area
            top inset and adds breathing room under the floating navbar. */}
        <section
          className="mx-auto w-full"
          style={{
            maxWidth: 1560,
            paddingInline: "clamp(16px, 3vw, 32px)",
            paddingTop: "calc(72px + clamp(32px, 5vw, 64px) + env(safe-area-inset-top))",
            paddingBottom: "clamp(24px, 3vw, 36px)",
          }}
        >
          <IdentityBlock shop={shop} hours={hours} googleReviews={googleReviews} />
        </section>

        <SectionNav sections={sectionLinks} />

        {last24h > 2 && (
          <div className="text-center px-4 py-3 bg-secondary text-xs text-muted-foreground tracking-wide">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2 align-middle" />
            Son 24 saatte <strong className="text-foreground">{last24h}</strong> randevu alındı
          </div>
        )}

        {/* Gallery section holds the BookingCard as its right column. Card is
            static (not sticky) and aligns with the gallery top. Everything
            below the gallery is full content width. */}
        <Gallery
          images={shop.gallery}
          shopName={shop.name}
          aside={
            <BookingCard
              services={services}
              barbers={barbers}
              hours={hours}
              nextAvailable={minNextAvailable(barbers.map(b => b.nextAvailable))}
              activityCount={last24h}
            />
          }
        />
        <About about={shop.about} />
        <Services services={services} />
        <Barbers barbers={barbers} />
        <Testimonials googleReviews={googleReviews} googleReviewUrl={shop.googleReviewUrl ?? null} />
        <FAQ />
        <SalonInfo shop={shop} barbers={barbers} hours={hours} googleReviews={googleReviews} />
      </main>
      <StickyActionBar shop={shop} />
      <Footer />
      {shop.aiChatEnabled && (
        <ChatWidgetLoader
          shopSlug={shopSlug}
          widgetConfig={{
            aiName: shop.name,
            welcomeMessage: `Merhaba! Ben ${shop.name} asistanıyım. Size nasıl yardımcı olabilirim?`,
            avatarUrl: shop.logo || null,
          }}
        />
      )}
    </div>
  );
}

const LD_DAY = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
function minToHM(m) { return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }

function buildLocalBusinessLd(shop, googleReviews, hours) {
  const sameAs = [shop.instagramUrl, shop.facebookUrl, shop.tiktokUrl].filter(Boolean);
  const openingHours = (hours ?? [])
    .filter((h) => h.start != null && h.end != null)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: LD_DAY[h.day],
      opens:  minToHM(h.start),
      closes: minToHM(h.end),
    }));
  return {
    "@context": "https://schema.org",
    "@type":    "HairSalon",
    name:        shop.name || shop.slug,
    description: shop.about || shop.description || undefined,
    image:       shop.coverImage || shop.logo || undefined,
    logo:        shop.logo || undefined,
    url:         shop.customDomain ? `https://${shop.customDomain}` : `https://makas.furunci.tech/${shop.slug}`,
    telephone:   shop.phone || undefined,
    address: shop.addressLine || shop.city || shop.address ? {
      "@type": "PostalAddress",
      streetAddress:   shop.addressLine || undefined,
      addressLocality: shop.city || undefined,
      addressCountry:  "TR",
    } : undefined,
    geo: shop.latitude != null && shop.longitude != null ? {
      "@type":   "GeoCoordinates",
      latitude:  shop.latitude,
      longitude: shop.longitude,
    } : undefined,
    openingHoursSpecification: openingHours.length ? openingHours : undefined,
    foundingDate: shop.foundedYear ? String(shop.foundedYear) : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    aggregateRating: googleReviews?.rating != null
      ? { "@type": "AggregateRating", ratingValue: googleReviews.rating, reviewCount: googleReviews.totalRatings }
      : undefined,
  };
}

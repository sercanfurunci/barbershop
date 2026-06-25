import { prisma } from "@/lib/prisma";
import { resolveShopBySlug } from "@/lib/shop";
import { getGoogleReviews } from "@/lib/googleReviews";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import CoverBanner from "@/components/landing/CoverBanner";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import StickyActionBar from "@/components/landing/StickyActionBar";
import TrackPageView from "@/components/landing/TrackPageView";

// ponytail: below-fold sections deferred via next/dynamic. SSR stays on so
// SEO + initial paint are unchanged; only the JS bundle is split out and
// fetched on demand. Each of these imports framer-motion which is heavy.
const Services     = dynamic(() => import("@/components/landing/Services"));
const Barbers      = dynamic(() => import("@/components/landing/Barbers"));
const Gallery      = dynamic(() => import("@/components/landing/Gallery"));
const Testimonials = dynamic(() => import("@/components/landing/Testimonials"));
const CTA          = dynamic(() => import("@/components/landing/CTA"));
const SalonInfo    = dynamic(() => import("@/components/landing/SalonInfo"));

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
    const since = new Date(Date.now() - 86_400_000);
    const [dbServices, dbBarbers, completedByBarber, count24h, hoursRows, gReviews] = await Promise.all([
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
          id: true, nameTr: true, titleTr: true, titleEn: true,
          bioTr: true, bioEn: true, rating: true, reviewCount: true,
          specialties: true, avatar: true, color: true, available: true, yearsExp: true,
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
      prisma.workingHours.findMany({
        where: { barber: { shopId: shop.id, available: true } },
      }),
      getGoogleReviews(shop.id),
    ]);

    const completedMap = new Map(completedByBarber.map(r => [r.barberId, r._count._all]));
    last24h = count24h;
    hours = aggregateHours(hoursRows);
    googleReviews = gReviews;

    services = dbServices.map((s) => ({
      id: s.id,
      name: { tr: s.nameTr, en: s.nameEn },
      description: { tr: s.descTr, en: s.descEn },
      duration: s.duration, price: s.price,
      icon: s.icon, category: s.category.toLowerCase(), popular: s.popular,
    }));

    barbers = dbBarbers.map((b) => ({
      id: b.id, name: b.nameTr,
      title: { tr: b.titleTr, en: b.titleEn },
      bio: { tr: b.bioTr, en: b.bioEn },
      rating: b.rating, reviews: b.reviewCount,
      specialties: { tr: b.specialties, en: b.specialties },
      avatar: b.avatar, color: b.color, available: b.available, yearsExp: b.yearsExp,
      completedCount: completedMap.get(b.id) ?? 0,
    }));
  } catch (err) {
    console.error(`[ShopHome:${shopSlug}] DB error:`, err.message);
  }

  const localBusinessLd = buildLocalBusinessLd(shop, googleReviews, hours);

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F3EE]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      <TrackPageView shopId={shop.id} />
      <Navbar />
      <main className="flex-1">
        <CoverBanner shop={shop} googleReviews={googleReviews} />
        <Hero services={services} barbers={barbers} googleReviews={googleReviews} />
        {last24h > 2 && (
          <div style={{
            textAlign: "center", padding: "12px 16px", background: "#F7F4EE",
            fontSize: "12px", color: "#4A4A4A", letterSpacing: "0.02em",
          }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "#16a34a", marginRight: 8, verticalAlign: "middle" }} />
            Son 24 saatte <strong style={{ color: "#111" }}>{last24h}</strong> randevu alındı
          </div>
        )}
        <About about={shop.about} />
        <Services services={services} />
        <Barbers barbers={barbers} />
        <Gallery images={shop.gallery} shopName={shop.name} />
        <Testimonials googleReviews={googleReviews} />
        <CTA />
        <SalonInfo shop={shop} barbers={barbers} hours={hours} googleReviews={googleReviews} />
      </main>
      <StickyActionBar shop={shop} />
      <Footer />
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
    aggregateRating: googleReviews?.rating != null ? {
      "@type":      "AggregateRating",
      ratingValue:  googleReviews.rating,
      reviewCount:  googleReviews.totalRatings,
    } : undefined,
  };
}

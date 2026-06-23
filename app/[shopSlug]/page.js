import { prisma } from "@/lib/prisma";
import { resolveShopBySlug } from "@/lib/shop";
import { getGoogleReviews } from "@/lib/googleReviews";
import { notFound } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/landing/Hero";
import SalonInfo from "@/components/landing/SalonInfo";
import Services from "@/components/landing/Services";
import Barbers from "@/components/landing/Barbers";
import Testimonials from "@/components/landing/Testimonials";
import CTA from "@/components/landing/CTA";
import StickyActionBar from "@/components/landing/StickyActionBar";

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

  const title = shop.name;
  const description =
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
        where: { shopId: shop.id, available: true },
        select: {
          id: true, nameTr: true, titleTr: true, titleEn: true,
          bioTr: true, bioEn: true, rating: true, reviewCount: true,
          specialties: true, avatar: true, color: true, available: true, yearsExp: true,
        },
        orderBy: { createdAt: "asc" },
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

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F3EE]">
      <Navbar />
      <main className="flex-1">
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
        <Services services={services} />
        <Barbers barbers={barbers} />
        <Testimonials googleReviews={googleReviews} />
        <CTA />
        <SalonInfo shop={shop} barbers={barbers} hours={hours} />
      </main>
      <StickyActionBar shop={shop} />
      <Footer />
    </div>
  );
}

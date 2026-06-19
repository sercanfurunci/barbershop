import { prisma } from "@/lib/prisma";
import { resolveShopBySlug } from "@/lib/shop";
import { notFound } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import Barbers from "@/components/landing/Barbers";
import Testimonials from "@/components/landing/Testimonials";
import CTA from "@/components/landing/CTA";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: shop.name };
}

export default async function ShopHome({ params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop || shop.status !== "ACTIVE") notFound();

  let services = [], barbers = [];
  try {
    const [dbServices, dbBarbers] = await Promise.all([
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
    ]);

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
    }));
  } catch (err) {
    console.error(`[ShopHome:${shopSlug}] DB error:`, err.message);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F3EE]">
      <Navbar />
      <main className="flex-1 pb-safe md:pb-0" style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>
        <Hero services={services} barbers={barbers} />
        <Services services={services} />
        <Barbers barbers={barbers} />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

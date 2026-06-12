import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import Barbers from "@/components/landing/Barbers";
import Testimonials from "@/components/landing/Testimonials";
import CTA from "@/components/landing/CTA";

export const revalidate = 300;

export default async function Home() {
  const [dbServices, dbBarbers] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { price: "asc" }],
    }),
    prisma.barber.findMany({
      where: { available: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const services = dbServices.map((s) => ({
    id: s.id,
    name: { tr: s.nameTr, en: s.nameEn },
    description: { tr: s.descTr, en: s.descEn },
    duration: s.duration,
    price: s.price,
    icon: s.icon,
    category: s.category.toLowerCase(),
    popular: s.popular,
  }));

  const barbers = dbBarbers.map((b) => ({
    id: b.id,
    name: b.nameTr,
    title: { tr: b.titleTr, en: b.titleEn },
    bio: { tr: b.bioTr, en: b.bioEn },
    rating: b.rating,
    reviews: b.reviewCount,
    specialties: { tr: b.specialties, en: b.specialties },
    avatar: b.avatar,
    color: b.color,
    available: b.available,
    yearsExp: b.yearsExp,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#080808]">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <Hero services={services} barbers={barbers} />
        <Services services={services} />
        <Barbers barbers={barbers} />
        <Testimonials />
        <CTA />
      </main>
      <Footer className="mb-[72px] md:mb-0" />
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { getDefaultShopId } from "@/lib/shop";
import Navbar from "@/components/shared/Navbar";
import BookingFlow from "@/components/booking/BookingFlow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Randevu Al — Abdurrahman Çelik Exclusive Salon",
};

export default async function BookPage() {
  let initialServices = [];
  let initialBarbers  = [];

  try {
    const shopId = await getDefaultShopId();
    const [dbServices, dbBarbers] = await Promise.all([
      prisma.service.findMany({
        where: { shopId, active: true },
        orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { price: "asc" }],
      }),
      prisma.barber.findMany({
        where: { shopId, available: true },
        select: {
          id: true, nameTr: true, titleTr: true, titleEn: true,
          bioTr: true, bioEn: true, rating: true, reviewCount: true,
          specialties: true, avatar: true, color: true, available: true, yearsExp: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    initialServices = dbServices.map((s) => ({
      id: s.id, nameTr: s.nameTr, nameEn: s.nameEn,
      descTr: s.descTr, descEn: s.descEn,
      duration: s.duration, price: s.price,
      icon: s.icon, category: s.category.toLowerCase(), popular: s.popular,
    }));

    initialBarbers = dbBarbers.map((b) => ({
      id: b.id, nameTr: b.nameTr, titleTr: b.titleTr, titleEn: b.titleEn,
      bioTr: b.bioTr, bioEn: b.bioEn,
      rating: b.rating, reviewCount: b.reviewCount,
      specialties: b.specialties, avatar: b.avatar,
      color: b.color, available: b.available, yearsExp: b.yearsExp,
    }));
  } catch (err) {
    console.error("[BookPage] DB prefetch error:", err.message);
  }

  return (
    <div style={{ background: "#F6F3EE", minHeight: "100vh" }}>
      <Navbar />
      <BookingFlow initialServices={initialServices} initialBarbers={initialBarbers} />
    </div>
  );
}

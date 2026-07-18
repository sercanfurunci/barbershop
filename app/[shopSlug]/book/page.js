import { prisma } from "@/lib/prisma";
import { resolveShopBySlug } from "@/lib/shop";
import { canAcceptPublicBookings } from "@/lib/subscription";
import { telHref } from "@/lib/validation";
import { notFound } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import BookingFlow from "@/components/booking/BookingFlow";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `Randevu Al — ${shop.name}` };
}

export default async function BookPage({ params, searchParams }) {
  const { shopSlug } = await params;
  const qp = await searchParams;

  const shop = await resolveShopBySlug(shopSlug);
  if (!shop || shop.status !== "ACTIVE") notFound();

  // Subscription gate. SUSPENDED / CANCELLED shops keep the page reachable
  // but show a maintenance notice instead of the booking form.
  if (!canAcceptPublicBookings(shop)) {
    return (
      <div style={{ background: "#F6F3EE", minHeight: "100dvh" }}>
        <Navbar />
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginBottom: "12px" }}>
            Online randevu alımı şu anda kapalı
          </div>
          <p style={{ fontSize: "14px", color: "#4A4A4A", lineHeight: 1.6, marginBottom: "20px" }}>
            {shop.name} şu anda online randevu kabul etmiyor. Lütfen doğrudan iletişime geçin.
          </p>
          {shop.phone && (
            <a
              href={telHref(shop.phone)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "var(--makas-ink)", color: "var(--makas-bg)", padding: "12px 20px",
                borderRadius: "8px", textDecoration: "none", fontWeight: 600,
                fontSize: "14px", minHeight: "44px",
              }}
            >
              {shop.phone}
            </a>
          )}
        </div>
      </div>
    );
  }

  let initialServices = [], initialBarbers = [];
  try {
    const [dbServices, dbBarbers] = await Promise.all([
      prisma.service.findMany({
        where: { shopId: shop.id, active: true },
        orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { price: "asc" }],
      }),
      prisma.barber.findMany({
        where: { shopId: shop.id, available: true },
        select: {
          id: true, nameTr: true, titleTr: true, titleEn: true,
          bioTr: true, bioEn: true, rating: true, reviewCount: true,
          specialties: true, avatar: true, color: true, available: true, yearsExp: true,
          profilePhoto: true,
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
      profilePhoto: b.profilePhoto ?? null,
    }));
  } catch (err) {
    console.error(`[BookPage:${shopSlug}] DB error:`, err.message);
  }

  if (!initialServices.length || !initialBarbers.length) {
    const msg = !initialServices.length
      ? "Hizmetler yakında eklenecek"
      : "Yakında randevu açılacak";
    return (
      <div style={{ background: "#F6F3EE", minHeight: "100dvh" }}>
        <Navbar />
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginBottom: "12px" }}>
            {msg}
          </div>
          <p style={{ fontSize: "14px", color: "#4A4A4A", lineHeight: 1.6, marginBottom: "20px" }}>
            {shop.name} online randevu için hazırlanıyor. Lütfen kısa süre içinde tekrar deneyin.
          </p>
          {shop.phone && (
            <a
              href={telHref(shop.phone)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "var(--makas-ink)", color: "var(--makas-bg)", padding: "12px 20px",
                borderRadius: "8px", textDecoration: "none", fontWeight: 600,
                fontSize: "14px", minHeight: "44px",
              }}
            >
              {shop.phone}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F6F3EE", minHeight: "100dvh" }}>
      <Navbar />
      <BookingFlow
        shopId={shop.id}
        initialServices={initialServices}
        initialBarbers={initialBarbers}
        preselect={{
          serviceId:  qp?.service ?? null,
          barberId:   qp?.barber  ?? null,
          dateOffset: qp?.date != null ? parseInt(qp.date, 10) : null,
        }}
      />
    </div>
  );
}

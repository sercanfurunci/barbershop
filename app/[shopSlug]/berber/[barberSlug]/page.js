import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveShopBySlug } from "@/lib/shop";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import BarberProfile from "@/components/landing/BarberProfile";

export const revalidate = 120;

export async function generateMetadata({ params }) {
  const { shopSlug, barberSlug } = await params;
  const [shop, barber] = await Promise.all([
    resolveShopBySlug(shopSlug),
    prisma.barber.findFirst({
      where:  { slug: barberSlug, shop: { slug: shopSlug } },
      select: { nameTr: true, titleTr: true, bioTr: true, profilePhoto: true },
    }),
  ]);
  if (!shop || !barber) return { title: "Bulunamadı" };

  const title = `${barber.nameTr} — ${shop.name}`;
  const description = barber.bioTr || `${barber.nameTr}, ${shop.name}`;
  const ogImage = barber.profilePhoto || shop.logo || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/${shop.slug}/berber/${barberSlug}` },
    openGraph: {
      title, description, type: "profile", locale: "tr_TR",
      ...(ogImage && { images: [ogImage] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title, description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function BarberPublicPage({ params }) {
  const { shopSlug, barberSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop || shop.status !== "ACTIVE") notFound();

  const barber = await prisma.barber.findFirst({
    where: { slug: barberSlug, shopId: shop.id },
    select: {
      id: true, slug: true,
      nameTr: true, nameEn: true,
      titleTr: true, titleEn: true,
      bioTr: true, bioEn: true,
      profilePhoto: true, avatar: true, color: true,
      rating: true, reviewCount: true,
      yearsExp: true, available: true, specialties: true,
    },
  });
  if (!barber) notFound();

  const [reviewsRaw, completedCount] = await Promise.all([
    prisma.review.findMany({
      where:   { shopId: shop.id, barberId: barber.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, barberRating: true, comment: true, createdAt: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.appointment.count({
      where: { shopId: shop.id, barberId: barber.id, status: "COMPLETED" },
    }),
  ]);

  const initialReviews = {
    reviews: reviewsRaw.map(r => ({
      id:           r.id,
      barberRating: r.barberRating,
      comment:      r.comment,
      createdAt:    r.createdAt.toISOString(),
      customerName: r.customer?.name || "Misafir",
    })),
    hasMore: reviewsRaw.length < barber.reviewCount,
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        <BarberProfile
          shop={{ slug: shop.slug, name: shop.name }}
          barber={{
            ...barber,
            completedCount,
          }}
          initialReviews={initialReviews}
        />
      </main>
      <Footer />
    </div>
  );
}

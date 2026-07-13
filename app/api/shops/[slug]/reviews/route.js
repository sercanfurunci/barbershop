import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/shops/:slug/reviews
// Barber-only review feed. barberId is strongly recommended; without it the
// endpoint returns all barber reviews for the shop (used by admin only).
// stars filter and sort operate on barberRating, not shopRating.
export async function GET(request, { params }) {
  const { slug } = await params;
  const url = new URL(request.url);

  const stars = (() => {
    const v = Number(url.searchParams.get("stars"));
    return v >= 1 && v <= 5 ? Math.floor(v) : null;
  })();
  const rawSort = url.searchParams.get("sort") || "newest";
  const orderBy =
    rawSort === "oldest"  ? { createdAt: "asc" }
    : rawSort === "highest" ? { barberRating: "desc" }
    : rawSort === "lowest"  ? { barberRating: "asc" }
    : { createdAt: "desc" };
  const take     = Math.min(50, Math.max(1, Number(url.searchParams.get("take")) || 20));
  const skip     = Math.max(0, Number(url.searchParams.get("skip")) || 0);
  const barberId = url.searchParams.get("barberId") || null;

  const shop = await prisma.shop.findFirst({
    where:  { slug, deletedAt: null },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const where = {
    shopId: shop.id,
    ...(barberId ? { barberId } : {}),
    barberRating: stars !== null ? stars : { gt: 0 },
  };

  const [reviews, distRaw, total] = await Promise.all([
    prisma.review.findMany({
      where, orderBy, take, skip,
      select: {
        id: true,
        barberRating: true,
        comment: true,
        createdAt: true,
        barber:   { select: { id: true, nameTr: true, avatar: true, profilePhoto: true } },
        customer: { select: { name: true } },
      },
    }),
    prisma.review.groupBy({
      by: ["barberRating"],
      where: { shopId: shop.id, ...(barberId ? { barberId } : {}), barberRating: { gt: 0 } },
      _count: { _all: true },
    }),
    prisma.review.count({ where }),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distRaw) distribution[row.barberRating] = row._count._all;

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id:           r.id,
      barberRating: r.barberRating,
      comment:      r.comment,
      createdAt:    r.createdAt,
      customerName: r.customer?.name || "Misafir",
      barber:       r.barber,
    })),
    total,
    hasMore: skip + reviews.length < total,
  });
}

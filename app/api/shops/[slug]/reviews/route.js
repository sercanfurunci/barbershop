import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/shops/:slug/reviews?stars=4&sort=newest|oldest|highest|lowest&take=20&skip=0
//
// Public list of internal Review rows for the tenant's storefront. Returns
// summary aggregates (avg + star histogram) and a paginated review feed.
//
// Filters:
//   stars: 1..5 (filter by shopRating)
//   sort:  "newest" (default) | "oldest" | "highest" | "lowest"
//   take:  1..50 (default 20)
//   skip:  >=0 (default 0)
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
    : rawSort === "highest" ? { shopRating: "desc" }
    : rawSort === "lowest"  ? { shopRating: "asc" }
    : { createdAt: "desc" };
  const take = Math.min(50, Math.max(1, Number(url.searchParams.get("take")) || 20));
  const skip = Math.max(0, Number(url.searchParams.get("skip")) || 0);
  const barberId = url.searchParams.get("barberId") || null;

  const shop = await prisma.shop.findFirst({
    where:  { slug, deletedAt: null },
    select: { id: true, avgRating: true, totalReviews: true },
  });
  if (!shop) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const where = {
    shopId: shop.id,
    ...(stars !== null ? { shopRating: stars } : {}),
    ...(barberId ? { barberId } : {}),
  };

  const [reviews, distinctRaw, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy,
      take,
      skip,
      select: {
        id: true,
        shopRating: true,
        barberRating: true,
        comment: true,
        createdAt: true,
        barber:   { select: { id: true, nameTr: true, avatar: true, profilePhoto: true } },
        customer: { select: { name: true } },
      },
    }),
    prisma.review.groupBy({
      by: ["shopRating"],
      where: { shopId: shop.id },
      _count: { _all: true },
    }),
    (stars !== null || barberId) ? prisma.review.count({ where }) : Promise.resolve(shop.totalReviews),
  ]);

  // Histogram { 1: n, 2: n, ..., 5: n }
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distinctRaw) distribution[row.shopRating] = row._count._all;

  return NextResponse.json({
    summary: {
      avgRating:    shop.avgRating,
      totalReviews: shop.totalReviews,
      distribution,
    },
    reviews: reviews.map((r) => ({
      id:           r.id,
      shopRating:   r.shopRating,
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

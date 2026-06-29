import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews?stars=4&limit=100
//
// Returns customer-submitted Reviews + summary stats + dispatch pipeline
// counts (PENDING/SENT/SKIPPED ReviewRequests). The Reviews drive the list;
// the pipeline counts surface what's queued but not yet delivered.
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!["ADMIN", "SUPER_ADMIN", "RECEPTIONIST"].includes(payload.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);
  const stars = (() => {
    const v = Number(searchParams.get("stars"));
    return v >= 1 && v <= 5 ? Math.floor(v) : null;
  })();

  const shopId = payload.role === "SUPER_ADMIN"
    ? searchParams.get("shopId")
    : payload.shopId;
  if (!shopId) return forbidden();

  const where = { shopId, ...(stars !== null ? { shopRating: stars } : {}) };

  const [reviews, distribution, totalReviewed, pipeline, shop] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        barber:      { select: { id: true, nameTr: true, profilePhoto: true, avatar: true } },
        customer:    { select: { name: true } },
        appointment: { select: { date: true, service: { select: { nameTr: true } } } },
      },
    }),
    prisma.review.groupBy({
      by: ["shopRating"],
      where: { shopId },
      _count: { _all: true },
    }),
    prisma.review.count({ where: { shopId } }),
    prisma.reviewRequest.groupBy({
      by: ["status"],
      where: { shopId },
      _count: { _all: true },
    }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { avgRating: true, totalReviews: true },
    }),
  ]);

  const distMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const row of distribution) distMap[row.shopRating] = row._count._all;
  const distArr = [5,4,3,2,1].map((n) => ({ stars: n, count: distMap[n] }));

  const pipelineMap = { PENDING: 0, SENT: 0, REVIEWED: 0, SKIPPED: 0 };
  for (const row of pipeline) pipelineMap[row.status] = row._count._all;

  // Per-barber aggregates from this fetch (covers the filter, not all-time).
  const barberStats = {};
  for (const r of reviews) {
    const id = r.barberId;
    if (!barberStats[id]) barberStats[id] = { count: 0, shopSum: 0, barberSum: 0, name: r.barber?.nameTr };
    barberStats[id].count++;
    barberStats[id].shopSum   += r.shopRating;
    barberStats[id].barberSum += r.barberRating;
  }

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id:            r.id,
      shopRating:    r.shopRating,
      barberRating:  r.barberRating,
      comment:       r.comment,
      createdAt:     r.createdAt,
      customerName:  r.customer?.name ?? "Misafir",
      barber:        r.barber,
      appointment:   r.appointment,
    })),
    stats: {
      avgRating:    shop?.avgRating ?? 0,
      totalCount:   shop?.totalReviews ?? totalReviewed,
      distribution: distArr,
      barberStats,
      pipeline:     pipelineMap,
    },
  });
}

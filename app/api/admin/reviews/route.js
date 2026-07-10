import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews?stars=4&limit=100
// Barber review stats for admin dashboard.
// stars filters on barberRating (the only rating that matters now).
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

  const where = {
    shopId,
    barberRating: stars !== null ? stars : { gt: 0 },
  };

  const [reviews, distRaw, pipeline, shop] = await Promise.all([
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
      by: ["barberRating"],
      where: { shopId, barberRating: { gt: 0 } },
      _count: { _all: true },
    }),
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
  for (const row of distRaw) distMap[row.barberRating] = row._count._all;
  const distArr = [5,4,3,2,1].map((n) => ({ stars: n, count: distMap[n] }));

  const pipelineMap = { PENDING: 0, SENT: 0, REVIEWED: 0, SKIPPED: 0 };
  for (const row of pipeline) pipelineMap[row.status] = row._count._all;

  // Per-barber stats using barberRating only.
  const barberStats = {};
  for (const r of reviews) {
    const id = r.barberId;
    if (!barberStats[id]) barberStats[id] = { count: 0, sum: 0, name: r.barber?.nameTr };
    barberStats[id].count++;
    barberStats[id].sum += r.barberRating;
  }
  for (const id of Object.keys(barberStats)) {
    barberStats[id].avg = barberStats[id].sum / barberStats[id].count;
  }

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id:           r.id,
      barberRating: r.barberRating,
      comment:      r.comment,
      createdAt:    r.createdAt,
      customerName: r.customer?.name ?? "Misafir",
      barber:       r.barber,
      appointment:  r.appointment,
    })),
    stats: {
      totalCount:   reviews.length,
      distribution: distArr,
      barberStats,
      pipeline:     pipelineMap,
    },
  });
}

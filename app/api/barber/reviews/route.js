import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

const BARBER_ROLES = ["BARBER", "ADMIN", "SUPER_ADMIN"];

// GET /api/barber/reviews — barber's own review history (Review model).
// Uses barberRating, not shopRating, since the barber owns this dashboard.
export const GET = withRole(BARBER_ROLES, async (request, _ctx, payload) => {
  if (!payload.barberId) return forbidden();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const [reviews, distribution, barber] = await Promise.all([
    prisma.review.findMany({
      where:   { barberId: payload.barberId },
      orderBy: { createdAt: "desc" },
      take:    limit,
      include: {
        customer:    { select: { name: true } },
        appointment: {
          select: { date: true, service: { select: { nameTr: true, nameEn: true } } },
        },
      },
    }),
    prisma.review.groupBy({
      by: ["barberRating"],
      where: { barberId: payload.barberId },
      _count: { _all: true },
    }),
    prisma.barber.findUnique({
      where: { id: payload.barberId },
      select: { rating: true, reviewCount: true },
    }),
  ]);

  const distMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const row of distribution) distMap[row.barberRating] = row._count._all;
  const distArr = [5,4,3,2,1].map((n) => ({ stars: n, count: distMap[n] }));

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id:           r.id,
      shopRating:   r.shopRating,
      barberRating: r.barberRating,
      comment:      r.comment,
      createdAt:    r.createdAt,
      customerName: r.customer?.name ?? "Misafir",
      appointment:  r.appointment,
    })),
    stats: {
      totalCount:   barber?.reviewCount ?? 0,
      avgRating:    barber?.rating ?? 0,
      distribution: distArr,
    },
  });
});

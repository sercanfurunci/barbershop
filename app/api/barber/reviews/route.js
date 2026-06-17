import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/barber/reviews — barber's own review history
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!payload.barberId) return forbidden();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const reviews = await prisma.reviewRequest.findMany({
    where: {
      barberId: payload.barberId,
      status: "REVIEWED",
    },
    orderBy: { reviewedAt: "desc" },
    take: limit,
    include: {
      appointment: {
        select: {
          date: true,
          service: { select: { nameTr: true, nameEn: true } },
        },
      },
    },
  });

  // Aggregate stats
  const all = await prisma.reviewRequest.findMany({
    where: { barberId: payload.barberId, status: "REVIEWED" },
    select: { rating: true, reviewedAt: true },
  });

  const totalCount = all.length;
  const avgRating = totalCount > 0
    ? all.reduce((s, r) => s + (r.rating ?? 0), 0) / totalCount
    : 0;

  const distribution = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: all.filter(r => r.rating === n).length,
  }));

  return NextResponse.json({ reviews, stats: { totalCount, avgRating, distribution } });
}

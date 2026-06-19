import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!["ADMIN", "SUPER_ADMIN", "RECEPTIONIST"].includes(payload.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const limit  = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const status = searchParams.get("status") || "REVIEWED";

  // SUPER_ADMIN has no shopId — require explicit shopId param to avoid returning all data
  const shopId = payload.role === "SUPER_ADMIN"
    ? searchParams.get("shopId")
    : payload.shopId;
  if (!shopId) return forbidden();

  const where = { shopId };
  if (status !== "all") where.status = status;

  const [reviews, allReviewed] = await Promise.all([
    prisma.reviewRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        barber: { select: { nameTr: true, nameEn: true, profilePhoto: true, avatar: true } },
        appointment: { select: { date: true, service: { select: { nameTr: true } } } },
      },
    }),
    prisma.reviewRequest.findMany({
      where: { shopId, status: "REVIEWED" },
      select: { rating: true, barberId: true },
    }),
  ]);

  const totalCount = allReviewed.length;
  const avgRating  = totalCount > 0
    ? allReviewed.reduce((s, r) => s + (r.rating ?? 0), 0) / totalCount
    : 0;

  const distribution = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: allReviewed.filter(r => r.rating === n).length,
  }));

  // Per-barber stats
  const barberStats = {};
  for (const r of allReviewed) {
    if (!barberStats[r.barberId]) barberStats[r.barberId] = { count: 0, sum: 0 };
    barberStats[r.barberId].count++;
    barberStats[r.barberId].sum += r.rating ?? 0;
  }

  return NextResponse.json({ reviews, stats: { totalCount, avgRating, distribution, barberStats } });
}

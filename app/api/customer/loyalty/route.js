import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

// Points per completed appointment
const POINTS_PER_APPOINTMENT = 10;

// GET /api/customer/loyalty?shopId=xxx — balance + recent events
export const GET = withAuth(async (request, _ctx, payload) => {

  const shopId = new URL(request.url).searchParams.get("shopId");

  const where = { userId: payload.userId, ...(shopId ? { shopId } : {}) };

  const [points, events] = await Promise.all([
    prisma.loyaltyPoint.aggregate({ where, _sum: { points: true } }),
    prisma.loyaltyPoint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, points: true, reason: true, shopId: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    balance: points._sum.points ?? 0,
    events,
  });
});

// Called internally when an appointment is COMPLETED — not a public endpoint.
// Usage: awardLoyaltyPoints(userId, shopId, appointmentId)
export async function awardLoyaltyPoints(userId, shopId, appointmentId) {
  // Idempotent: skip if already awarded for this appointment
  const existing = await prisma.loyaltyPoint.findFirst({ where: { appointmentId } });
  if (existing) return;

  await prisma.loyaltyPoint.create({
    data: {
      userId,
      shopId,
      appointmentId,
      points: POINTS_PER_APPOINTMENT,
      reason: "appointment",
    },
  });
}

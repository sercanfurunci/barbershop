import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = payload.userId;
  const today = new Date().toISOString().slice(0, 10);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { clientId: true, phone: true, email: true, createdAt: true },
  });

  // Collect all Client IDs that belong to this user (mirrors reviews fallback)
  const clientIds = new Set();
  if (user?.clientId) clientIds.add(user.clientId);

  const lookups = [];
  if (user?.phone) {
    const p = user.phone.replace(/\D/g, "").slice(-10);
    if (p.length >= 10) lookups.push(prisma.client.findMany({ where: { phone: { endsWith: p } }, select: { id: true } }));
  }
  if (user?.email) {
    lookups.push(prisma.client.findMany({ where: { email: user.email }, select: { id: true } }));
  }
  const extra = (await Promise.all(lookups)).flat();
  extra.forEach(c => clientIds.add(c.id));

  const ids = [...clientIds];
  const apptFilter = ids.length > 0 ? { clientId: { in: ids } } : { id: "__none__" };
  const reviewOR = [{ userId }, ...(ids.length > 0 ? [{ customerId: { in: ids } }] : [])];

  const [upcoming, completed, favorites, reviewStats] = await Promise.all([
    prisma.appointment.count({ where: { ...apptFilter, status: { in: ["PENDING", "CONFIRMED"] }, date: { gte: today } } }),
    prisma.appointment.count({ where: { ...apptFilter, status: "COMPLETED" } }),
    prisma.customerFavorite.count({ where: { userId } }),
    prisma.review.aggregate({
      where: { OR: reviewOR, barberRating: { gt: 0 } },
      _count: { id: true },
      _avg: { barberRating: true },
    }),
  ]);

  return NextResponse.json({
    upcoming,
    completed,
    favorites,
    reviews: reviewStats._count.id,
    avgRating: reviewStats._avg.barberRating ? Math.round(reviewStats._avg.barberRating * 10) / 10 : null,
    memberSince: user?.createdAt ?? null,
  });
}

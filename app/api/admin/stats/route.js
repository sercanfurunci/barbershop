import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!["ADMIN", "SUPER_ADMIN", "RECEPTIONIST", "BARBER"].includes(payload.role)) return forbidden();

  const shopId = payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;

  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const now = new Date();
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthEndStr = `${lastMonthEnd.getFullYear()}-${String(lastMonthEnd.getMonth() + 1).padStart(2, "0")}-${String(lastMonthEnd.getDate()).padStart(2, "0")}`;

  const [
    totalRev,
    thisMonthRev,
    lastMonthRev,
    totalAppts,
    thisMonthAppts,
    lastMonthAppts,
    totalClients,
    thisMonthClients,
    lastMonthClients,
    barbers,
  ] = await Promise.all([
    prisma.appointment.aggregate({ where: { shopId, status: "COMPLETED" }, _sum: { price: true } }),
    prisma.appointment.aggregate({ where: { shopId, status: "COMPLETED", date: { gte: thisMonthStart } }, _sum: { price: true } }),
    prisma.appointment.aggregate({ where: { shopId, status: "COMPLETED", date: { gte: lastMonthStart, lte: lastMonthEndStr } }, _sum: { price: true } }),
    prisma.appointment.count({ where: { shopId, status: { notIn: ["CANCELLED"] } } }),
    prisma.appointment.count({ where: { shopId, status: { notIn: ["CANCELLED"] }, date: { gte: thisMonthStart } } }),
    prisma.appointment.count({ where: { shopId, status: { notIn: ["CANCELLED"] }, date: { gte: lastMonthStart, lte: lastMonthEndStr } } }),
    prisma.client.count({ where: { shopId } }),
    prisma.client.count({ where: { shopId, createdAt: { gte: new Date(thisMonthStart + "T00:00:00.000Z") } } }),
    prisma.client.count({ where: { shopId, createdAt: { gte: new Date(lastMonthStart + "T00:00:00.000Z"), lte: new Date(lastMonthEndStr + "T23:59:59.999Z") } } }),
    prisma.barber.findMany({ where: { shopId, available: true }, select: { rating: true } }),
  ]);

  function pctChange(current, prev) {
    if (!prev) return 0;
    return Math.round(((current - prev) / prev) * 100 * 10) / 10;
  }

  const revThis = thisMonthRev._sum.price ?? 0;
  const revLast = lastMonthRev._sum.price ?? 0;
  const avgRating = barbers.length > 0
    ? Math.round((barbers.reduce((s, b) => s + (b.rating ?? 5), 0) / barbers.length) * 100) / 100
    : 5.0;

  return NextResponse.json({
    totalRevenue:         totalRev._sum.price ?? 0,
    thisMonthRevenue:     revThis,
    lastMonthRevenue:     revLast,
    totalAppointments:    totalAppts,
    thisMonthAppointments: thisMonthAppts,
    totalClients,
    thisMonthClients,
    avgRating,
    revenueChange:        pctChange(revThis, revLast),
    appointmentsChange:   pctChange(thisMonthAppts, lastMonthAppts),
    clientsChange:        pctChange(thisMonthClients, lastMonthClients),
    ratingChange:         0,
  });
}

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

  // Use Istanbul-aware date to avoid month boundary errors between 00:00-03:00 Istanbul time
  const TZ = "Europe/Istanbul";
  const fmt = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const now = new Date();
  const istParts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(now).split("-").map(Number);
  const [yr, mo] = [istParts[0], istParts[1]]; // current year/month in Istanbul
  const thisMonthStart = `${yr}-${String(mo).padStart(2, "0")}-01`;
  const prevMo = mo === 1 ? 12 : mo - 1;
  const prevYr = mo === 1 ? yr - 1 : yr;
  const lastMonthStart = `${prevYr}-${String(prevMo).padStart(2, "0")}-01`;
  // last day of previous month = one day before this month start
  const lastMonthEndDate = new Date(Date.UTC(yr, mo - 1, 0)); // Day 0 of current month = last day of previous month
  const lastMonthEndStr = fmt(lastMonthEndDate);

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

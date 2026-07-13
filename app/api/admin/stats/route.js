import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

const STATS_ROLES = ["ADMIN", "SUPER_ADMIN", "RECEPTIONIST", "BARBER"];

function pctChange(current, prev) {
  if (!prev) return 0;
  return Math.round(((current - prev) / prev) * 100 * 10) / 10;
}

// Sum ShopMetric rows for a date range.
async function metricSum(shopId, from, to) {
  const rows = await prisma.shopMetric.findMany({
    where: { shopId, date: { gte: from, lte: to } },
    select: { revenue: true, shopAmount: true, barberAmount: true, appointmentCount: true, completedCount: true, walkInCount: true, newClientCount: true },
  });
  return rows.reduce(
    (acc, r) => ({
      revenue:          acc.revenue          + r.revenue,
      shopAmount:       acc.shopAmount       + r.shopAmount,
      barberAmount:     acc.barberAmount     + r.barberAmount,
      appointmentCount: acc.appointmentCount + r.appointmentCount,
      completedCount:   acc.completedCount   + r.completedCount,
      walkInCount:      acc.walkInCount      + r.walkInCount,
      newClientCount:   acc.newClientCount   + r.newClientCount,
    }),
    { revenue: 0, shopAmount: 0, barberAmount: 0, appointmentCount: 0, completedCount: 0, walkInCount: 0, newClientCount: 0 }
  );
}

export const GET = withRole(STATS_ROLES, async (request, _ctx, payload) => {
  const url = new URL(request.url);
  const shopId = payload.role === "SUPER_ADMIN"
    ? url.searchParams.get("shopId")
    : payload.shopId;

  if (!shopId) return badRequest("shopId gerekli");

  const requestedBarberId = url.searchParams.get("barberId") || undefined;
  const barberId = payload.role === "BARBER" ? payload.barberId : requestedBarberId;
  const barberFilter = barberId ? { barberId } : {};

  const shopData = await prisma.shop.findUnique({ where: { id: shopId }, select: { timezone: true } });
  const TZ  = shopData?.timezone ?? "Europe/Istanbul";
  const fmt = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const now = new Date();

  const istParts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(now).split("-").map(Number);
  const [yr, mo] = [istParts[0], istParts[1]];
  const thisMonthStart  = `${yr}-${String(mo).padStart(2, "0")}-01`;
  const prevMo          = mo === 1 ? 12 : mo - 1;
  const prevYr          = mo === 1 ? yr - 1 : yr;
  const lastMonthStart  = `${prevYr}-${String(prevMo).padStart(2, "0")}-01`;
  const lastMonthEndStr = fmt(new Date(Date.UTC(yr, mo - 1, 0)));

  // ── ShopMetric path (no barberId filter — metrics are shop-wide) ─────────────
  // Falls through to live queries when barberId is set or metrics are missing.
  if (!barberId) {
    const [mThis, mLast, totalClients, thisMonthClients, lastMonthClients, barbers, topServiceRows] = await Promise.all([
      metricSum(shopId, thisMonthStart, fmt(now)),
      metricSum(shopId, lastMonthStart, lastMonthEndStr),
      prisma.client.count({ where: { shopId } }),
      prisma.client.count({ where: { shopId, createdAt: { gte: new Date(thisMonthStart + "T00:00:00.000Z") } } }),
      prisma.client.count({ where: { shopId, createdAt: { gte: new Date(lastMonthStart + "T00:00:00.000Z"), lte: new Date(lastMonthEndStr + "T23:59:59.999Z") } } }),
      prisma.barber.aggregate({ where: { shopId, available: true }, _avg: { rating: true }, _count: { id: true } }),
      prisma.appointment.groupBy({
        by: ["serviceId"],
        where: { shopId, status: "COMPLETED", date: { gte: thisMonthStart } },
        _count: { _all: true },
        orderBy: { _count: { serviceId: "desc" } },
        take: 1,
      }),
    ]);

    // If ShopMetric has data for this month, use it. Otherwise fall through to live.
    if (mThis.completedCount > 0 || mLast.completedCount > 0) {
      // All-time totals still need a live query — metrics only go back to cron start.
      const totalRev = await prisma.appointment.aggregate({
        where: { shopId, status: "COMPLETED" },
        _sum:  { price: true, grossAmount: true },
      });

      let topService = null;
      if (topServiceRows.length > 0) {
        const serviceIds = topServiceRows.map((r) => r.serviceId);
        const services = await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, nameTr: true } });
        const svcMap = new Map(services.map((s) => [s.id, s]));
        const svc = svcMap.get(topServiceRows[0].serviceId);
        if (svc) topService = { name: svc.nameTr, count: topServiceRows[0]._count._all };
      }

      const avgRating = barbers._count.id > 0
        ? Math.round((barbers._avg.rating ?? 5) * 100) / 100
        : 5.0;

      const walkInRate = mThis.completedCount > 0
        ? Math.round((mThis.walkInCount / mThis.completedCount) * 100)
        : 0;

      return ok({
        totalRevenue:          totalRev._sum.grossAmount ?? totalRev._sum.price ?? 0,
        thisMonthRevenue:      mThis.revenue,
        lastMonthRevenue:      mLast.revenue,
        revenueChange:         pctChange(mThis.revenue, mLast.revenue),
        thisMonthGross:        mThis.revenue,
        lastMonthGross:        mLast.revenue,
        thisMonthShopNet:      mThis.shopAmount,
        lastMonthShopNet:      mLast.shopAmount,
        thisMonthBarberPaid:   mThis.barberAmount,
        lastMonthBarberPaid:   mLast.barberAmount,
        shopNetChange:         pctChange(mThis.shopAmount, mLast.shopAmount),
        totalAppointments:     mThis.appointmentCount + mLast.appointmentCount,
        thisMonthAppointments: mThis.appointmentCount,
        appointmentsChange:    pctChange(mThis.appointmentCount, mLast.appointmentCount),
        totalClients,
        thisMonthClients:      mThis.newClientCount || thisMonthClients,
        clientsChange:         pctChange(mThis.newClientCount || thisMonthClients, mLast.newClientCount || lastMonthClients),
        thisMonthWalkIns:      mThis.walkInCount,
        walkInRate,
        topService,
        avgRating,
        ratingChange: 0,
      });
    }
    // No metric rows yet — fall through to live queries below
  }

  // ── Live query fallback (barberId-scoped or no ShopMetric data yet) ──────────
  const completedThis = { shopId, status: "COMPLETED", date: { gte: thisMonthStart }, ...barberFilter };
  const completedLast = { shopId, status: "COMPLETED", date: { gte: lastMonthStart, lte: lastMonthEndStr }, ...barberFilter };

  const [
    totalRev, thisMonthRev, lastMonthRev,
    totalAppts, thisMonthAppts, lastMonthAppts,
    totalClients, thisMonthClients, lastMonthClients,
    barbers, thisMonthWalkIns, topServiceRows,
  ] = await Promise.all([
    prisma.appointment.aggregate({ where: { shopId, status: "COMPLETED", ...barberFilter }, _sum: { price: true, grossAmount: true, barberAmount: true, shopAmount: true } }),
    prisma.appointment.aggregate({ where: completedThis, _sum: { price: true, grossAmount: true, barberAmount: true, shopAmount: true } }),
    prisma.appointment.aggregate({ where: completedLast, _sum: { price: true, grossAmount: true, barberAmount: true, shopAmount: true } }),
    prisma.appointment.count({ where: { shopId, status: { notIn: ["CANCELLED"] }, ...barberFilter } }),
    prisma.appointment.count({ where: { shopId, status: { notIn: ["CANCELLED"] }, date: { gte: thisMonthStart }, ...barberFilter } }),
    prisma.appointment.count({ where: { shopId, status: { notIn: ["CANCELLED"] }, date: { gte: lastMonthStart, lte: lastMonthEndStr }, ...barberFilter } }),
    prisma.client.count({ where: { shopId } }),
    prisma.client.count({ where: { shopId, createdAt: { gte: new Date(thisMonthStart + "T00:00:00.000Z") } } }),
    prisma.client.count({ where: { shopId, createdAt: { gte: new Date(lastMonthStart + "T00:00:00.000Z"), lte: new Date(lastMonthEndStr + "T23:59:59.999Z") } } }),
    prisma.barber.aggregate({ where: { shopId, available: true }, _avg: { rating: true }, _count: { id: true } }),
    prisma.appointment.count({ where: { ...completedThis, isWalkIn: true } }),
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: completedThis,
      _count: { _all: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 1,
    }),
  ]);

  let topService = null;
  if (topServiceRows.length > 0) {
    const serviceIds = topServiceRows.map((r) => r.serviceId);
    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, nameTr: true } });
    const svcMap = new Map(services.map((s) => [s.id, s]));
    const svc = svcMap.get(topServiceRows[0].serviceId);
    if (svc) topService = { name: svc.nameTr, count: topServiceRows[0]._count._all };
  }

  const grossThis  = thisMonthRev._sum.grossAmount  ?? thisMonthRev._sum.price  ?? 0;
  const grossLast  = lastMonthRev._sum.grossAmount  ?? lastMonthRev._sum.price  ?? 0;
  const shopThis   = thisMonthRev._sum.shopAmount   ?? grossThis;
  const shopLast   = lastMonthRev._sum.shopAmount   ?? grossLast;
  const barberThis = thisMonthRev._sum.barberAmount ?? 0;
  const barberLast = lastMonthRev._sum.barberAmount ?? 0;

  const walkInRate = thisMonthAppts > 0 ? Math.round((thisMonthWalkIns / thisMonthAppts) * 100) : 0;
  const avgRating  = barbers._count.id > 0
    ? Math.round((barbers._avg.rating ?? 5) * 100) / 100
    : 5.0;

  return ok({
    totalRevenue:          totalRev._sum.grossAmount ?? totalRev._sum.price ?? 0,
    thisMonthRevenue:      grossThis,
    lastMonthRevenue:      grossLast,
    revenueChange:         pctChange(grossThis, grossLast),
    thisMonthGross:        grossThis,
    lastMonthGross:        grossLast,
    thisMonthShopNet:      shopThis,
    lastMonthShopNet:      shopLast,
    thisMonthBarberPaid:   barberThis,
    lastMonthBarberPaid:   barberLast,
    shopNetChange:         pctChange(shopThis, shopLast),
    totalAppointments:     totalAppts,
    thisMonthAppointments: thisMonthAppts,
    appointmentsChange:    pctChange(thisMonthAppts, lastMonthAppts),
    totalClients,
    thisMonthClients,
    clientsChange:         pctChange(thisMonthClients, lastMonthClients),
    thisMonthWalkIns,
    walkInRate,
    topService,
    avgRating,
    ratingChange: 0,
  });
});

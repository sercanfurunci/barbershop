import { prisma } from "@/lib/prisma";

/**
 * Analytics service layer.
 * All analytics queries live here — routes and components import from this module.
 * No charts, no formatting. Raw data only.
 */

/**
 * Revenue summary for a date range.
 */
export async function getRevenueSummary(shopId, { start, end } = {}) {
  const dateFilter = { ...(start && { gte: start }), ...(end && { lte: end }) };
  const where = {
    shopId,
    status:    "COMPLETED",
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
  };

  const agg = await prisma.appointment.aggregate({
    where,
    _sum:   { grossAmount: true, barberAmount: true, shopAmount: true, tipAmount: true },
    _count: { id: true },
  });

  return {
    totalRevenue:  agg._sum.grossAmount  ?? 0,
    barberRevenue: agg._sum.barberAmount ?? 0,
    shopRevenue:   agg._sum.shopAmount   ?? 0,
    tips:          agg._sum.tipAmount    ?? 0,
    completedCount: agg._count.id,
  };
}

/**
 * Occupancy rate: completed / (completed + noshow + cancelled + pending) in range.
 */
export async function getOccupancyRate(shopId, { start, end } = {}) {
  const dateFilter = { ...(start && { gte: start }), ...(end && { lte: end }) };
  const where = { shopId, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) };

  const [completed, cancelled, noshow, total] = await Promise.all([
    prisma.appointment.count({ where: { ...where, status: "COMPLETED" } }),
    prisma.appointment.count({ where: { ...where, status: "CANCELLED" } }),
    prisma.appointment.count({ where: { ...where, status: "NOSHOW" } }),
    prisma.appointment.count({ where }),
  ]);

  return {
    completed, cancelled, noshow,
    total,
    occupancyRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    noshowRate: total > 0 ? Math.round((noshow / total) * 100) : 0,
  };
}

/**
 * Top services by appointment count (most popular).
 */
export async function getPopularServices(shopId, { limit = 5, start, end } = {}) {
  const dateFilter = { ...(start && { gte: start }), ...(end && { lte: end }) };
  const where = {
    shopId,
    status: { notIn: ["CANCELLED"] },
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
  };

  const groups = await prisma.appointment.groupBy({
    by:      ["serviceId"],
    where,
    _count:  { id: true },
    orderBy: { _count: { id: "desc" } },
    take:    limit,
  });

  const serviceIds = groups.map(g => g.serviceId);
  const services   = await prisma.service.findMany({
    where:  { id: { in: serviceIds } },
    select: { id: true, nameTr: true, price: true, icon: true },
  });
  const nameMap = Object.fromEntries(services.map(s => [s.id, s]));

  return groups.map(g => ({ ...nameMap[g.serviceId], count: g._count.id }));
}

/**
 * Top barbers by revenue.
 */
export async function getTopBarbers(shopId, { limit = 5, start, end } = {}) {
  const dateFilter = { ...(start && { gte: start }), ...(end && { lte: end }) };
  const where = {
    shopId, status: "COMPLETED",
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
  };

  const groups = await prisma.appointment.groupBy({
    by:      ["barberId"],
    where,
    _sum:    { barberAmount: true },
    _count:  { id: true },
    orderBy: { _sum: { barberAmount: "desc" } },
    take:    limit,
  });

  const barberIds = groups.map(g => g.barberId);
  const barbers   = await prisma.barber.findMany({
    where:  { id: { in: barberIds } },
    select: { id: true, nameTr: true, avatar: true, rating: true },
  });
  const map = Object.fromEntries(barbers.map(b => [b.id, b]));

  return groups.map(g => ({ ...map[g.barberId], revenue: g._sum.barberAmount ?? 0, appointments: g._count.id }));
}

/**
 * Busy hours distribution: how many appointments per hour of day.
 */
export async function getBusyHours(shopId, { start, end } = {}) {
  const dateFilter = { ...(start && { gte: start }), ...(end && { lte: end }) };
  const appts = await prisma.appointment.findMany({
    where: {
      shopId, status: { notIn: ["CANCELLED"] },
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    },
    select: { time: true },
  });

  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  for (const a of appts) {
    const h = parseInt(a.time.split(":")[0]);
    if (h >= 0 && h < 24) hours[h].count++;
  }
  return hours.filter(h => h.count > 0);
}

/**
 * Returning customers: clients with more than one completed appointment.
 */
export async function getReturningCustomerRate(shopId, { start, end } = {}) {
  const dateFilter = { ...(start && { gte: start }), ...(end && { lte: end }) };
  const where = {
    shopId, status: "COMPLETED",
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
  };

  const groups = await prisma.appointment.groupBy({
    by:     ["clientId"],
    where,
    _count: { id: true },
  });

  const returning = groups.filter(g => g._count.id > 1).length;
  const total     = groups.length;
  return { returning, total, rate: total > 0 ? Math.round((returning / total) * 100) : 0 };
}

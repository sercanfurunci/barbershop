import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/cron/shop-metrics
// Called nightly (Vercel Cron or external scheduler). Computes and upserts one
// ShopMetric row per shop for `targetDate` (defaults to yesterday in UTC).
// Idempotent — safe to re-run for the same date.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get("authorization");
  const isProd = process.env.NODE_ENV === "production";
  const unauthorized = isProd
    ? !secret || auth !== `Bearer ${secret}`
    : !!secret && auth !== `Bearer ${secret}`;
  if (unauthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow explicit date via ?date=YYYY-MM-DD for backfill runs.
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get("date") ?? yesterdayUtc();

  const shops = await prisma.shop.findMany({
    where:  { status: { not: "SUSPENDED" } },
    select: { id: true },
  });

  const shopIds = shops.map(s => s.id);
  if (shopIds.length === 0) {
    return NextResponse.json({ ok: true, date: targetDate, computed: 0 });
  }

  // Batch all queries across all shops — one round-trip per query type instead of N.
  const [completedRows, cancelledGroups, newClientGroups] = await Promise.all([
    prisma.appointment.findMany({
      where:  { shopId: { in: shopIds }, status: "COMPLETED", date: targetDate },
      select: { shopId: true, price: true, grossAmount: true, shopAmount: true, barberAmount: true, isWalkIn: true },
    }),
    prisma.appointment.groupBy({
      by:     ["shopId"],
      where:  { shopId: { in: shopIds }, status: "CANCELLED", date: targetDate },
      _count: { _all: true },
    }),
    prisma.client.groupBy({
      by:     ["shopId"],
      where:  { shopId: { in: shopIds }, createdAt: { gte: new Date(`${targetDate}T00:00:00.000Z`), lt: new Date(`${targetDate}T23:59:59.999Z`) } },
      _count: { _all: true },
    }),
  ]);

  // Index batched results by shopId for O(1) lookup.
  const cancelledMap   = Object.fromEntries(cancelledGroups.map(r => [r.shopId, r._count._all]));
  const newClientMap   = Object.fromEntries(newClientGroups.map(r => [r.shopId, r._count._all]));

  // Group completed appointments by shop.
  const completedByShop = {};
  for (const row of completedRows) {
    if (!completedByShop[row.shopId]) completedByShop[row.shopId] = [];
    completedByShop[row.shopId].push(row);
  }

  // Build one row per shop in memory, then batch-upsert in a single SQL statement.
  const rows = shops.map(({ id: shopId }) => {
    const completed  = completedByShop[shopId] ?? [];
    const cancelled  = cancelledMap[shopId]    ?? 0;
    const newClients = newClientMap[shopId]    ?? 0;
    const rev        = completed.reduce((s, a) => s + (a.grossAmount ?? a.price ?? 0), 0);
    const shopAmt    = completed.reduce((s, a) => s + (a.shopAmount  ?? 0), 0);
    const barb       = completed.reduce((s, a) => s + (a.barberAmount ?? 0), 0);
    const walkIns    = completed.filter(a => a.isWalkIn).length;
    return {
      shopId,
      rev, shopAmt, barb,
      appointmentCount: completed.length + cancelled,
      completedCount:   completed.length,
      cancelledCount:   cancelled,
      walkInCount:      walkIns,
      newClientCount:   newClients,
    };
  });

  if (rows.length > 0) {
    // Pipeline all upserts over one connection via $transaction(array).
    // Prisma doesn't expose a bulk upsert API, so this is the lowest-overhead
    // option: N statements, 1 connection checkout, no BEGIN/COMMIT overhead.
    await prisma.$transaction(
      rows.map(r =>
        prisma.shopMetric.upsert({
          where:  { shopId_date: { shopId: r.shopId, date: targetDate } },
          update: {
            revenue: r.rev, shopAmount: r.shopAmt, barberAmount: r.barb,
            appointmentCount: r.appointmentCount,
            completedCount:   r.completedCount,
            cancelledCount:   r.cancelledCount,
            walkInCount:      r.walkInCount,
            newClientCount:   r.newClientCount,
          },
          create: {
            shopId: r.shopId, date: targetDate,
            revenue: r.rev, shopAmount: r.shopAmt, barberAmount: r.barb,
            appointmentCount: r.appointmentCount,
            completedCount:   r.completedCount,
            cancelledCount:   r.cancelledCount,
            walkInCount:      r.walkInCount,
            newClientCount:   r.newClientCount,
          },
        })
      )
    );
  }

  return NextResponse.json({ ok: true, date: targetDate, computed: rows.length });
}

function yesterdayUtc() {
  const d = new Date(Date.now() - 86_400_000);
  return d.toISOString().slice(0, 10);
}

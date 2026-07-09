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

  let computed = 0;
  for (const { id: shopId } of shops) {
    const [completed, cancelled, walkIns, newClients] = await Promise.all([
      prisma.appointment.findMany({
        where:  { shopId, status: "COMPLETED", date: targetDate },
        select: { price: true, grossAmount: true, shopAmount: true, barberAmount: true, isWalkIn: true },
      }),
      prisma.appointment.count({ where: { shopId, status: "CANCELLED",  date: targetDate } }),
      prisma.appointment.count({ where: { shopId, status: "COMPLETED",  date: targetDate, isWalkIn: true } }),
      prisma.client.count({
        where: { shopId, createdAt: { gte: new Date(`${targetDate}T00:00:00.000Z`), lt: new Date(`${targetDate}T23:59:59.999Z`) } },
      }),
    ]);

    const rev   = completed.reduce((s, a) => s + (a.grossAmount ?? a.price ?? 0), 0);
    const shop  = completed.reduce((s, a) => s + (a.shopAmount  ?? 0), 0);
    const barb  = completed.reduce((s, a) => s + (a.barberAmount ?? 0), 0);

    await prisma.shopMetric.upsert({
      where:  { shopId_date: { shopId, date: targetDate } },
      update: {
        revenue: rev, shopAmount: shop, barberAmount: barb,
        appointmentCount: completed.length + cancelled,
        completedCount: completed.length, cancelledCount: cancelled,
        walkInCount: walkIns, newClientCount: newClients,
      },
      create: {
        shopId, date: targetDate,
        revenue: rev, shopAmount: shop, barberAmount: barb,
        appointmentCount: completed.length + cancelled,
        completedCount: completed.length, cancelledCount: cancelled,
        walkInCount: walkIns, newClientCount: newClients,
      },
    });
    computed++;
  }

  return NextResponse.json({ ok: true, date: targetDate, computed });
}

function yesterdayUtc() {
  const d = new Date(Date.now() - 86_400_000);
  return d.toISOString().slice(0, 10);
}

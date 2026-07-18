import { NextResponse } from "next/server";
import { AppointmentLifecycleService } from "@/lib/services/AppointmentLifecycleService";
import { processQueue } from "@/lib/notifications";
import { processReviewQueue } from "@/lib/reviews";
import { expireTrials, suspendPastDue } from "@/lib/subscription";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get("authorization");
  const isProd = process.env.NODE_ENV === "production";
  const unauthorized = isProd
    ? !secret || auth !== `Bearer ${secret}`
    : !!secret && auth !== `Bearer ${secret}`;
  if (unauthorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now    = new Date();
  const hour   = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const day    = now.getUTCDay(); // 0 = Sunday

  const results = {};

  // Every minute: appointment lifecycle
  results.appointments = await run("appointments", () => AppointmentLifecycleService.run());

  // Every minute: notification + review queues
  results.notifications = await run("notifications", async () => {
    const [notif, reviews] = await Promise.all([processQueue(20), processReviewQueue(20)]);
    return { notif, reviews };
  });

  // Hourly (at :00): shop metrics for yesterday
  if (minute === 0) {
    results.shopMetrics = await run("shop-metrics", runShopMetrics);
  }

  // Daily 03:00 UTC: billing
  if (hour === 3 && minute === 0) {
    results.billing = await run("billing", async () => {
      const [expired, suspended] = await Promise.all([expireTrials(), suspendPastDue()]);
      return { expired, suspended };
    });
  }

  // Daily 05:00 UTC (08:00 TR): birthdays
  if (hour === 5 && minute === 0) {
    results.birthdays = await run("birthdays", runBirthdays);
  }

  // Weekly Sunday 04:00 UTC: cloudinary orphan cleanup
  if (day === 0 && hour === 4 && minute === 0) {
    results.cleanupPhotos = await run("cleanup-photos", runCleanupPhotos);
  }

  return NextResponse.json({ ok: true, ts: now.toISOString(), ...results });
}

// Wraps a job so one failure doesn't abort the others.
async function run(name, fn) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[cron/master] ${name}`, err);
    return { error: err.message };
  }
}

async function runShopMetrics() {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const shops = await prisma.shop.findMany({
    where:  { status: { not: "SUSPENDED" } },
    select: { id: true },
  });
  const shopIds = shops.map(s => s.id);
  if (!shopIds.length) return { date: yesterday, computed: 0 };

  const [completedRows, cancelledGroups, newClientGroups] = await Promise.all([
    prisma.appointment.findMany({
      where:  { shopId: { in: shopIds }, status: "COMPLETED", date: yesterday },
      select: { shopId: true, price: true, grossAmount: true, shopAmount: true, barberAmount: true, isWalkIn: true },
    }),
    prisma.appointment.groupBy({
      by: ["shopId"],
      where: { shopId: { in: shopIds }, status: "CANCELLED", date: yesterday },
      _count: { _all: true },
    }),
    prisma.client.groupBy({
      by: ["shopId"],
      where: {
        shopId: { in: shopIds },
        createdAt: { gte: new Date(`${yesterday}T00:00:00.000Z`), lt: new Date(`${yesterday}T23:59:59.999Z`) },
      },
      _count: { _all: true },
    }),
  ]);

  const cancelledMap   = Object.fromEntries(cancelledGroups.map(r => [r.shopId, r._count._all]));
  const newClientMap   = Object.fromEntries(newClientGroups.map(r => [r.shopId, r._count._all]));
  const completedByShop = {};
  for (const row of completedRows) {
    (completedByShop[row.shopId] ??= []).push(row);
  }

  const rows = shops.map(({ id: shopId }) => {
    const completed  = completedByShop[shopId] ?? [];
    const cancelled  = cancelledMap[shopId]    ?? 0;
    const newClients = newClientMap[shopId]    ?? 0;
    return {
      shopId,
      revenue:          completed.reduce((s, a) => s + (a.grossAmount ?? a.price ?? 0), 0),
      shopAmount:       completed.reduce((s, a) => s + (a.shopAmount  ?? 0), 0),
      barberAmount:     completed.reduce((s, a) => s + (a.barberAmount ?? 0), 0),
      appointmentCount: completed.length + cancelled,
      completedCount:   completed.length,
      cancelledCount:   cancelled,
      walkInCount:      completed.filter(a => a.isWalkIn).length,
      newClientCount:   newClients,
    };
  });

  await prisma.$transaction(
    rows.map(r =>
      prisma.shopMetric.upsert({
        where:  { shopId_date: { shopId: r.shopId, date: yesterday } },
        update: r,
        create: { ...r, date: yesterday },
      })
    )
  );

  return { date: yesterday, computed: rows.length };
}

async function runBirthdays() {
  const trNow   = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const trMonth = trNow.getUTCMonth() + 1;
  const trDay   = trNow.getUTCDate();

  const users = await prisma.user.findMany({
    where:  { role: "CUSTOMER", birthday: { not: null } },
    select: { id: true, displayName: true, phone: true, email: true, birthday: true },
  });

  const today = users.filter(u => {
    const bd = new Date(u.birthday);
    return bd.getUTCMonth() + 1 === trMonth && bd.getUTCDate() === trDay;
  });

  for (const u of today) {
    console.info("[cron/master] birthday", { userId: u.id, name: u.displayName });
  }

  return { date: trNow.toISOString().slice(0, 10), count: today.length };
}

async function runCleanupPhotos() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return { skipped: "cloudinary not configured" };

  const liveIds = new Set(
    (await prisma.barber.findMany({ select: { id: true } })).map(b => `makas/barbers/${b.id}`)
  );

  let nextCursor, scanned = 0;
  const orphans = [];
  do {
    const page = await cloudinary.api.resources({
      type: "upload", prefix: "makas/barbers/", max_results: 500, next_cursor: nextCursor,
    });
    scanned += page.resources.length;
    for (const r of page.resources) {
      if (!liveIds.has(r.public_id)) orphans.push(r.public_id);
    }
    nextCursor = page.next_cursor;
  } while (nextCursor);

  let deleted = 0;
  for (let i = 0; i < orphans.length; i += 100) {
    await cloudinary.api.delete_resources(orphans.slice(i, i + 100));
    deleted += 100;
  }

  return { scanned, deleted };
}

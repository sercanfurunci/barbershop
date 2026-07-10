import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/cron/birthdays
// Run daily at ~08:00 TR time. Finds customers with a birthday today,
// logs them, and sends greeting via available channels.
// Email / SMS delivery: add provider calls here when infra is ready.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get("authorization");
  const isProd = process.env.NODE_ENV === "production";
  const unauthorized = isProd
    ? !secret || auth !== `Bearer ${secret}`
    : !!secret && auth !== `Bearer ${secret}`;
  if (unauthorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Turkey is UTC+3; compare month+day only.
  const trNow   = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const trMonth = trNow.getUTCMonth() + 1; // 1-12
  const trDay   = trNow.getUTCDate();

  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER", birthday: { not: null } },
    select: { id: true, displayName: true, phone: true, email: true, birthday: true },
  });

  const todayBirthdays = users.filter(u => {
    const bd = new Date(u.birthday);
    return bd.getUTCMonth() + 1 === trMonth && bd.getUTCDate() === trDay;
  });

  // TODO: when email provider is wired, send "Mutlu Yıllar!" email here.
  // TODO: when push token infra exists, send push notification here.
  // For now: log so the shop admin can see who has a birthday today.
  for (const u of todayBirthdays) {
    console.info("[birthday-cron]", { userId: u.id, name: u.displayName, date: trNow.toISOString().slice(0, 10) });
  }

  return NextResponse.json({
    ok: true,
    date: trNow.toISOString().slice(0, 10),
    count: todayBirthdays.length,
    users: todayBirthdays.map(u => ({ id: u.id, name: u.displayName })),
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { toDateStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0")  && digits.length === 11) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

// GET /api/public/appointments?phone=5XXXXXXXXX
// Returns upcoming + recent appointments for a phone number (no auth)
export async function GET(request) {
  const ip = getIp(request);
  const rl = await rateLimit(`pub-appts:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const rawPhone = searchParams.get("phone");
  if (!rawPhone) return NextResponse.json({ error: "phone gerekli" }, { status: 400 });

  const phone = normalizePhone(rawPhone);
  if (!phone) return NextResponse.json({ error: "Geçersiz telefon numarası" }, { status: 400 });

  // 30 days back in Istanbul local time — toISOString() is UTC and would
  // report the wrong date between 00:00–03:00 Istanbul (UTC+3).
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sinceStr = toDateStr(since);

  const clients = await prisma.client.findMany({
    where: { phone },
    select: { id: true, shopId: true },
  });

  if (!clients.length) return NextResponse.json([]);

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: { in: clients.map((c) => c.id) },
      date: { gte: sinceStr },
    },
    include: {
      shop:    { select: { id: true, name: true, slug: true, address: true, phone: true, logo: true } },
      barber:  { select: { id: true, nameTr: true, avatar: true, profilePhoto: true } },
      service: { select: { id: true, nameTr: true, duration: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 50,
  });

  // Strip sensitive client data — only return what the phone owner needs
  return NextResponse.json(
    appointments.map((a) => ({
      id:       a.id,
      date:     a.date,
      time:     a.time,
      duration: a.duration,
      status:   a.status,
      price:    a.price,
      notes:    a.notes,
      shop:     a.shop,
      barber:   a.barber,
      service:  a.service,
    }))
  );
}

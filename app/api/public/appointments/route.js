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

  // Only upcoming appointments — no history. Exposing past appointments
  // to anyone who knows a phone number is a BOLA/privacy risk.
  const todayStr = toDateStr(new Date());

  const clients = await prisma.client.findMany({
    where: { phone },
    select: { id: true },
  });

  if (!clients.length) return NextResponse.json([]);

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: { in: clients.map((c) => c.id) },
      date:     { gte: todayStr },
      status:   { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      shop:    { select: { id: true, name: true, slug: true, address: true, phone: true, logo: true } },
      barber:  { select: { id: true, nameTr: true, avatar: true, profilePhoto: true } },
      service: { select: { id: true, nameTr: true, duration: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 10,
  });

  // notes intentionally excluded — contains potentially sensitive admin remarks
  return NextResponse.json(
    appointments.map((a) => ({
      id:       a.id,
      date:     a.date,
      time:     a.time,
      duration: a.duration,
      status:   a.status,
      shop:     a.shop,
      barber:   a.barber,
      service:  a.service,
    }))
  );
}

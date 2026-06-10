import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

// GET /api/appointments?date=2026-06-10&barberId=brb-1&status=PENDING
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const date     = searchParams.get("date");
  const barberId = searchParams.get("barberId");
  const status   = searchParams.get("status");
  const limit    = parseInt(searchParams.get("limit") ?? "200");

  // Barbers can only see their own appointments
  const effectiveBarberId =
    payload.role === "BARBER" ? payload.barberId : (barberId ?? undefined);

  const where = {
    ...(date        && { date }),
    ...(effectiveBarberId && { barberId: effectiveBarberId }),
    ...(status      && { status }),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      client:  { select: { id: true, name: true, phone: true, email: true } },
      barber:  { select: { id: true, slug: true, nameTr: true, avatar: true } },
      service: { select: { id: true, nameTr: true, nameEn: true, icon: true } },
    },
    orderBy: [{ date: "desc" }, { time: "desc" }],
    take: limit,
  });

  return NextResponse.json(appointments);
}

// POST /api/appointments — create new appointment (public for online booking)
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, email, serviceId, barberId, date, time, notes, source } = body;

    if (!name || !phone || !serviceId || !barberId || !date || !time) {
      return NextResponse.json({ error: "Eksik alanlar var" }, { status: 400 });
    }

    // Validate date/time
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });

    const barber = await prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });

    // Conflict check
    const [h, m] = time.split(":").map(Number);
    const startMin = h * 60 + m;
    const endMin   = startMin + service.duration;

    const existing = await prisma.appointment.findMany({
      where: { barberId, date, status: { notIn: ["CANCELLED", "NOSHOW"] } },
      select: { time: true, duration: true },
    });

    const conflict = existing.some(a => {
      const aStart = parseInt(a.time.split(":")[0]) * 60 + parseInt(a.time.split(":")[1]);
      const aEnd   = aStart + a.duration;
      return startMin < aEnd && endMin > aStart;
    });

    if (conflict) {
      return NextResponse.json({ error: "Bu saat dilimi dolu" }, { status: 409 });
    }

    // Upsert client by phone
    const client = await prisma.client.upsert({
      where: { phone },
      update: { name, ...(email && { email }) },
      create: { name, phone, email: email ?? null },
    });

    const appointment = await prisma.appointment.create({
      data: {
        clientId:  client.id,
        barberId,
        serviceId,
        date,
        time,
        duration:  service.duration,
        price:     service.price,
        status:    "PENDING",
        source:    source ?? "ONLINE",
        notes:     notes ?? null,
      },
      include: {
        client:  { select: { id: true, name: true, phone: true } },
        barber:  { select: { id: true, slug: true, nameTr: true } },
        service: { select: { id: true, nameTr: true, icon: true } },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    console.error("[POST /api/appointments]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

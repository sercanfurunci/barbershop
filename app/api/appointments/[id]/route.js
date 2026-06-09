import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

// GET /api/appointments/:id
export async function GET(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const appt = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      client:  true,
      barber:  { select: { id: true, slug: true, nameTr: true, avatar: true } },
      service: true,
    },
  });

  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });

  // Barbers can only see their own
  if (payload.role === "BARBER" && appt.barberId !== payload.barberId) return forbidden();

  return NextResponse.json(appt);
}

// PATCH /api/appointments/:id — update notes, reschedule
export async function PATCH(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const appt = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });

  if (payload.role === "BARBER" && appt.barberId !== payload.barberId) return forbidden();

  const body = await request.json();
  const { notes, date, time } = body;

  // If rescheduling, re-check conflicts
  if (date || time) {
    const newDate = date ?? appt.date;
    const newTime = time ?? appt.time;
    const [h, m]  = newTime.split(":").map(Number);
    const startMin = h * 60 + m;
    const endMin   = startMin + appt.duration;

    const existing = await prisma.appointment.findMany({
      where: {
        barberId: appt.barberId,
        date:     newDate,
        status:   { notIn: ["CANCELLED", "NOSHOW"] },
        id:       { not: appt.id },
      },
      select: { time: true, duration: true },
    });

    const conflict = existing.some(a => {
      const aStart = parseInt(a.time.split(":")[0]) * 60 + parseInt(a.time.split(":")[1]);
      const aEnd   = aStart + a.duration;
      return startMin < aEnd && endMin > aStart;
    });

    if (conflict) return NextResponse.json({ error: "Bu saat dilimi dolu" }, { status: 409 });
  }

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      ...(notes !== undefined && { notes }),
      ...(date  && { date }),
      ...(time  && { time }),
    },
    include: {
      client:  { select: { id: true, name: true, phone: true } },
      barber:  { select: { id: true, slug: true, nameTr: true } },
      service: { select: { id: true, nameTr: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/appointments/:id — admin only
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN") return forbidden();

  await prisma.appointment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Shop isolation helper — true if the caller may access this appointment.
function canAccess(payload, appt) {
  if (payload.role === "SUPER_ADMIN") return true;
  if (appt.shopId !== payload.shopId) return false;
  if (payload.role === "BARBER" && appt.barberId !== payload.barberId) return false;
  return true;
}

// GET /api/appointments/:id
export async function GET(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const { id } = await params;

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client:  true,
      barber:  { select: { id: true, slug: true, nameTr: true, avatar: true } },
      service: true,
    },
  });

  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (!canAccess(payload, appt)) return forbidden();

  return NextResponse.json(appt);
}

// PATCH /api/appointments/:id — update notes, reschedule
export async function PATCH(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const { id } = await params;

  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (!canAccess(payload, appt)) return forbidden();

  const body = await request.json();
  const { notes, date, time } = body;

  // If rescheduling, re-check conflicts within the same shop
  if (date || time) {
    const newDate = date ?? appt.date;
    const newTime = time ?? appt.time;
    const [h, m]  = newTime.split(":").map(Number);
    const startMin = h * 60 + m;
    const endMin   = startMin + appt.duration;

    const existing = await prisma.appointment.findMany({
      where: {
        shopId:   appt.shopId,
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
    where: { id },
    data: {
      ...(notes !== undefined && { notes }),
      ...(date  && { date }),
      ...(time  && { time }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/appointments/:id — admin only
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") return forbidden();

  const { id } = await params;

  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (!canAccess(payload, appt)) return forbidden();

  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

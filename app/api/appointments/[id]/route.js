import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { todayStr } from "@/lib/utils";
import { validateBookingWindow } from "@/lib/booking";

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
  const { notes, date, time, price } = body;

  let priceVal;
  if (price !== undefined) {
    if (price === null || price === "") {
      priceVal = null;
    } else {
      priceVal = Number(price);
      if (!Number.isFinite(priceVal) || priceVal < 0 || priceVal > 100000) {
        return NextResponse.json({ error: "Fiyat 0–100000 ₺ arasında olmalı" }, { status: 400 });
      }
    }
  }

  // If rescheduling, validate format + not-in-past + re-check conflicts.
  if (date || time) {
    const newDate = date ?? appt.date;
    const newTime = time ?? appt.time;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Geçersiz tarih formatı." }, { status: 400 });
    }
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Geçersiz saat formatı." }, { status: 400 });
    }
    if (newDate < todayStr()) {
      return NextResponse.json({ error: "Geçmiş bir tarihe taşınamaz." }, { status: 400 });
    }

    const [h, m]  = newTime.split(":").map(Number);
    const startMin = h * 60 + m;
    const endMin   = startMin + appt.duration;

    // Working hours / break / holiday gate — same rule set the public booking uses.
    // Skip only when nothing about the schedule changed (notes-only PATCH won't reach here).
    if (newDate !== appt.date || newTime !== appt.time) {
      const window = await validateBookingWindow({
        shopId: appt.shopId, barberId: appt.barberId, date: newDate,
        startMin, durationMin: appt.duration,
      });
      if (!window.ok) return NextResponse.json({ error: window.error }, { status: window.status });
    }

    // ponytail: Serializable tx so the conflict check and update are atomic —
    // prevents two concurrent reschedules from both passing the same slot check.
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.appointment.findMany({
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
        if (conflict) throw Object.assign(new Error("SLOT_TAKEN"), { status: 409 });

        return tx.appointment.update({
          where: { id: appt.id },
          data: {
            ...(notes !== undefined && { notes }),
            ...(date  && { date }),
            ...(time  && { time }),
            ...(price !== undefined && { price: priceVal }),
          },
        });
      }, { isolationLevel: "Serializable" });

      return NextResponse.json(updated);
    } catch (err) {
      if (err.message === "SLOT_TAKEN") {
        return NextResponse.json({ error: "Bu saat dilimi dolu" }, { status: 409 });
      }
      throw err;
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: {
      ...(notes !== undefined && { notes }),
      ...(price !== undefined && { price: priceVal }),
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

  // Defense-in-depth: scope delete by shopId even though canAccess already checked.
  const { count } = await prisma.appointment.deleteMany({ where: { id: appt.id, shopId: appt.shopId } });
  if (!count) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

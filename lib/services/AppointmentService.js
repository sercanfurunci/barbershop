/**
 * AppointmentService — mutation operations for existing appointments.
 *
 * createBooking lives in BookingService.js (heavier: client lookup, slot guards, events).
 * This service owns post-creation mutations: cancel and reschedule.
 *
 * AI tool handlers in lib/ai/handlers.js must call these instead of Prisma directly.
 */

import { prisma } from "@/lib/prisma";
import { validateBookingWindow } from "@/lib/booking";
import { emit, EVENTS } from "@/lib/events";
import { invalidateCustomerContext } from "@/lib/ai/customerContext";

function timeToMin(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }

export class AppointmentError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.name  = "AppointmentError";
    this.code  = code;
    this.status = status;
  }
}

/**
 * Cancel an appointment.
 *
 * @param {string} appointmentId
 * @param {{ reason?: string, cancelledBy?: string }} [opts]
 * @returns {Promise<{ id, status, date, time }>}
 */
export async function cancelAppointment(appointmentId, { reason, cancelledBy = "channel" } = {}) {
  const appt = await prisma.appointment.findUnique({
    where:  { id: appointmentId },
    select: { status: true, shopId: true, client: { select: { phone: true } } },
  });

  if (!appt) {
    throw new AppointmentError("Randevu bulunamadı.", "NOT_FOUND", 404);
  }
  if (["CANCELLED", "COMPLETED"].includes(appt.status)) {
    throw new AppointmentError(
      `Randevu iptal edilemez. Mevcut durum: ${appt.status}`,
      "INVALID_STATUS",
      400,
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status:             "CANCELLED",
      cancelledAt:        new Date(),
      cancelledBy,
      cancellationReason: reason ?? null,
    },
    select: { id: true, status: true, date: true, time: true, shopId: true, clientId: true },
  });

  invalidateCustomerContext(appt.shopId, appt.client?.phone);

  emit(EVENTS.APPOINTMENT_CANCELLED, {
    appointmentId: updated.id,
    shopId:        updated.shopId,
    date:          updated.date,
    time:          updated.time,
  });

  const { shopId: _s, clientId: _c, ...result } = updated;
  return result;
}

/**
 * Reschedule an appointment to a new date and time.
 * Validates working hours, breaks, and slot conflicts in a Serializable transaction.
 *
 * @param {string} appointmentId
 * @param {{ date: string, time: string }} target
 * @returns {Promise<{ id, status, date, time }>}
 */
export async function rescheduleAppointment(appointmentId, { date, time }) {
  const appt = await prisma.appointment.findUnique({
    where:  { id: appointmentId },
    select: { shopId: true, barberId: true, duration: true, status: true, client: { select: { phone: true } } },
  });

  if (!appt) {
    throw new AppointmentError("Randevu bulunamadı.", "NOT_FOUND", 404);
  }
  if (!["PENDING", "CONFIRMED"].includes(appt.status)) {
    throw new AppointmentError(
      `Randevu değiştirilemez. Mevcut durum: ${appt.status}`,
      "INVALID_STATUS",
      400,
    );
  }

  const [h, m]   = time.split(":").map(Number);
  const startMin = h * 60 + m;

  const window = await validateBookingWindow({
    shopId:      appt.shopId,
    barberId:    appt.barberId,
    date,
    startMin,
    durationMin: appt.duration,
  });
  if (!window.ok) {
    throw new AppointmentError(window.error, "SLOT_UNAVAILABLE", window.status ?? 409);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const conflicts = await tx.appointment.findMany({
      where: {
        shopId:  appt.shopId,
        barberId: appt.barberId,
        date,
        status: { notIn: ["CANCELLED", "NOSHOW"] },
        NOT: { id: appointmentId },
      },
      select: { time: true, duration: true },
    });

    const taken = conflicts.some(a => {
      const s = timeToMin(a.time);
      return startMin < s + a.duration && startMin + appt.duration > s;
    });
    if (taken) throw new AppointmentError("Seçilen saat dolu.", "SLOT_TAKEN", 409);

    return tx.appointment.update({
      where: { id: appointmentId },
      data:  { date, time },
      select: { id: true, status: true, date: true, time: true, shopId: true },
    });
  }, { isolationLevel: "Serializable" });

  invalidateCustomerContext(appt.shopId, appt.client?.phone);

  emit(EVENTS.APPOINTMENT_RESCHEDULED, {
    appointmentId: updated.id,
    shopId:        updated.shopId,
    date:          updated.date,
    time:          updated.time,
  });

  const { shopId: _s, ...result } = updated;
  return result;
}

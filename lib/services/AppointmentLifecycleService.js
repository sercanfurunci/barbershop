/**
 * AppointmentLifecycleService
 *
 * Single source of truth for automatic appointment state transitions.
 * Cron calls `run()` — never place business logic directly in the cron route.
 *
 * State machine:
 *   CONFIRMED     → ARRIVAL_CHECK  (at appointment start time in shop timezone)
 *   ARRIVAL_CHECK → IN_PROGRESS    (barber confirms arrival via /api/barber/alerts)
 *   ARRIVAL_CHECK → NOSHOW         (barber marks no-show via /api/barber/alerts)
 *   IN_PROGRESS   → COMPLETED      (end time + 30 min in shop timezone)
 *
 * The cron NEVER assumes a customer arrived.
 * Auto-completion ONLY applies to IN_PROGRESS (barber already confirmed arrival).
 * NOSHOW, CANCELLED, COMPLETED are terminal — cron never touches them.
 * Manual overrides always win: queries use idempotent WHERE status = X guards.
 */

import { prisma }          from "@/lib/prisma";
import { splitRevenue }    from "@/lib/revenue";
import { createReviewRequest } from "@/lib/reviews";

// ── Timezone helper ──────────────────────────────────────────────────────────

/**
 * Convert appointment local date/time to a UTC Date object.
 * Uses Intl.DateTimeFormat — no external deps, no server-TZ assumptions.
 *
 * Example (Europe/Istanbul, UTC+3):
 *   toUTC("2026-07-18", "10:00", "Europe/Istanbul") → 2026-07-18T07:00:00Z
 */
function toUTC(dateStr, timeStr, tz) {
  // Treat local time as UTC naively — gives us the starting reference
  const utcApprox = new Date(`${dateStr}T${timeStr}:00Z`);

  // Find what that UTC moment looks like in the target timezone
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts  = fmt.formatToParts(utcApprox);
  const get    = t => parseInt(parts.find(p => p.type === t).value, 10);
  const h      = get("hour");

  // Reconstruct what the timezone thinks utcApprox is, as a UTC ms value
  const tzMs = Date.UTC(
    get("year"), get("month") - 1, get("day"),
    h === 24 ? 0 : h, get("minute"), get("second"),
  );

  // diff = how far tzMs drifted from utcApprox; subtract it to get real UTC
  return new Date(utcApprox.getTime() + (utcApprox.getTime() - tzMs));
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60_000);
}

// ── Audit helper ─────────────────────────────────────────────────────────────

function audit(tx, { shopId, appointmentId, oldStatus, newStatus, extra = {} }) {
  return tx.auditLog.create({
    data: {
      shopId,
      entity:        "appointment",
      entityId:      appointmentId,
      appointmentId,
      action:        "status_change",
      channel:       "CRON",
      userId:        null,
      before:        { status: oldStatus },
      after:         { status: newStatus, ...extra },
    },
  }).catch(err => console.error("[lifecycle:audit]", appointmentId, err.message));
}

// ── Service ───────────────────────────────────────────────────────────────────

export const AppointmentLifecycleService = {

  async run() {
    const now = new Date();
    const [toArrivalCheck, toCompleted] = await Promise.all([
      this._toArrivalCheck(now),
      this._toCompleted(now),
    ]);
    return { toArrivalCheck, toCompleted, ranAt: now.toISOString() };
  },

  // ── CONFIRMED → ARRIVAL_CHECK ─────────────────────────────────────────────
  // At start time: do NOT assume arrival. Surface a "Did customer arrive?" prompt
  // to the barber. The cron stops here — human action drives the next step.

  async _toArrivalCheck(now) {
    // Fetch window: 1 day back (for slow crons or missed runs) to 1 day ahead
    const from = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
    const to   = new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10);

    const appts = await prisma.appointment.findMany({
      where: { status: "CONFIRMED", date: { gte: from, lte: to } },
      select: {
        id: true, shopId: true, barberId: true, date: true, time: true, duration: true,
        shop: { select: { timezone: true } },
      },
    });

    const moved = [];

    for (const appt of appts) {
      const tz       = appt.shop.timezone || "Europe/Istanbul";
      const startUTC = toUTC(appt.date, appt.time, tz);
      if (startUTC > now) continue; // not yet time

      try {
        await prisma.$transaction(async (tx) => {
          // Idempotent: only move if still CONFIRMED (guards concurrent cron runs)
          const claimed = await tx.appointment.updateMany({
            where: { id: appt.id, status: "CONFIRMED" },
            data:  { status: "ARRIVAL_CHECK" },
          });
          if (claimed.count === 0) return; // already moved

          await audit(tx, {
            shopId:        appt.shopId,
            appointmentId: appt.id,
            oldStatus:     "CONFIRMED",
            newStatus:     "ARRIVAL_CHECK",
          });

          // In-app arrival check — barber dashboard polls for these
          await tx.notificationJob.create({
            data: {
              shopId:        appt.shopId,
              appointmentId: appt.id,
              channel:       "IN_APP",
              event:         "ARRIVAL_CHECK",
              scheduledFor:  now,
              message:       "Randevu saati geldi. Müşteri geldi mi?",
              status:        "PENDING",
            },
          });
        });

        moved.push(appt.id);
      } catch (err) {
        console.error("[lifecycle:toArrivalCheck]", appt.id, err.message);
      }
    }

    return moved;
  },

  // ── IN_PROGRESS → COMPLETED ───────────────────────────────────────────────
  // Only appointments where the barber already confirmed arrival (IN_PROGRESS)
  // are auto-completed. ARRIVAL_CHECK appointments are never touched here.

  async _toCompleted(now) {
    // Look back 2 days so missed runs can still auto-complete yesterday's appointments
    const from = new Date(now.getTime() - 2 * 86_400_000).toISOString().slice(0, 10);
    const to   = now.toISOString().slice(0, 10);

    const appts = await prisma.appointment.findMany({
      where: { status: "IN_PROGRESS", date: { gte: from, lte: to } },
      select: {
        id: true, shopId: true, clientId: true, barberId: true,
        date: true, time: true, duration: true, price: true,
        shop:   { select: { timezone: true } },
        barber: { select: { paymentType: true, commissionRate: true, fixedSalary: true } },
      },
    });

    const moved = [];

    for (const appt of appts) {
      const tz        = appt.shop.timezone || "Europe/Istanbul";
      const startUTC  = toUTC(appt.date, appt.time, tz);
      const endUTC    = addMinutes(startUTC, appt.duration);
      const triggerAt = addMinutes(endUTC, 30);
      if (triggerAt > now) continue; // not yet time

      const finalPrice    = appt.price ?? 0;
      const { barberAmount, shopAmount } = splitRevenue(finalPrice, appt.barber);
      const completedAt   = now;

      try {
        await prisma.$transaction(async (tx) => {
          // Idempotent: NOSHOW/CANCELLED won't match — they're the termination guard
          const claimed = await tx.appointment.updateMany({
            where: { id: appt.id, status: "IN_PROGRESS" },
            data:  {
              status:      "COMPLETED",
              grossAmount: finalPrice,
              barberAmount,
              shopAmount,
              completedAt,
            },
          });
          if (claimed.count === 0) return; // already moved or barber marked NOSHOW

          await tx.client.update({
            where: { id: appt.clientId },
            data:  {
              totalSpent:  { increment: finalPrice },
              visitCount:  { increment: 1 },
              lastVisitAt: completedAt,
            },
          });

          // Dismiss any open arrival check notifications for this appointment
          await tx.notificationJob.updateMany({
            where: { appointmentId: appt.id, event: "ARRIVAL_CHECK", status: "PENDING" },
            data:  { status: "CANCELLED" },
          });

          await audit(tx, {
            shopId:        appt.shopId,
            appointmentId: appt.id,
            oldStatus:     "IN_PROGRESS",
            newStatus:     "COMPLETED",
            extra:         { finalPrice, source: "auto", barberAmount, shopAmount },
          });
        });

        // Fire-and-forget: review request outside tx
        createReviewRequest(appt.id).catch(() => {});
        moved.push(appt.id);
      } catch (err) {
        console.error("[lifecycle:toCompleted]", appt.id, err.message);
      }
    }

    return moved;
  },
};

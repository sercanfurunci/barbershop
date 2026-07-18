/**
 * GET  /api/barber/alerts  — pending arrival-check notifications for the barber
 * POST /api/barber/alerts  — respond to an alert (arrived | noshow)
 *
 * Used by the barber dashboard to surface "Did the customer arrive?" prompts.
 *
 * Flow:
 *   ARRIVAL_CHECK + barber "arrived"  → IN_PROGRESS  (barber confirmed arrival)
 *   ARRIVAL_CHECK + barber "noshow"   → NOSHOW        (customer did not show)
 *
 * Idempotency: both transitions use updateMany with a status guard so that
 * double-clicks or concurrent requests never apply side effects twice.
 */

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";
import { withAuth }     from "@/lib/middleware/withRole";

// Fetch pending IN_APP arrival-check notifications for appointments in ARRIVAL_CHECK state
export const GET = withAuth(async (_req, _ctx, payload) => {
  if (!["BARBER", "ADMIN", "SUPER_ADMIN"].includes(payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where = {
    channel: "IN_APP",
    event:   "ARRIVAL_CHECK",
    status:  "PENDING",
    shopId:  payload.shopId,
    ...(payload.role === "BARBER" && {
      appointment: { barberId: payload.barberId },
    }),
  };

  const alerts = await prisma.notificationJob.findMany({
    where,
    orderBy: { scheduledFor: "asc" },
    select: {
      id:           true,
      message:      true,
      scheduledFor: true,
      appointment: {
        select: {
          id:       true,
          date:     true,
          time:     true,
          duration: true,
          status:   true,
          barber:   { select: { id: true, nameTr: true } },
          service:  { select: { nameTr: true } },
          client:   { select: { name: true, phone: true } },
        },
      },
    },
  });

  // Only surface alerts for appointments still awaiting arrival confirmation.
  // Guards against stale alerts if the barber acted directly on the timeline.
  return NextResponse.json(
    alerts.filter(a => a.appointment?.status === "ARRIVAL_CHECK"),
  );
});

// Respond to an alert: confirm arrival (→ IN_PROGRESS) or mark no-show (→ NOSHOW)
export const POST = withAuth(async (request, _ctx, payload) => {
  if (!["BARBER", "ADMIN", "SUPER_ADMIN"].includes(payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { alertId, action } = await request.json(); // action: "arrived" | "noshow"
  if (!alertId || !["arrived", "noshow"].includes(action)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const job = await prisma.notificationJob.findUnique({
    where:  { id: alertId },
    select: { id: true, shopId: true, appointmentId: true, status: true,
              appointment: { select: { barberId: true, status: true, clientId: true } } },
  });

  if (!job || job.shopId !== payload.shopId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (payload.role === "BARBER" && job.appointment?.barberId !== payload.barberId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Dismiss the notification using updateMany + status guard so concurrent
  // requests are both safe (second one is a no-op, not an error).
  await prisma.notificationJob.updateMany({
    where: { id: alertId, status: "PENDING" },
    data:  { status: "SENT", processedAt: new Date() },
  });

  if (!job.appointmentId) {
    return NextResponse.json({ ok: true, action, skipped: true });
  }

  if (action === "arrived") {
    // Interactive transaction: only write audit if the status actually changed.
    // Guards double-clicks and concurrent requests — second call is a silent no-op.
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.appointment.updateMany({
        where: { id: job.appointmentId, status: "ARRIVAL_CHECK" },
        data:  { status: "IN_PROGRESS" },
      });
      if (claimed.count === 0) return; // already handled (double-click / race)

      await tx.auditLog.create({
        data: {
          shopId:        job.shopId,
          entity:        "appointment",
          entityId:      job.appointmentId,
          appointmentId: job.appointmentId,
          action:        "status_change",
          channel:       "BARBER",
          userId:        payload.userId ?? null,
          before:        { status: "ARRIVAL_CHECK" },
          after:         { status: "IN_PROGRESS" },
        },
      });
    });
  } else {
    // Interactive transaction: only increment noShowCount if the appointment
    // actually transitioned. Prevents double-increment on concurrent "Gelmedi" clicks.
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.appointment.updateMany({
        where: { id: job.appointmentId, status: "ARRIVAL_CHECK" },
        data:  { status: "NOSHOW" },
      });
      if (claimed.count === 0) return; // already handled (double-click / race)

      await tx.client.update({
        where: { id: job.appointment.clientId },
        data:  { noShowCount: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          shopId:        job.shopId,
          entity:        "appointment",
          entityId:      job.appointmentId,
          appointmentId: job.appointmentId,
          action:        "status_change",
          channel:       "BARBER",
          userId:        payload.userId ?? null,
          before:        { status: "ARRIVAL_CHECK" },
          after:         { status: "NOSHOW" },
        },
      });
    });
  }

  return NextResponse.json({ ok: true, action });
});

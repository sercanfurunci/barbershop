import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { queueNotifications, cancelPendingJobs } from "@/lib/notifications";
import { createReviewRequest } from "@/lib/reviews";
import { splitRevenue } from "@/lib/revenue";

export const dynamic = "force-dynamic";

const VALID_STATUSES   = ["PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NOSHOW"];
const PAYMENT_METHODS  = new Set(["CASH","CARD","TRANSFER"]);
const CANCELLED_BY     = new Set(["client","shop","barber"]);

// Allowed status transitions. COMPLETED → CANCELLED is a refund path (metrics
// decremented in tx). CANCELLED can only re-open back to PENDING/CONFIRMED.
// ponytail: explicit map beats a list of forbidden pairs — wrong transitions
// fail loudly instead of silently mutating revenue state.
const TRANSITIONS = {
  PENDING:     new Set(["CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NOSHOW"]),
  CONFIRMED:   new Set(["PENDING","IN_PROGRESS","COMPLETED","CANCELLED","NOSHOW"]),
  IN_PROGRESS: new Set(["CONFIRMED","COMPLETED","CANCELLED"]),
  COMPLETED:   new Set(["CANCELLED"]),
  CANCELLED:   new Set(["PENDING","CONFIRMED"]),
  NOSHOW:      new Set(["PENDING","CONFIRMED"]),
};

export async function PATCH(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { barber: { select: { paymentType: true, commissionRate: true, fixedSalary: true } } },
  });
  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });

  if (payload.role !== "SUPER_ADMIN" && appt.shopId !== payload.shopId) return forbidden();
  if (payload.role === "BARBER" && appt.barberId !== payload.barberId) return forbidden();

  if (appt.status === status) {
    return NextResponse.json(appt); // idempotent no-op
  }
  if (!TRANSITIONS[appt.status]?.has(status)) {
    return NextResponse.json(
      { error: `Geçersiz durum geçişi: ${appt.status} → ${status}` },
      { status: 409 }
    );
  }

  const writeAudit = (after) =>
    prisma.auditLog.create({
      data: {
        shopId: appt.shopId,
        entity: "appointment",
        entityId: id,
        appointmentId: id,
        action: "status_change",
        userId: payload.userId ?? null,
        before: { status: appt.status },
        after,
      },
    }).catch((err) => console.error("[audit status_change]", id, err.message));

  // ── COMPLETED: requires finalPrice, computes split, updates client metrics ──
  if (status === "COMPLETED") {
    const finalPrice = Number(body.finalPrice);
    if (!Number.isFinite(finalPrice) || finalPrice < 0 || finalPrice > 100000) {
      return NextResponse.json({ error: "Geçerli bir fiyat girin (0-100000 TL)" }, { status: 400 });
    }
    const tipAmount = body.tipAmount == null ? 0 : Number(body.tipAmount);
    if (!Number.isFinite(tipAmount) || tipAmount < 0 || tipAmount > 10000) {
      return NextResponse.json({ error: "Geçersiz bahşiş" }, { status: 400 });
    }
    const paymentMethod = body.paymentMethod && PAYMENT_METHODS.has(body.paymentMethod)
      ? body.paymentMethod : null;

    const { barberAmount, shopAmount } = splitRevenue(finalPrice, appt.barber);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Atomic claim: only proceed if still non-COMPLETED. Guards against the
      // double-click race that would otherwise stack Client.totalSpent twice.
      const claimed = await tx.appointment.updateMany({
        where: { id, status: { not: "COMPLETED" } },
        data: {
          status:       "COMPLETED",
          price:        finalPrice,
          grossAmount:  finalPrice,
          barberAmount,
          shopAmount,
          tipAmount,
          paymentMethod,
          completedAt:  now,
        },
      });
      if (claimed.count === 0) return { raced: true };

      await tx.client.update({
        where: { id: appt.clientId },
        data: {
          totalSpent:  { increment: finalPrice + tipAmount },
          visitCount:  { increment: 1 },
          lastVisitAt: now,
        },
      });

      // NOSHOW → COMPLETED is a valid transition; undo the no-show count too.
      if (appt.status === "NOSHOW") {
        await tx.client.update({
          where: { id: appt.clientId },
          data: { noShowCount: { decrement: 1 } },
        });
      }
      return { raced: false };
    });

    const updated = await prisma.appointment.findUnique({ where: { id } });
    if (!result.raced) {
      createReviewRequest(id).catch(() => {});
      writeAudit({ status: "COMPLETED", finalPrice, tipAmount, paymentMethod, barberAmount, shopAmount });
    }
    return NextResponse.json(updated);
  }

  // ── CANCELLED: capture reason + actor; refund Client metrics if was COMPLETED ──
  if (status === "CANCELLED") {
    const cancellationReason = typeof body.cancellationReason === "string"
      ? body.cancellationReason.trim().slice(0, 500) || null : null;
    const cancelledBy = CANCELLED_BY.has(body.cancelledBy) ? body.cancelledBy : null;
    const wasCompleted = appt.status === "COMPLETED";
    const wasNoShow    = appt.status === "NOSHOW"; // not reachable per TRANSITIONS, kept for clarity

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.appointment.update({
        where: { id },
        data: {
          status:      "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason,
          cancelledBy,
        },
      });
      if (wasCompleted) {
        const refund = (appt.grossAmount ?? appt.price ?? 0) + (appt.tipAmount ?? 0);
        await tx.client.update({
          where: { id: appt.clientId },
          data: {
            totalSpent: { decrement: refund },
            visitCount: { decrement: 1 },
          },
        });
      }
      if (wasNoShow) {
        await tx.client.update({
          where: { id: appt.clientId },
          data: { noShowCount: { decrement: 1 } },
        });
      }
      return u;
    });

    await cancelPendingJobs(id);
    queueNotifications(id, "CANCELLED").catch(() => {});
    writeAudit({ status: "CANCELLED", cancellationReason, cancelledBy });
    return NextResponse.json(updated);
  }

  // ── NOSHOW: bumps noShowCount atomically ────────────────────────────────────
  if (status === "NOSHOW") {
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.appointment.update({ where: { id }, data: { status: "NOSHOW" } });
      await tx.client.update({
        where: { id: appt.clientId },
        data: { noShowCount: { increment: 1 } },
      });
      return u;
    });
    writeAudit({ status: "NOSHOW" });
    return NextResponse.json(updated);
  }

  // ── Undo NOSHOW (NOSHOW → PENDING/CONFIRMED) ────────────────────────────────
  if (appt.status === "NOSHOW") {
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.appointment.update({ where: { id }, data: { status } });
      await tx.client.update({
        where: { id: appt.clientId },
        data: { noShowCount: { decrement: 1 } },
      });
      return u;
    });
    if (status === "CONFIRMED") queueNotifications(id, "CONFIRMED").catch(() => {});
    writeAudit({ status });
    return NextResponse.json(updated);
  }

  // ── Plain transition (no metric side-effects) ───────────────────────────────
  const updated = await prisma.appointment.update({ where: { id }, data: { status } });
  if (status === "CONFIRMED") queueNotifications(id, "CONFIRMED").catch(() => {});
  writeAudit({ status });
  return NextResponse.json(updated);
}

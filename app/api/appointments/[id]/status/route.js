import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { queueNotifications, cancelPendingJobs } from "@/lib/notifications";
import { createReviewRequest } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const VALID_STATUSES   = ["PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NOSHOW"];
const PAYMENT_METHODS  = new Set(["CASH","CARD","TRANSFER"]);
const CANCELLED_BY     = new Set(["client","shop","barber"]);

// Split a final price into barber + shop amounts per the barber's commission
// settings. FIXED-salary barbers contribute 100% gross to the shop because
// their pay is handled via fixedSalary, not per-appointment.
function splitRevenue(finalPrice, barber) {
  if (barber.paymentType === "FIXED") {
    return { barberAmount: 0, shopAmount: finalPrice };
  }
  const rate = Math.min(100, Math.max(0, barber.commissionRate ?? 50));
  const barberAmount = Math.round(finalPrice * rate / 100);
  return { barberAmount, shopAmount: finalPrice - barberAmount };
}

// PATCH /api/appointments/:id/status
// Body:
//   { status: "CONFIRMED" | "CANCELLED" | "NOSHOW" | "IN_PROGRESS" | "PENDING" }
//   { status: "COMPLETED", finalPrice: 500, paymentMethod?: "CASH" | "CARD" | "TRANSFER", tipAmount?: 0 }
//   { status: "CANCELLED", cancellationReason?: "...", cancelledBy?: "client"|"shop"|"barber" }
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

  // Shop isolation
  if (payload.role !== "SUPER_ADMIN" && appt.shopId !== payload.shopId) return forbidden();
  if (payload.role === "BARBER" && appt.barberId !== payload.barberId) return forbidden();

  // ── Branch: COMPLETED — requires finalPrice, computes split, updates client ──
  if (status === "COMPLETED" && appt.status !== "COMPLETED") {
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

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.appointment.update({
        where: { id },
        data: {
          status:        "COMPLETED",
          price:         finalPrice, // keep legacy field in sync
          grossAmount:   finalPrice,
          barberAmount,
          shopAmount,
          tipAmount,
          paymentMethod,
          completedAt:   now,
        },
      });
      await tx.client.update({
        where: { id: appt.clientId },
        data: {
          totalSpent:  { increment: finalPrice + tipAmount },
          visitCount:  { increment: 1 },
          lastVisitAt: now,
        },
      });
      return u;
    });

    createReviewRequest(id).catch(() => {});
    return NextResponse.json(updated);
  }

  // ── Branch: CANCELLED — capture reason + actor (both optional) ──────────────
  if (status === "CANCELLED" && appt.status !== "CANCELLED") {
    const cancellationReason = typeof body.cancellationReason === "string"
      ? body.cancellationReason.trim().slice(0, 500) || null : null;
    const cancelledBy = CANCELLED_BY.has(body.cancelledBy) ? body.cancelledBy : null;
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason,
        cancelledBy,
      },
    });
    await cancelPendingJobs(id);
    queueNotifications(id, "CANCELLED").catch(() => {});
    return NextResponse.json(updated);
  }

  // ── Branch: NOSHOW — bumps client.noShowCount ───────────────────────────────
  if (status === "NOSHOW" && appt.status !== "NOSHOW") {
    await prisma.client.update({
      where: { id: appt.clientId },
      data: { noShowCount: { increment: 1 } },
    });
  }
  // Undo no-show (status changes off NOSHOW)
  if (appt.status === "NOSHOW" && status !== "NOSHOW") {
    await prisma.client.update({
      where: { id: appt.clientId },
      data: { noShowCount: { decrement: 1 } },
    });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  if (status === "CONFIRMED") {
    queueNotifications(id, "CONFIRMED").catch(() => {});
  }

  return NextResponse.json(updated);
}

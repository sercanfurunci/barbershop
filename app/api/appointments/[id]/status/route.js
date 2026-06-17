import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { queueNotifications, cancelPendingJobs } from "@/lib/notifications";
import { createReviewRequest } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NOSHOW"];

// PATCH /api/appointments/:id/status
export async function PATCH(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });

  // Shop isolation
  if (payload.role !== "SUPER_ADMIN" && appt.shopId !== payload.shopId) return forbidden();
  if (payload.role === "BARBER" && appt.barberId !== payload.barberId) return forbidden();

  // Track no-shows: increment client counter
  if (status === "NOSHOW" && appt.status !== "NOSHOW") {
    await prisma.client.update({
      where: { id: appt.clientId },
      data: { noShowCount: { increment: 1 } },
    });
  }
  // Undo no-show
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

  // Queue notifications for status changes
  if (status === "CONFIRMED") {
    queueNotifications(id, "CONFIRMED").catch(() => {});
  } else if (status === "CANCELLED") {
    await cancelPendingJobs(id);
    queueNotifications(id, "CANCELLED").catch(() => {});
  } else if (status === "COMPLETED" && appt.status !== "COMPLETED") {
    createReviewRequest(id).catch(() => {});
  }

  return NextResponse.json(updated);
}

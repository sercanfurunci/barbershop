import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST /api/customer/appointments/:id/cancel
// Customers can only cancel PENDING or CONFIRMED appointments they own.
export async function POST(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { clientId: true, phone: true },
  });

  const appt = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, status: true, clientId: true, client: { select: { phone: true } } },
  });

  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });

  // Verify ownership: clientId match or phone match
  const owns =
    (user?.clientId && appt.clientId === user.clientId) ||
    (user?.phone && appt.client?.phone?.includes(user.phone.replace(/\D/g, "")));

  if (!owns) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  if (!["PENDING", "CONFIRMED"].includes(appt.status)) {
    return NextResponse.json({ error: "Bu randevu iptal edilemez" }, { status: 422 });
  }

  const { reason } = await request.json().catch(() => ({}));

  await prisma.appointment.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: "client",
      cancellationReason: reason || null,
    },
  });

  return NextResponse.json({ ok: true });
}

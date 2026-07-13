import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withRole";

// POST /api/customer/appointments/:id/cancel
// Customers can only cancel PENDING or CONFIRMED appointments they own.
export const POST = withAuth(async (request, { params }, payload) => {

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
});

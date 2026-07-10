import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE /api/customer/appointments/:id — customer-initiated cancellation
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const appt = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, status: true, date: true, clientId: true },
  });

  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (!["PENDING", "CONFIRMED"].includes(appt.status)) {
    return NextResponse.json({ error: "Bu randevu iptal edilemez" }, { status: 422 });
  }

  // Verify ownership via user's linked clientId
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { clientId: true },
  });

  if (!user?.clientId || appt.clientId !== user.clientId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}

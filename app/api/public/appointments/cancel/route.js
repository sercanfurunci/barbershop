import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0")  && digits.length === 11) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

// POST /api/public/appointments/cancel
// Body: { appointmentId, phone }
// No auth required — phone ownership validates identity.
// Rate-limited: 10 requests / minute per IP.
export async function POST(request) {
  const ip = getIp(request);
  const rl = await rateLimit(`pub-cancel:${ip}`, { limit: 10, windowMs: 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { appointmentId, phone: rawPhone, reason } = body;
  if (!appointmentId || !rawPhone) {
    return NextResponse.json({ error: "appointmentId ve phone gerekli" }, { status: 400 });
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) return NextResponse.json({ error: "Geçersiz telefon numarası" }, { status: 400 });

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      client: { select: { phone: true } },
    },
  });

  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });

  // Verify phone ownership
  const clientPhone = normalizePhone(appt.client?.phone ?? "");
  if (clientPhone !== phone) {
    return NextResponse.json({ error: "Bu randevu bu numaraya ait değil" }, { status: 403 });
  }

  if (!["PENDING", "CONFIRMED"].includes(appt.status)) {
    return NextResponse.json({ error: "Bu randevu iptal edilemez" }, { status: 422 });
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: "client",
      cancellationReason: typeof reason === "string" ? reason.trim().slice(0, 500) || null : null,
    },
  });

  return NextResponse.json({ ok: true });
}

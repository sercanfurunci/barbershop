import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/check-in/[token] — barber/admin scans QR; marks appointment as checked in.
// Returns appointment summary so the scanner screen can confirm identity.
export async function GET(request, { params }) {
  const { token } = await params;
  if (!token || !/^[a-zA-Z0-9_-]{8,128}$/.test(token)) {
    return NextResponse.json({ error: "QR kodu geçersiz" }, { status: 404 });
  }

  const appt = await prisma.appointment.findFirst({
    where: { checkInToken: token },
    select: {
      id: true,
      date: true,
      time: true,
      status: true,
      checkedInAt: true,
      client:  { select: { name: true, phone: true } },
      barber:  { select: { nameTr: true } },
      service: { select: { nameTr: true } },
      shop:    { select: { name: true, slug: true } },
    },
  });

  if (!appt) return NextResponse.json({ error: "QR kodu geçersiz" }, { status: 404 });

  if (appt.checkedInAt) {
    return NextResponse.json({ ok: true, alreadyCheckedIn: true, appointment: appt });
  }

  // Mark checked in
  await prisma.appointment.update({
    where: { id: appt.id },
    data: { checkedInAt: new Date() },
  });

  return NextResponse.json({ ok: true, alreadyCheckedIn: false, appointment: appt });
}

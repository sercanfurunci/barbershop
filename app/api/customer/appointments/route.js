import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/customer/appointments
// Authenticated appointment history for CUSTOMER accounts.
// Falls back to phone-based lookup if clientId is set on the user.
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { clientId: true, phone: true },
  });

  if (!user) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  // Find all appointments linked to this customer's Client records
  const clientFilter = user.clientId
    ? { clientId: user.clientId }
    : user.phone
      ? { client: { phone: { contains: user.phone.replace(/\D/g, "") } } }
      : null;

  if (!clientFilter) return NextResponse.json([]);

  const appointments = await prisma.appointment.findMany({
    where: { ...clientFilter, status: { not: "IN_PROGRESS" } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    select: {
      id: true,
      date: true,
      time: true,
      duration: true,
      status: true,
      price: true,
      notes: true,
      reviewed: true,
      shop: {
        select: { id: true, name: true, slug: true, address: true, phone: true, googleReviewUrl: true },
      },
      barber: {
        select: { id: true, nameTr: true, avatar: true },
      },
      service: {
        select: { id: true, nameTr: true, duration: true },
      },
    },
  });

  return NextResponse.json(appointments);
}

// PATCH /api/customer/appointments/:id/cancel  (handled in separate route)
// DELETE /api/customer/appointments/:id — customer cancel

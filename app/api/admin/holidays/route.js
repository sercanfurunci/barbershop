import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

// GET /api/admin/holidays?barberId=brb-1  (optional filter)
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "RECEPTIONIST") return forbidden();

  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barberId");

  const where = barberId ? { OR: [{ barberId }, { barberId: null }] } : {};
  const holidays = await prisma.holiday.findMany({
    where,
    orderBy: { date: "asc" },
    include: { barber: { select: { id: true, nameTr: true } } },
  });
  return NextResponse.json(holidays);
}

// POST /api/admin/holidays
// body: { date, label?, barberId? }
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "RECEPTIONIST") return forbidden();

  const { date, label, barberId } = await request.json();

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Geçerli tarih gerekli (YYYY-MM-DD)" }, { status: 400 });
  }

  const holiday = await prisma.holiday.create({
    data: {
      date,
      label: label || "Tatil",
      barberId: barberId || null,
    },
    include: { barber: { select: { id: true, nameTr: true } } },
  });

  return NextResponse.json(holiday, { status: 201 });
}

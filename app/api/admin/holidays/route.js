import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

// GET /api/admin/holidays?barberId=brb-1  (optional filter)
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "RECEPTIONIST" && payload.role !== "SUPER_ADMIN") return forbidden();

  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barberId");

  // SUPER_ADMIN sees all shops; others scoped to their shop
  const shopFilter =
    payload.role === "SUPER_ADMIN"
      ? (searchParams.get("shopId") ? { shopId: searchParams.get("shopId") } : {})
      : { shopId: payload.shopId };

  const where = {
    ...shopFilter,
    ...(barberId ? { OR: [{ barberId }, { barberId: null }] } : {}),
  };

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
  if (!payload.shopId) return forbidden();

  const { date, label, barberId } = await request.json();

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Geçerli tarih gerekli (YYYY-MM-DD)" }, { status: 400 });
  }
  // Reject Feb 30, Apr 31, etc. by round-trip check.
  const d = new Date(date + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  // If a barber is specified, ensure they belong to the caller's shop
  if (barberId) {
    const barber = await prisma.barber.findFirst({
      where: { id: barberId, shopId: payload.shopId },
      select: { id: true },
    });
    if (!barber) return forbidden();
  }

  const holiday = await prisma.holiday.create({
    data: {
      shopId:  payload.shopId,
      date,
      label:   label || "Tatil",
      barberId: barberId || null,
    },
    include: { barber: { select: { id: true, nameTr: true } } },
  });

  return NextResponse.json(holiday, { status: 201 });
}

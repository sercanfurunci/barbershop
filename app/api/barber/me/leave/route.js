import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

const BARBER_ROLES = ["BARBER", "ADMIN", "SUPER_ADMIN"];

function validDate(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// GET /api/barber/me/leave — upcoming leaves for this barber
export const GET = withRole(BARBER_ROLES, async (request, _ctx, payload) => {
  if (!payload.barberId) return forbidden();

  const today = todayStr();
  const leaves = await prisma.holiday.findMany({
    where: { barberId: payload.barberId, date: { gte: today } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(leaves);
});

// POST /api/barber/me/leave — create leave range for self
// body: { startDate, endDate, label? }
export const POST = withRole(BARBER_ROLES, async (request, _ctx, payload) => {
  if (!payload.barberId) return forbidden();

  const barber = await prisma.barber.findUnique({
    where: { id: payload.barberId },
    select: { shopId: true },
  });
  if (!barber) return forbidden();

  const { startDate, endDate, label } = await request.json();

  if (!validDate(startDate) || !validDate(endDate)) {
    return NextResponse.json({ error: "Geçerli başlangıç ve bitiş tarihi gerekli (YYYY-MM-DD)" }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: "Bitiş tarihi başlangıç tarihinden önce olamaz" }, { status: 400 });
  }
  const start    = new Date(startDate + "T00:00:00Z");
  const end      = new Date(endDate   + "T00:00:00Z");
  const diffDays = Math.round((end - start) / 86400000) + 1;
  if (diffDays > 90) {
    return NextResponse.json({ error: "İzin süresi en fazla 90 gün olabilir" }, { status: 400 });
  }

  const dates = Array.from({ length: diffDays }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });

  await prisma.holiday.createMany({
    data: dates.map((date) => ({
      shopId:   barber.shopId,
      barberId: payload.barberId,
      date,
      label:    label?.trim() || "İzin",
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true, count: dates.length }, { status: 201 });
});

// DELETE /api/barber/me/leave — remove all upcoming leaves for self
export const DELETE = withRole(BARBER_ROLES, async (request, _ctx, payload) => {
  if (!payload.barberId) return forbidden();

  const { searchParams } = new URL(request.url);
  const holidayId = searchParams.get("id");
  const today     = todayStr();

  if (holidayId) {
    // Delete specific holiday (only if it belongs to this barber)
    await prisma.holiday.deleteMany({
      where: { id: holidayId, barberId: payload.barberId },
    });
  } else {
    // Clear all upcoming
    await prisma.holiday.deleteMany({
      where: { barberId: payload.barberId, date: { gte: today } },
    });
  }
  return NextResponse.json({ ok: true });
});

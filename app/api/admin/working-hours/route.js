import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];

// GET /api/admin/working-hours?barberId=brb-1
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "RECEPTIONIST") return forbidden();

  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barberId");

  if (barberId) {
    const wh = await prisma.workingHours.findUnique({ where: { barberId } });
    return NextResponse.json(wh ?? {});
  }

  // Return all barbers with their working hours
  const barbers = await prisma.barber.findMany({
    include: { workingHours: true, breaks: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(barbers);
}

// PATCH /api/admin/working-hours
// body: { barberId, mon: { start: 540, end: 1080 }, ... }
export async function PATCH(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "RECEPTIONIST") return forbidden();

  const body = await request.json();
  const { barberId, ...days } = body;

  if (!barberId) return NextResponse.json({ error: "barberId gerekli" }, { status: 400 });

  const data = {};
  for (const day of DAYS) {
    if (days[day] !== undefined) {
      data[`${day}Start`] = days[day].start ?? null;
      data[`${day}End`]   = days[day].end   ?? null;
    }
  }

  const wh = await prisma.workingHours.upsert({
    where: { barberId },
    update: data,
    create: { barberId, ...data },
  });

  return NextResponse.json(wh);
}

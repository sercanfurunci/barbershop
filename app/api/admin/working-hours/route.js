import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "RECEPTIONIST"];

// GET /api/admin/working-hours?barberId=brb-1
export const GET = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopFilter = payload.role === "SUPER_ADMIN" ? {} : { shopId: payload.shopId };

  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barberId");

  if (barberId) {
    // Verify the barber belongs to the caller's shop
    const barber = await prisma.barber.findFirst({
      where: { id: barberId, ...shopFilter },
      select: { id: true },
    });
    if (!barber) return NextResponse.json({}, { status: 404 });
    const wh = await prisma.workingHours.findUnique({ where: { barberId } });
    return NextResponse.json(wh ?? {});
  }

  const barbers = await prisma.barber.findMany({
    where: shopFilter,
    include: { workingHours: true, breaks: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(barbers);
});

// PATCH /api/admin/working-hours
// body: { barberId, mon: { start: 540, end: 1080 }, ... }
export const PATCH = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopFilter = payload.role === "SUPER_ADMIN" ? {} : { shopId: payload.shopId };

  const body = await request.json();
  const { barberId, ...days } = body;

  if (!barberId) return NextResponse.json({ error: "barberId gerekli" }, { status: 400 });

  // Verify barber belongs to caller's shop before mutating
  const barber = await prisma.barber.findFirst({
    where: { id: barberId, ...shopFilter },
    select: { id: true },
  });
  if (!barber) return forbidden();

  const data = {};
  for (const day of DAYS) {
    if (days[day] !== undefined) {
      data[`${day}Start`] = days[day].start ?? null;
      data[`${day}End`]   = days[day].end   ?? null;
    }
  }

  const wh = await prisma.workingHours.upsert({
    where:  { barberId },
    update: data,
    create: { barberId, ...data },
  });

  return NextResponse.json(wh);
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";
import { cacheInvalidate } from "@/lib/ai/cache";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "RECEPTIONIST"];

// GET /api/admin/holidays?barberId=brb-1  (optional filter)
export const GET = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {

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
});

// POST /api/admin/holidays
// body: { date, label?, barberId? }           — single day
//    OR { startDate, endDate, label?, barberId? } — date range (max 180 days)
export const POST = withRole(["ADMIN", "RECEPTIONIST"], async (request, _ctx, payload) => {
  if (!payload.shopId) return forbidden();

  const body = await request.json();
  const { label, barberId } = body;

  function validDate(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + "T00:00:00Z");
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }

  // If a barber is specified, ensure they belong to the caller's shop
  if (barberId) {
    const barber = await prisma.barber.findFirst({
      where: { id: barberId, shopId: payload.shopId },
      select: { id: true },
    });
    if (!barber) return forbidden();
  }

  // Range mode
  if (body.startDate || body.endDate) {
    if (!validDate(body.startDate) || !validDate(body.endDate)) {
      return NextResponse.json({ error: "Geçerli başlangıç ve bitiş tarihi gerekli (YYYY-MM-DD)" }, { status: 400 });
    }
    if (body.endDate < body.startDate) {
      return NextResponse.json({ error: "Bitiş tarihi başlangıç tarihinden önce olamaz" }, { status: 400 });
    }
    const start = new Date(body.startDate + "T00:00:00Z");
    const end   = new Date(body.endDate   + "T00:00:00Z");
    const diffDays = Math.round((end - start) / 86400000) + 1;
    if (diffDays > 180) {
      return NextResponse.json({ error: "İzin süresi en fazla 180 gün olabilir" }, { status: 400 });
    }
    const dates = Array.from({ length: diffDays }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
    await prisma.holiday.createMany({
      data: dates.map((date) => ({
        shopId: payload.shopId,
        date,
        label: label || "İzin",
        barberId: barberId || null,
      })),
      skipDuplicates: true,
    });
    cacheInvalidate(`dynctx:${payload.shopId}`);
    return NextResponse.json({ ok: true, count: dates.length }, { status: 201 });
  }

  // Single day mode
  const { date } = body;
  if (!validDate(date)) {
    return NextResponse.json({ error: "Geçerli tarih gerekli (YYYY-MM-DD)" }, { status: 400 });
  }

  const holiday = await prisma.holiday.create({
    data: {
      shopId:   payload.shopId,
      date,
      label:    label || "Tatil",
      barberId: barberId || null,
    },
    include: { barber: { select: { id: true, nameTr: true } } },
  });

  cacheInvalidate(`dynctx:${payload.shopId}`);
  return NextResponse.json(holiday, { status: 201 });
});

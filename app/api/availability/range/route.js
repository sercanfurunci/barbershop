import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayStr, nowMinutes } from "@/lib/utils";

// Returns per-day availability status for a date range so the booking calendar
// can render closed / holiday / fully-booked days without a round-trip per day.
//
//   GET /api/availability/range
//     ?shopId=...&barberId=<id|any>&serviceId=...&start=YYYY-MM-DD&days=60
//
// Response:
//   { days: { "YYYY-MM-DD": { status, label?, openSlots? }, ... } }
//   status ∈ "working" | "closed" | "holiday" | "fullyBooked" | "past"

const SLOT_INTERVAL = 30;
const DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function addDaysStr(dateStr, delta) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// Count how many bookable slot starts fit in the working window that don't
// overlap a break or an existing appointment. Used to decide fullyBooked.
function countOpenSlots({ wh, breaks, appointments, dateStr, duration, isToday, nowMin }) {
  const dow = new Date(dateStr + "T12:00:00Z").getUTCDay();
  const dowKey = DAY_MAP[dow];
  const dayStart = wh?.[`${dowKey}Start`];
  const dayEnd = wh?.[`${dowKey}End`];
  if (dayStart == null || dayEnd == null) return { closed: true, open: 0 };

  const blocked = breaks
    .filter(b => (b.date ? b.date === dateStr : (b.dayOfWeek == null || b.dayOfWeek === dow)))
    .map(b => ({ start: timeToMin(b.start), end: timeToMin(b.end) }));

  for (const a of appointments) {
    if (a.date !== dateStr) continue;
    if (["CANCELLED", "NOSHOW"].includes(a.status)) continue;
    const s = timeToMin(a.time);
    blocked.push({ start: s, end: s + a.duration });
  }

  const floor = isToday ? nowMin + 30 : 0;
  let open = 0;
  for (let t = dayStart; t + duration <= dayEnd; t += SLOT_INTERVAL) {
    if (t < floor) continue;
    const end = t + duration;
    if (!blocked.some(b => t < b.end && end > b.start)) open++;
  }
  return { closed: false, open };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const barberId = searchParams.get("barberId");
  const serviceId = searchParams.get("serviceId");
  const start = searchParams.get("start");
  const days = Math.min(Math.max(parseInt(searchParams.get("days") ?? "60") || 60, 1), 90);

  if (!shopId || !barberId || !serviceId || !start) {
    return NextResponse.json({ error: "shopId, barberId, serviceId, start gerekli" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    return NextResponse.json({ error: "Geçersiz start formatı (YYYY-MM-DD)" }, { status: 400 });
  }

  const end = addDaysStr(start, days - 1);
  const service = await prisma.service.findFirst({ where: { id: serviceId, shopId } });
  if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });

  // barberId=any → aggregate across all available barbers in the shop
  const barbers = barberId === "any"
    ? await prisma.barber.findMany({
        where: { shopId, available: true },
        include: { workingHours: true, breaks: true },
      })
    : await prisma.barber.findMany({
        where: { id: barberId, shopId },
        include: { workingHours: true, breaks: true },
      });

  if (barbers.length === 0) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });

  const barberIds = barbers.map(b => b.id);
  const [appointments, holidays] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        shopId,
        barberId: { in: barberIds },
        date: { gte: start, lte: end },
      },
      select: { barberId: true, date: true, time: true, duration: true, status: true },
    }),
    prisma.holiday.findMany({
      where: {
        shopId,
        date: { gte: start, lte: end },
        OR: [{ barberId: { in: barberIds } }, { barberId: null }],
      },
      select: { barberId: true, date: true, label: true },
    }),
  ]);

  // Index appointments by barber
  const apptByBarber = new Map(barberIds.map(id => [id, []]));
  for (const a of appointments) apptByBarber.get(a.barberId).push(a);

  // Index holidays: shop-wide (barberId=null) applies to all; per-barber only to that barber.
  const shopHolidayByDate = new Map();
  const barberHolidayByDate = new Map(barberIds.map(id => [id, new Map()]));
  for (const h of holidays) {
    if (h.barberId == null) shopHolidayByDate.set(h.date, h.label);
    else barberHolidayByDate.get(h.barberId).set(h.date, h.label);
  }

  const today = todayStr();
  const nowMin = nowMinutes();

  const result = {};
  for (let i = 0; i < days; i++) {
    const dateStr = addDaysStr(start, i);

    if (dateStr < today) { result[dateStr] = { status: "past" }; continue; }

    // Shop-wide holiday closes everyone
    if (shopHolidayByDate.has(dateStr)) {
      result[dateStr] = { status: "holiday", label: shopHolidayByDate.get(dateStr) };
      continue;
    }

    // Per-barber roll-up
    let anyWorking = false;
    let anyOpenSlot = false;
    let allOnHoliday = true;
    let firstHolidayLabel = null;

    for (const b of barbers) {
      const onHoliday = barberHolidayByDate.get(b.id).has(dateStr);
      if (onHoliday) {
        if (!firstHolidayLabel) firstHolidayLabel = barberHolidayByDate.get(b.id).get(dateStr);
        continue;
      }
      allOnHoliday = false;

      const { closed, open } = countOpenSlots({
        wh: b.workingHours,
        breaks: b.breaks,
        appointments: apptByBarber.get(b.id),
        dateStr,
        duration: service.duration,
        isToday: dateStr === today,
        nowMin,
      });
      if (closed) continue;
      anyWorking = true;
      if (open > 0) { anyOpenSlot = true; break; }
    }

    if (allOnHoliday) result[dateStr] = { status: "holiday", label: firstHolidayLabel ?? "Tatil" };
    else if (!anyWorking) result[dateStr] = { status: "closed" };
    else if (!anyOpenSlot) result[dateStr] = { status: "fullyBooked" };
    else result[dateStr] = { status: "working" };
  }

  const res = NextResponse.json({ days: result });
  // Match single-day cache; conflict-check on POST is authoritative anyway.
  res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=30");
  return res;
}

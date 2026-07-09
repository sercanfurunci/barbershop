import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SLOT_INTERVAL = 30;
const DAY_MAP = ["sun","mon","tue","wed","thu","fri","sat"];

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function addDays(isoDate, n) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function firstSlot({ workingHours, breaks, appointments, date, duration, todayStr, nowMin }) {
  const dow = new Date(date + "T12:00:00").getDay();
  const dowKey = DAY_MAP[dow];
  const dayStart = workingHours[`${dowKey}Start`];
  const dayEnd   = workingHours[`${dowKey}End`];
  if (dayStart == null || dayEnd == null) return null;

  const blocked = breaks
    .filter(b => b.date ? b.date === date : (b.dayOfWeek == null || b.dayOfWeek === dow))
    .map(b => ({ start: timeToMin(b.start), end: timeToMin(b.end) }));

  for (const a of appointments) {
    if (["CANCELLED","NOSHOW"].includes(a.status)) continue;
    const s = timeToMin(a.time);
    blocked.push({ start: s, end: s + a.duration });
  }

  const minStart = date === todayStr ? nowMin + 30 : 0;

  for (let t = dayStart; t + duration <= dayEnd; t += SLOT_INTERVAL) {
    if (t < minStart) continue;
    if (!blocked.some(b => t < b.end && t + duration > b.start)) return minToTime(t);
  }
  return null;
}

// GET /api/shops/first-available?shopId=xxx
// Returns { date, time, barberName } or { date: null }
export async function GET(request) {
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ date: null });

  // Turkey UTC+3 year-round
  const trNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const todayStr = trNow.toISOString().slice(0, 10);
  const nowMin = trNow.getUTCHours() * 60 + trNow.getUTCMinutes();

  const barbers = await prisma.barber.findMany({
    where: { shopId, available: true },
    select: {
      id: true, nameTr: true,
      workingHours: true,
      breaks: true,
    },
  });

  if (!barbers.length) return NextResponse.json({ date: null });

  // Use a default 30-min duration for "first available" check
  const DURATION = 30;

  // Check today + next 6 days
  const dates = Array.from({ length: 7 }, (_, i) => addDays(todayStr, i));

  // Bulk fetch holidays for the shop across these dates
  const holidays = await prisma.holiday.findMany({
    where: { shopId, date: { in: dates } },
    select: { date: true, barberId: true },
  });
  const shopHolidayDates = new Set(holidays.filter(h => h.barberId == null).map(h => h.date));
  const barberHolidayMap = new Map(); // barberId+date -> true
  holidays.forEach(h => { if (h.barberId) barberHolidayMap.set(`${h.barberId}|${h.date}`, true); });

  // Bulk fetch existing appointments for all barbers across these dates
  const appts = await prisma.appointment.findMany({
    where: { shopId, date: { in: dates }, barberId: { in: barbers.map(b => b.id) } },
    select: { barberId: true, date: true, time: true, duration: true, status: true },
  });
  const apptMap = new Map(); // `barberId|date` -> appt[]
  for (const a of appts) {
    const key = `${a.barberId}|${a.date}`;
    if (!apptMap.has(key)) apptMap.set(key, []);
    apptMap.get(key).push(a);
  }

  for (const date of dates) {
    if (shopHolidayDates.has(date)) continue;
    for (const barber of barbers) {
      if (!barber.workingHours) continue;
      if (barberHolidayMap.has(`${barber.id}|${date}`)) continue;
      const time = firstSlot({
        workingHours: barber.workingHours,
        breaks: barber.breaks,
        appointments: apptMap.get(`${barber.id}|${date}`) ?? [],
        date,
        duration: DURATION,
        todayStr,
        nowMin,
      });
      if (time) return NextResponse.json({ date, time, barberName: barber.nameTr });
    }
  }

  return NextResponse.json({ date: null });
}

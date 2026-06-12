import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayStr, nowMinutes } from "@/lib/utils";

const SLOT_INTERVAL = 30; // minutes

const DAY_MAP = ["sun","mon","tue","wed","thu","fri","sat"];

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// WorkingHours values are stored as minutes from midnight (540 = 09:00)
function computeSlots(workingHours, breaks, bookedAppointments, date, serviceDuration) {
  const dow      = new Date(date + "T12:00:00").getDay(); // 0=Sun … 6=Sat
  const dowKey   = DAY_MAP[dow];
  const dayStart = workingHours[`${dowKey}Start`]; // already in minutes
  const dayEnd   = workingHours[`${dowKey}End`];

  if (dayStart == null || dayEnd == null) return []; // day off

  // Blocked intervals: breaks filtered by dayOfWeek
  const blocked = breaks
    .filter(b => b.dayOfWeek == null || b.dayOfWeek === dow)
    .map(b => ({ start: timeToMin(b.start), end: timeToMin(b.end) }));

  // Add booked appointments
  for (const appt of bookedAppointments) {
    if (["CANCELLED", "NOSHOW"].includes(appt.status)) continue;
    const s = timeToMin(appt.time);
    blocked.push({ start: s, end: s + appt.duration });
  }

  const isToday = date === todayStr();
  const nowMin  = isToday ? nowMinutes() + 60 : 0;

  const slots = [];
  for (let t = dayStart; t + serviceDuration <= dayEnd; t += SLOT_INTERVAL) {
    if (t < nowMin) continue;
    const slotEnd = t + serviceDuration;
    const overlaps = blocked.some(b => t < b.end && slotEnd > b.start);
    if (!overlaps) slots.push(minToTime(t));
  }

  return slots;
}

// GET /api/availability?barberId=brb-1&serviceId=svc-1&date=2026-06-10
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const barberId  = searchParams.get("barberId");
  const serviceId = searchParams.get("serviceId");
  const date      = searchParams.get("date");

  if (!barberId || !serviceId || !date) {
    return NextResponse.json({ error: "barberId, serviceId ve date gerekli" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Geçersiz tarih formatı (YYYY-MM-DD)" }, { status: 400 });
  }

  const [barber, service, bookedAppointments, holidays] = await Promise.all([
    prisma.barber.findUnique({
      where: { id: barberId },
      include: { workingHours: true, breaks: true },
    }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.appointment.findMany({
      where: { barberId, date },
      select: { time: true, duration: true, status: true },
    }),
    prisma.holiday.findMany({
      where: {
        date,
        OR: [{ barberId }, { barberId: null }],
      },
    }),
  ]);

  if (!barber)   return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });
  if (!service)  return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });
  if (!barber.workingHours) return NextResponse.json({ slots: [] });

  // Holiday = no slots
  if (holidays.length > 0) {
    return NextResponse.json({ slots: [], holiday: holidays[0].label });
  }

  const slots = computeSlots(
    barber.workingHours,
    barber.breaks,
    bookedAppointments,
    date,
    service.duration
  );

  return NextResponse.json({ slots, date, barberId, serviceId });
}

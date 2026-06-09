import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SLOT_INTERVAL = 30; // minutes

const DAY_MAP = ["sun","mon","tue","wed","thu","fri","sat"];

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Returns array of "HH:MM" slot start times available for a barber on a date
function computeSlots(workingHours, breaks, bookedAppointments, date, serviceDuration) {
  const dow = DAY_MAP[new Date(date + "T12:00:00").getDay()];
  const startH = workingHours[`${dow}Start`];
  const endH   = workingHours[`${dow}End`];

  // Day off
  if (startH == null || endH == null) return [];

  const dayStart = startH * 60;
  const dayEnd   = endH   * 60;

  // Build blocked intervals from breaks
  const blocked = breaks.map(b => ({
    start: timeToMin(b.start),
    end:   timeToMin(b.end),
  }));

  // Add booked appointments as blocked intervals
  for (const appt of bookedAppointments) {
    if (["cancelled", "noshow"].includes(appt.status.toLowerCase())) continue;
    const s = timeToMin(appt.time);
    blocked.push({ start: s, end: s + appt.duration });
  }

  const now = new Date();
  const isToday = date === now.toISOString().split("T")[0];
  const nowMin  = isToday ? now.getHours() * 60 + now.getMinutes() + 60 : 0; // +60 min buffer

  const slots = [];
  for (let t = dayStart; t + serviceDuration <= dayEnd; t += SLOT_INTERVAL) {
    // Past check
    if (t < nowMin) continue;

    // Overlap check: slot [t, t+serviceDuration) must not overlap any blocked interval
    const slotEnd = t + serviceDuration;
    const overlaps = blocked.some(b => t < b.end && slotEnd > b.start);
    if (!overlaps) slots.push(minToTime(t));
  }

  return slots;
}

// GET /api/availability?barberId=brb-1&serviceId=svc-1&date=2026-06-10
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const barberId    = searchParams.get("barberId");
  const serviceId   = searchParams.get("serviceId");
  const date        = searchParams.get("date");

  if (!barberId || !serviceId || !date) {
    return NextResponse.json({ error: "barberId, serviceId ve date gerekli" }, { status: 400 });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Geçersiz tarih formatı (YYYY-MM-DD)" }, { status: 400 });
  }

  const [barber, service, bookedAppointments] = await Promise.all([
    prisma.barber.findUnique({
      where: { id: barberId },
      include: { workingHours: true, breaks: true },
    }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.appointment.findMany({
      where: { barberId, date, status: { notIn: ["CANCELLED", "NOSHOW"] } },
      select: { time: true, duration: true, status: true },
    }),
  ]);

  if (!barber) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });
  if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });
  if (!barber.workingHours) return NextResponse.json({ slots: [] });

  const slots = computeSlots(
    barber.workingHours,
    barber.breaks,
    bookedAppointments,
    date,
    service.duration
  );

  return NextResponse.json({ slots, date, barberId, serviceId });
}

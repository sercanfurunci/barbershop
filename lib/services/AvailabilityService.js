/**
 * AvailabilityService — single source of truth for slot generation and validation.
 *
 * Used by:
 *   - lib/ai/handlers.js  (AI tool calls: GetAvailability, FindAvailableSlots)
 *   - lib/booking.js       (validateBookingWindow before creating appointments)
 *
 * Guarantees: always returns an array or a structured result — never null/undefined.
 * debugLog is attached to every result for developer diagnostics; never show to customer.
 */

import { prisma } from "@/lib/prisma";
import { todayStr, nowMinutes } from "@/lib/utils";

const SLOT_INTERVAL = 30; // minutes between slot start times
const DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Get all available appointment slots for a specific barber on a date.
 *
 * @param {{ shopId: string, barberId: string, serviceId?: string, date: string }} params
 * @returns {Promise<{
 *   slots: string[],
 *   reason?: "closed"|"holiday"|"no_working_hours"|"barber_not_found",
 *   label?: string,
 *   date: string,
 *   debugLog: string[],
 * }>}
 */
export async function getAvailableSlots({ shopId, barberId, serviceId, date }) {
  const today    = todayStr();
  const debugLog = [];

  const [barber, service, existingAppts, holidays] = await Promise.all([
    prisma.barber.findFirst({
      where:   { id: barberId, shopId },
      include: { workingHours: true, breaks: true },
    }),
    serviceId ? prisma.service.findFirst({ where: { id: serviceId, shopId } }) : null,
    prisma.appointment.findMany({
      where:  { barberId, date, status: { notIn: ["CANCELLED", "NOSHOW"] } },
      select: { time: true, duration: true },
    }),
    prisma.holiday.findMany({
      where: { shopId, date, OR: [{ barberId }, { barberId: null }] },
    }),
  ]);

  const duration = service?.duration ?? 30;
  debugLog.push(`Service duration: ${duration} min`);

  if (!barber) {
    debugLog.push("ERROR: barber not found in shop");
    return { slots: [], reason: "barber_not_found", date, debugLog };
  }

  if (!barber.workingHours) {
    debugLog.push("Working hours: NOT CONFIGURED");
    return { slots: [], reason: "no_working_hours", date, debugLog };
  }
  debugLog.push("Working hours: found ✓");

  if (holidays.length > 0) {
    debugLog.push(`Holiday: "${holidays[0].label}" ✓`);
    return { slots: [], reason: "holiday", label: holidays[0].label, date, debugLog };
  }
  debugLog.push("Holidays: none ✓");

  const dow      = new Date(date + "T12:00:00Z").getUTCDay();
  const dowKey   = DAY_MAP[dow];
  const wh       = barber.workingHours;
  const dayStart = wh[`${dowKey}Start`];
  const dayEnd   = wh[`${dowKey}End`];

  if (dayStart == null || dayEnd == null) {
    debugLog.push(`Day ${dowKey}: closed (no hours configured)`);
    return { slots: [], reason: "closed", date, debugLog };
  }
  debugLog.push(`Working: ${minToTime(dayStart)}-${minToTime(dayEnd)} ✓`);

  // Blocked intervals: breaks + existing appointments
  const blocked = [];

  const activeBreaks = barber.breaks.filter(
    b => b.date ? b.date === date : b.dayOfWeek == null || b.dayOfWeek === dow,
  );
  for (const b of activeBreaks) {
    blocked.push({ start: timeToMin(b.start), end: timeToMin(b.end) });
  }
  debugLog.push(`Breaks: ${activeBreaks.length} ✓`);

  for (const a of existingAppts) {
    const s = timeToMin(a.time);
    blocked.push({ start: s, end: s + a.duration });
  }
  debugLog.push(`Existing appointments: ${existingAppts.length} ✓`);

  // Floor: skip already-passed slots on today
  const nowMin = date === today ? nowMinutes() : -Infinity;
  const floor  = nowMin + 30;

  const slots = [];
  for (let t = dayStart; t + duration <= dayEnd; t += SLOT_INTERVAL) {
    if (date === today && t < floor) continue;
    const slotEnd = t + duration;
    if (!blocked.some(b => t < b.end && slotEnd > b.start)) {
      slots.push(minToTime(t));
    }
  }

  debugLog.push(`Generated slots: ${slots.length}`);
  return { slots, date, debugLog };
}

/**
 * Get available slots across ALL active barbers in a shop for a given date.
 * Returns one entry per barber, each with its own slot array and reason.
 *
 * @param {{ shopId: string, serviceId?: string, date: string }} params
 * @returns {Promise<{
 *   results: Array<{ barberId: string, barberName: string, slots: string[], reason?: string }>,
 *   reason?: "holiday",
 *   label?: string,
 *   date: string,
 * }>}
 */
export async function getAllBarbersSlots({ shopId, serviceId, date }) {
  const [barbers, shopHolidays] = await Promise.all([
    prisma.barber.findMany({
      where:   { shopId, available: true },
      select:  { id: true, nameTr: true },
      orderBy: { nameTr: "asc" },
    }),
    prisma.holiday.findMany({ where: { shopId, date, barberId: null } }),
  ]);

  if (shopHolidays.length > 0) {
    return { results: [], reason: "holiday", label: shopHolidays[0].label, date };
  }

  const results = await Promise.all(
    barbers.map(async (b) => {
      const r = await getAvailableSlots({ shopId, barberId: b.id, serviceId, date });
      return { barberId: b.id, barberName: b.nameTr, slots: r.slots, reason: r.reason };
    }),
  );

  return { results, date };
}

/**
 * Validate a single booking slot against working hours, breaks, and holidays.
 * Does NOT check appointment collisions — that is done inside the serializable tx
 * in BookingService to avoid TOCTOU on the booked-appointments set.
 *
 * @param {{ shopId: string, barberId: string, date: string, startMin: number, durationMin: number }} params
 * @returns {Promise<{ ok: boolean, status?: number, error?: string }>}
 */
export async function validateSlot({ shopId, barberId, date, startMin, durationMin }) {
  const endMin = startMin + durationMin;
  const dow    = new Date(date + "T12:00:00Z").getUTCDay();
  const dowKey = DAY_MAP[dow];

  const [wh, breaks, holidays] = await Promise.all([
    prisma.workingHours.findUnique({ where: { barberId } }),
    prisma.barberBreak.findMany({ where: { barberId } }),
    prisma.holiday.findMany({
      where: { shopId, date, OR: [{ barberId }, { barberId: null }] },
    }),
  ]);

  if (holidays.length > 0) return { ok: false, status: 409, error: `Bu gün tatil: ${holidays[0].label}` };
  if (!wh)                  return { ok: false, status: 409, error: "Berberin çalışma saatleri tanımlı değil." };

  const dayStart = wh[`${dowKey}Start`];
  const dayEnd   = wh[`${dowKey}End`];

  if (dayStart == null || dayEnd == null)          return { ok: false, status: 409, error: "Berber bu gün çalışmıyor." };
  if (startMin < dayStart || endMin > dayEnd)      return { ok: false, status: 409, error: "Seçilen saat çalışma saatleri dışında." };

  const blocking = breaks.filter(b => b.date ? b.date === date : (b.dayOfWeek == null || b.dayOfWeek === dow));
  const breakOverlap = blocking.some(b => {
    const bs = timeToMin(b.start);
    const be = timeToMin(b.end);
    return startMin < be && endMin > bs;
  });
  if (breakOverlap) return { ok: false, status: 409, error: "Bu saat berberin mola aralığına denk geliyor." };

  return { ok: true };
}

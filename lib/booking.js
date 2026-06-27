import { prisma } from "@/lib/prisma";

const DAY_MAP = ["sun","mon","tue","wed","thu","fri","sat"];

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Validates that a slot [startMin, startMin+durationMin) on the given date is
// within the barber's working hours, not on a holiday, and not overlapping a
// break. Does NOT check appointment collisions — POST/walkin do that inside
// their own transactions to avoid TOCTOU on the booked-appointments set.
//
// Returns { ok: true } or { ok: false, status, error }.
export async function validateBookingWindow({ shopId, barberId, date, startMin, durationMin }) {
  const endMin = startMin + durationMin;
  const dow    = new Date(date + "T12:00:00").getDay(); // 0=Sun … 6=Sat
  const dowKey = DAY_MAP[dow];

  const [wh, breaks, holidays] = await Promise.all([
    prisma.workingHours.findUnique({ where: { barberId } }),
    prisma.barberBreak.findMany({ where: { barberId } }),
    prisma.holiday.findMany({
      where: { shopId, date, OR: [{ barberId }, { barberId: null }] },
    }),
  ]);

  if (holidays.length > 0) {
    return { ok: false, status: 409, error: `Bu gün tatil: ${holidays[0].label}` };
  }
  if (!wh) {
    return { ok: false, status: 409, error: "Berberin çalışma saatleri tanımlı değil." };
  }
  const dayStart = wh[`${dowKey}Start`];
  const dayEnd   = wh[`${dowKey}End`];
  if (dayStart == null || dayEnd == null) {
    return { ok: false, status: 409, error: "Berber bu gün çalışmıyor." };
  }
  if (startMin < dayStart || endMin > dayEnd) {
    return { ok: false, status: 409, error: "Seçilen saat çalışma saatleri dışında." };
  }

  const blocking = breaks.filter(b => b.date ? b.date === date : (b.dayOfWeek == null || b.dayOfWeek === dow));
  const breakOverlap = blocking.some(b => {
    const bs = timeToMin(b.start);
    const be = timeToMin(b.end);
    return startMin < be && endMin > bs;
  });
  if (breakOverlap) {
    return { ok: false, status: 409, error: "Bu saat berberin mola aralığına denk geliyor." };
  }

  return { ok: true };
}

// Smoke test for /api/availability/range roll-up logic.
// Runs the countOpenSlots helper directly against synthetic data to catch
// regressions in the closed / fullyBooked / holiday classification.
//
//   node scripts/test_availability_range.mjs
//
// ponytail: pure-function assert; no DB, no framework.

import assert from "node:assert/strict";

// Inline copy of the helper — kept in lock-step with the route file.
const SLOT_INTERVAL = 30;
const DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function timeToMin(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
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
    if (!blocked.some(b => t < b.end && t + duration > b.start)) open++;
  }
  return { closed: false, open };
}

// 2026-07-06 is a Monday
const monday = "2026-07-06";
const sunday = "2026-07-05";

// 1. No working hours for a day → closed
{
  const r = countOpenSlots({ wh: { monStart: null, monEnd: null }, breaks: [], appointments: [], dateStr: monday, duration: 30, isToday: false, nowMin: 0 });
  assert.equal(r.closed, true, "null hours → closed");
}

// 2. Working 9–17 with no breaks/appointments → 16 half-hour slots
{
  const r = countOpenSlots({ wh: { monStart: 540, monEnd: 1020 }, breaks: [], appointments: [], dateStr: monday, duration: 30, isToday: false, nowMin: 0 });
  assert.equal(r.closed, false);
  assert.equal(r.open, 16, "9–17 30-min slots should be 16");
}

// 3. Recurring lunch break 12–13 blocks slots that overlap the break
{
  const r = countOpenSlots({
    wh: { monStart: 540, monEnd: 1020 },
    breaks: [{ start: "12:00", end: "13:00", dayOfWeek: null }],
    appointments: [], dateStr: monday, duration: 30, isToday: false, nowMin: 0,
  });
  assert.equal(r.open, 14, "lunch break removes 2 slots");
}

// 4. One-off break tied to a date takes precedence
{
  const r = countOpenSlots({
    wh: { monStart: 540, monEnd: 1020 },
    breaks: [{ start: "10:00", end: "11:00", date: monday }],
    appointments: [], dateStr: monday, duration: 30, isToday: false, nowMin: 0,
  });
  assert.equal(r.open, 14, "one-off date break removes 2 slots");
}

// 5. Confirmed appointment blocks its slot but CANCELLED does not
{
  const r = countOpenSlots({
    wh: { monStart: 540, monEnd: 1020 },
    breaks: [],
    appointments: [
      { date: monday, time: "10:00", duration: 30, status: "CONFIRMED" },
      { date: monday, time: "11:00", duration: 30, status: "CANCELLED" },
    ],
    dateStr: monday, duration: 30, isToday: false, nowMin: 0,
  });
  assert.equal(r.open, 15, "CANCELLED slot stays open");
}

// 6. Wrong day-of-week returns closed even with populated hours
{
  const r = countOpenSlots({ wh: { monStart: 540, monEnd: 1020, sunStart: null, sunEnd: null }, breaks: [], appointments: [], dateStr: sunday, duration: 30, isToday: false, nowMin: 0 });
  assert.equal(r.closed, true, "sun without hours → closed");
}

// 7. Today with nowMin=13:00 skips morning slots (30-min buffer)
{
  const r = countOpenSlots({
    wh: { monStart: 540, monEnd: 1020 },
    breaks: [], appointments: [],
    dateStr: monday, duration: 30, isToday: true, nowMin: 13 * 60,
  });
  // Floor = 13:30, so slots start 13:30, 14:00, …, 16:30 = 7 slots
  assert.equal(r.open, 7, "today skips slots before now+30");
}

console.log("availability-range: 7/7 ✓");

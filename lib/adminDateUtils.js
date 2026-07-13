// Pure date/time utilities shared between barber and admin dashboards.
// No React dependency — safe to import in any context.
import { todayStr, toDateStr } from "@/lib/utils";

export function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function isToday(dateStr) {
  return dateStr === todayStr();
}

export function formatDateLong(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export function nowTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
}

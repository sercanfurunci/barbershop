import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Shop-local dates: toISOString() is UTC and reports yesterday between
// 00:00–03:00 Istanbul time, so "today" must be computed in the shop timezone.
const SHOP_TZ = "Europe/Istanbul";

export function toDateStr(d) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

export function todayStr() {
  return toDateStr(new Date());
}

export function nowMinutes() {
  const [h, m] = new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date()).split(":").map(Number);
  return h * 60 + m;
}

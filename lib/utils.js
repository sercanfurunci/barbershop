import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Shop-local dates: toISOString() is UTC and reports yesterday between
// 00:00–03:00 Istanbul time, so "today" must be computed in the shop timezone.
// Default is overridable via env so ops can flip a whole deployment; per-tenant
// callers that have a Shop loaded should pass shop.timezone explicitly.
export const DEFAULT_TZ = process.env.NEXT_PUBLIC_DEFAULT_TZ || "Europe/Istanbul";

export function toDateStr(d, tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

export function todayStr(tz = DEFAULT_TZ) {
  return toDateStr(new Date(), tz);
}

export function nowMinutes(tz = DEFAULT_TZ) {
  const [h, m] = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date()).split(":").map(Number);
  return h * 60 + m;
}

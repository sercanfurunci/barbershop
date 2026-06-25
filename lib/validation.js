// Shared input validators for admin-edited shop profile fields.
// Server-side strict checks; admin UI also runs these via shared imports.

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif|avif);base64,/;
const ALLOWED_IMAGE_TYPES = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif"]);

// Cloudinary will recompress + auto-format, so we set the source ceiling at 5 MB.
// data URLs are base64-encoded → raw byte size ≈ length * 0.75.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !IMAGE_DATA_URL.test(dataUrl)) {
    return "Geçersiz görsel formatı (PNG/JPG/WebP olmalı)";
  }
  const mimeMatch = /^data:image\/([a-z]+);/.exec(dataUrl);
  if (!mimeMatch || !ALLOWED_IMAGE_TYPES.has(mimeMatch[1])) {
    return "Bu görsel formatı desteklenmiyor";
  }
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bytes = Math.floor(base64.length * 0.75);
  if (bytes > MAX_IMAGE_BYTES) {
    return "Görsel 5 MB'dan büyük olamaz";
  }
  return null;
}

// Phone: Turkish mobile only. Accepts 05xx..., 5xx..., +905xx..., 905xx...
// (any spacing/punctuation). Always returns canonical +905xxxxxxxxx or null.
// Apply at every trust boundary (shop save, public hrefs).
// Rejects landlines (212/216), 444 service numbers, 850 numbers, foreign — only 5xxxxxxxxx mobiles pass.
export function normalizePhoneTR(raw) {
  if (typeof raw !== "string") return null;
  let core = raw.replace(/\D/g, "");
  if (!core) return null;
  if (core.length === 12 && core.startsWith("90")) core = core.slice(2);
  else if (core.length === 11 && core.startsWith("0")) core = core.slice(1);
  if (!/^5\d{9}$/.test(core)) return null;
  return `+90${core}`;
}

// Storage-format helper: returns 10-digit local form 5xxxxxxxxx for DB columns
// that store customer phones compactly. Null if input isn't a valid TR mobile.
export function toLocal10(raw) {
  const e164 = normalizePhoneTR(raw);
  return e164 ? e164.slice(3) : null; // strip "+90"
}

// E.164 / +90 form. Spec name for the canonical international form.
export const toE164 = normalizePhoneTR;

// tel: URL. Returns null if input can't be parsed as TR mobile.
export function toTelHref(stored) {
  const n = toE164(stored);
  return n ? `tel:${n}` : null;
}

// wa.me URL. wa.me wants digits only, no +. Returns null on bad input.
export function toWhatsApp(stored, text) {
  const n = toE164(stored);
  if (!n) return null;
  const digits = n.slice(1); // drop +
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

// SMS provider format. Per spec: +905xxxxxxxxx. Consumers that need raw digits
// (Netgsm gsmno) can .slice(1) at the boundary.
export const toSmsProvider = toE164;

// Back-compat aliases — existing shop-side callsites still import these names.
export const telHref = toTelHref;
export const waHref  = toWhatsApp;

// Display mask for booking input: 05XX XXX XX XX. Accepts any partial typing
// (5xx..., 05xx..., +905xx...) and returns the formatted prefix-up-to-now.
// Always emits a leading "0" once the user has typed enough digits.
export function formatPhoneTRDisplay(raw) {
  if (typeof raw !== "string") return "";
  let digits = raw.replace(/\D/g, "");
  // Drop the country code if user typed it
  if (digits.length >= 12 && digits.startsWith("90")) digits = digits.slice(2);
  // Ensure leading 0 for display: stored canonical is 5xxxxxxxxx, we render with leading 0
  if (digits.length > 0 && digits[0] !== "0") digits = "0" + digits;
  digits = digits.slice(0, 11); // 0 + 10 digits
  if (digits.length <= 4)  return digits;
  if (digits.length <= 7)  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9)  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
}

// URL: must be http(s), reject javascript: / data: schemes to block XSS.
export function validateHttpUrl(raw, { host } = {}) {
  if (raw == null || raw === "") return { ok: true, value: null };
  if (typeof raw !== "string") return { ok: false, error: "Geçersiz URL" };
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  let url;
  try { url = new URL(trimmed); } catch { return { ok: false, error: "Geçersiz URL" }; }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Sadece http(s) URL'leri kabul edilir" };
  }
  if (host && !url.host.endsWith(host)) {
    return { ok: false, error: `URL ${host} alanında olmalı` };
  }
  return { ok: true, value: url.toString() };
}

// Bounded string with optional max length. Empty / null becomes null.
export function sanitizeString(raw, { max = 200 } = {}) {
  if (raw == null) return null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export function validateLatLng(lat, lng) {
  if (lat == null && lng == null) return { lat: null, lng: null };
  const nLat = Number(lat), nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null;
  if (nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) return null;
  return { lat: nLat, lng: nLng };
}

export const SHOP_TYPES = ["male", "female", "unisex"];

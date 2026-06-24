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

// Phone: keep liberal — Turkish + international, with or without +. We only
// guarantee the value parses to digits we can hand to wa.me / tel: URLs.
export function normalizePhone(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.length < 7 || digits.length > 20) return null;
  return digits;
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

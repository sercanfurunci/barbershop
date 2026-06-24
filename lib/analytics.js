// Allowlist + canonical names for analytics events. Anything not in this set
// is rejected at ingest. Add new events here first so the API stays strict.
export const EVENT_TYPES = [
  "page_view",
  "book_click",
  "whatsapp_click",
  "call_click",
  "directions_click",
  "service_select",
  "barber_select",
  "booking_complete",
];

export const EVENT_TYPE_SET = new Set(EVENT_TYPES);

// Truncate / sanitize metadata to prevent abuse (massive blobs, nested junk).
// Keep it tiny — IDs and short strings only.
const MAX_KEYS = 6;
const MAX_VAL_LEN = 80;

export function normalizeMetadata(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out = {};
  let n = 0;
  for (const [k, vRaw] of Object.entries(input)) {
    if (n++ >= MAX_KEYS) break;
    if (typeof k !== "string" || k.length > 32) continue;
    let v = vRaw;
    if (v == null) continue;
    if (typeof v === "number" || typeof v === "boolean") { out[k] = v; continue; }
    if (typeof v !== "string") continue;
    if (v.length > MAX_VAL_LEN) v = v.slice(0, MAX_VAL_LEN);
    out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

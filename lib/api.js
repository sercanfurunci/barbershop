// Lightweight API client — wraps fetch with base URL + auth token

// Superadmin preview: when SUPER_ADMIN inspects /[shopSlug]/admin, the tenant
// shop id is stamped here so /api/admin/* and /api/appointments requests are
// auto-scoped to that shop. Set/cleared by AdminDashboard on mount/unmount.
// ponytail: module-level state — fine for a single mounted dashboard.
let _previewShopId = null;
export function setPreviewShopId(id) { _previewShopId = id || null; }
export function getPreviewShopId() { return _previewShopId; }

function scopedPath(path) {
  if (!_previewShopId || typeof path !== "string") return path;
  if (!(path.startsWith("/api/admin/") || path.startsWith("/api/appointments"))) return path;
  if (path.includes("shopId=")) return path;
  return path + (path.includes("?") ? "&" : "?") + `shopId=${encodeURIComponent(_previewShopId)}`;
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(scopedPath(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // send httpOnly cookie
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const e = new Error(err.error ?? "API error");
    e.status = res.status;
    if (err.code) e.code = err.code;
    throw e;
  }

  return res.json();
}

// Normalize API appointment → UI shape
export function normalizeAppointment(a) {
  return {
    id:        a.id,
    client:    a.client?.name  ?? a.client  ?? "",
    phone:     a.client?.phone ?? a.phone   ?? "",
    email:     a.client?.email ?? "",
    service:   a.service?.nameTr ?? a.service ?? "",
    serviceId: a.serviceId,
    barber:    a.barber?.nameTr  ?? a.barber  ?? "",
    barberId:  a.barberId,
    date:      a.date,
    time:      a.time,
    duration:  a.duration,
    price:     a.price,
    // Phase 2 revenue fields; null for pre-Phase-2 rows. UI falls back to price.
    grossAmount:       a.grossAmount       ?? null,
    barberAmount:      a.barberAmount      ?? null,
    shopAmount:        a.shopAmount        ?? null,
    tipAmount:         a.tipAmount         ?? 0,
    paymentMethod:     a.paymentMethod     ?? null,
    isWalkIn:          a.isWalkIn          ?? false,
    customServiceName: a.customServiceName ?? null,
    status:    (a.status  ?? "pending").toLowerCase().replace("_", "-"),
    source:    (a.source  ?? "online").toLowerCase(),
    notes:     a.notes ?? "",
  };
}

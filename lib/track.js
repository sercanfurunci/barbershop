// Fire-and-forget client tracker. Uses sendBeacon when available so CTAs that
// also navigate away (target=_blank, tel:, location changes) still send.
// Silent on every failure path — tracking must never interfere with UX.
export function track(shopId, eventType, metadata) {
  if (typeof window === "undefined" || !shopId || !eventType) return;
  const payload = JSON.stringify({ shopId, eventType, metadata });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/events", blob);
      return;
    }
    // Fallback: keepalive fetch so it survives unload.
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

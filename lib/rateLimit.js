/**
 * Lightweight in-process rate limiter.
 * Per-instance on serverless — acceptable for defence-in-depth;
 * swap `buckets` for an Upstash/Redis store if global limiting is needed.
 */
const buckets = new Map();

// Prune stale entries periodically so the Map doesn't grow unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }, 60_000).unref?.();
}

/**
 * @param {string} key       - Unique bucket key (e.g. "login:1.2.3.4")
 * @param {object} opts
 * @param {number} opts.limit      - Max requests allowed in the window (default 5)
 * @param {number} opts.windowMs   - Window length in ms (default 10 min)
 * @returns {{ ok: boolean, retryAfter?: number }}
 */
export function rateLimit(key, { limit = 5, windowMs = 10 * 60 * 1000 } = {}) {
  const now   = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { ok: true };
}

/** Convenience: extract the best-effort client IP from a Next.js request. */
export function getIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

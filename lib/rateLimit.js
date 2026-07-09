/**
 * Distributed-first rate limiter.
 *
 * Prod: Upstash Redis fixed-window when UPSTASH_REDIS_REST_URL is set — works
 * across all Vercel functions, no connection pool, edge-safe.
 *
 * Dev / tests: in-process Map fallback so nothing new is required to `npm run
 * dev`. Buckets are per-node, so limits are effectively per-function-instance
 * — good enough locally.
 *
 * API is async now. Callers must `await rateLimit(...)`.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Prod backend (lazy — one Ratelimit per (limit, windowMs) combo) ───────────
let _redis; // ponytail: undefined so the !== undefined sentinel works on first call
function getRedis() {
  if (_redis !== undefined) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = (url && token) ? new Redis({ url, token }) : null;
  return _redis;
}

const _limiters = new Map();
function getLimiter(limit, windowMs) {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${limit}@${windowMs}`;
  let rl = _limiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: "rl",
    });
    _limiters.set(key, rl);
  }
  return rl;
}

// ── Dev backend (in-process, per-instance) ────────────────────────────────────
const buckets = new Map();
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }, 60_000).unref?.();
}

function localLimit(key, limit, windowMs) {
  const now = Date.now();
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

/**
 * @param {string} key       Unique bucket key (e.g. "login:1.2.3.4")
 * @param {{ limit?: number, windowMs?: number }} opts
 * @returns {Promise<{ ok: boolean, retryAfter?: number }>}
 */
export async function rateLimit(key, { limit = 5, windowMs = 10 * 60 * 1000 } = {}) {
  const rl = getLimiter(limit, windowMs);
  if (!rl) return localLimit(key, limit, windowMs);
  try {
    const { success, reset } = await rl.limit(key);
    if (success) return { ok: true };
    return { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch (err) {
    // Never block a legitimate request on infra failure — fall through to the
    // local bucket. Logs so ops sees the outage.
    console.error("[rateLimit] Upstash error, falling back to local:", err.message);
    return localLimit(key, limit, windowMs);
  }
}

/** Best-effort client IP from a Next.js request. */
export function getIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

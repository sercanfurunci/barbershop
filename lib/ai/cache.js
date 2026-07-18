/**
 * In-process TTL cache for AI pipeline data.
 * Avoids repeated DB reads for knowledge/rules/settings within and across requests.
 * ponytail: module-level Map — works in Next.js dev (persistent process) and serverless
 * (per-invocation hit rate still worth it for parallel requests in same Lambda).
 */

const _cache = new Map();
const DEFAULT_TTL = 60_000; // 1 minute

export function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _cache.delete(key); return null; }
  return entry.value;
}

export function cacheSet(key, value, ttl = DEFAULT_TTL) {
  _cache.set(key, { value, expiresAt: Date.now() + ttl });
}

export function cacheInvalidate(prefix) {
  for (const key of _cache.keys()) {
    if (key.startsWith(prefix)) _cache.delete(key);
  }
}

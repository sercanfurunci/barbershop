/**
 * AI-specific rate limiting.
 *
 * Layered limits: per-user (minute / hour / day) + per-shop (hour / day).
 * All layers are checked in parallel; the first failure wins.
 *
 * Reuses the existing rateLimit() function from lib/rateLimit.js so Upstash
 * Redis is used when configured, with in-process fallback otherwise.
 */

import { rateLimit } from "@/lib/rateLimit";

// Limits are intentionally generous — tighten per-shop via ShopAISettings later
const LIMITS = {
  userMinute:  { limit: 5,    windowMs: 60_000      },
  userHour:    { limit: 60,   windowMs: 3_600_000   },
  userDay:     { limit: 300,  windowMs: 86_400_000  },
  shopHour:    { limit: 500,  windowMs: 3_600_000   },
  shopDay:     { limit: 2_000, windowMs: 86_400_000 },
};

/**
 * Check all AI rate limit layers for a (shop, sender) pair.
 *
 * @param {string} shopId
 * @param {string} senderPhone — channel sender identifier
 * @returns {Promise<{ ok: true } | { ok: false, level: string, retryAfter: number }>}
 */
export async function checkAiRateLimits(shopId, senderPhone) {
  const [userMin, userHr, userDay, shopHr, shopDay] = await Promise.all([
    rateLimit(`ai:u:min:${shopId}:${senderPhone}`, LIMITS.userMinute),
    rateLimit(`ai:u:hr:${shopId}:${senderPhone}`,  LIMITS.userHour),
    rateLimit(`ai:u:day:${shopId}:${senderPhone}`, LIMITS.userDay),
    rateLimit(`ai:s:hr:${shopId}`,                 LIMITS.shopHour),
    rateLimit(`ai:s:day:${shopId}`,                LIMITS.shopDay),
  ]);

  const checks = [
    ["user_minute", userMin],
    ["user_hour",   userHr],
    ["user_day",    userDay],
    ["shop_hour",   shopHr],
    ["shop_day",    shopDay],
  ];

  for (const [level, result] of checks) {
    if (!result.ok) return { ok: false, level, retryAfter: result.retryAfter ?? 60 };
  }

  return { ok: true };
}

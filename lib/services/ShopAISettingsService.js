/**
 * ShopAISettings — per-tenant AI configuration.
 * Falls back to global env/defaults when a shop has no settings row.
 */

import { prisma } from "@/lib/prisma";
import { ai as aiConfig } from "@/lib/config";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/ai/cache";

const DEFAULTS = Object.freeze({
  enabled:              true,
  provider:             "anthropic",
  model:                null,          // null = use global AI_MODEL env
  temperature:          0.3,
  maxTokens:            1024,
  language:             "tr",
  personality:          "professional",
  greeting:             null,
  closing:              null,
  bookingStyle:         "guided",
  systemPromptOverride: null,
  // Personality v2
  emojiUsage:           "minimal",     // none | minimal | moderate | heavy
  messageLength:        "medium",      // brief | medium | detailed
  salesBehavior:        "neutral",     // passive | neutral | proactive
  upsellEnabled:        false,
  humorLevel:           "none",        // none | light | moderate | high
});

/**
 * Get AI settings for a shop.
 * Returns DB row merged with DEFAULTS if some fields are missing,
 * or pure DEFAULTS if no row exists.
 * Cached for 60s and invalidated on write.
 *
 * @param {string} shopId
 * @returns {Promise<typeof DEFAULTS>}
 */
export async function getShopAISettings(shopId) {
  const key = `settings:${shopId}`;
  const cached = cacheGet(key);
  if (cached !== null) return cached;

  const row = await prisma.shopAISettings.findUnique({ where: { shopId } });
  const result = row ? { ...DEFAULTS, ...row } : { ...DEFAULTS };
  cacheSet(key, result);
  return result;
}

/**
 * Resolve the effective model for a shop's settings.
 * Priority: shopSettings.model → AI_MODEL env → hardcoded safe default.
 *
 * @param {object} settings — from getShopAISettings()
 * @returns {string}
 */
export function resolveModel(settings) {
  return settings.model ?? aiConfig.model ?? "claude-haiku-4-5-20251001";
}

/**
 * Upsert AI settings for a shop. Partial updates allowed.
 * Invalidates cache immediately so the next read reflects the change.
 *
 * @param {string} shopId
 * @param {Partial<typeof DEFAULTS>} patch
 */
export async function setShopAISettings(shopId, patch) {
  cacheInvalidate(`settings:${shopId}`);
  return prisma.shopAISettings.upsert({
    where:  { shopId },
    create: { shopId, ...DEFAULTS, ...patch },
    update: patch,
  });
}

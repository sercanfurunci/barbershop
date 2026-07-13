import { prisma } from "@/lib/prisma";
import { FEATURE, PLAN_FEATURES } from "@/lib/constants/features";

/**
 * Check whether a feature is enabled for a shop.
 *
 * Resolution order:
 *   1. ShopFeatureOverride (per-tenant explicit override — wins over everything)
 *   2. Plan default (PLAN_FEATURES[shop.planTier])
 *   3. Super-admin bypass (always true)
 *
 * Accepts either a shop object (with planTier loaded) or a shopId string.
 * Pass a shop object when you already have it to avoid an extra DB round-trip.
 *
 * @param {object|string} shopOrId
 * @param {string} feature — one of FEATURE constants
 * @param {{ isSuperAdmin?: boolean, overrides?: Map<string,boolean> }} [opts]
 * @returns {Promise<boolean>}
 */
export async function hasFeature(shopOrId, feature, { isSuperAdmin = false, overrides } = {}) {
  if (isSuperAdmin) return true;

  // If caller pre-loaded overrides (batch check), skip DB hit
  if (overrides) {
    if (overrides.has(feature)) return overrides.get(feature);
    return _planHasFeature(shopOrId?.planTier, feature);
  }

  const shopId = typeof shopOrId === "string" ? shopOrId : shopOrId?.id;
  if (!shopId) return false;

  const override = await prisma.shopFeatureOverride.findUnique({
    where:  { shopId_feature: { shopId, feature } },
    select: { enabled: true },
  });
  if (override !== null) return override.enabled;

  // Fall back to plan default
  const planTier = typeof shopOrId === "string"
    ? (await prisma.shop.findUnique({ where: { id: shopId }, select: { planTier: true } }))?.planTier
    : shopOrId?.planTier;

  return _planHasFeature(planTier, feature);
}

/**
 * Load all feature flags for a shop in a single query — use this when you
 * need to check multiple features (e.g., admin settings page).
 *
 * @param {string} shopId
 * @param {{ isSuperAdmin?: boolean }} [opts]
 * @returns {Promise<Record<string, boolean>>}
 */
export async function getFeatures(shopId, { isSuperAdmin = false } = {}) {
  if (isSuperAdmin) {
    return Object.fromEntries(Object.values(FEATURE).map(f => [f, true]));
  }

  const [shop, overrides] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: { planTier: true } }),
    prisma.shopFeatureOverride.findMany({ where: { shopId }, select: { feature: true, enabled: true } }),
  ]);

  const overrideMap = new Map(overrides.map(o => [o.feature, o.enabled]));
  const planDefaults = PLAN_FEATURES[shop?.planTier] ?? new Set();

  return Object.fromEntries(
    Object.values(FEATURE).map(f => [
      f,
      overrideMap.has(f) ? overrideMap.get(f) : planDefaults.has(f),
    ])
  );
}

/**
 * Set or clear a per-tenant feature override. Super-admin only.
 *
 * @param {string} shopId
 * @param {string} feature
 * @param {boolean} enabled
 * @param {{ reason?: string, setBy?: string }} [meta]
 */
export async function setFeatureOverride(shopId, feature, enabled, { reason, setBy } = {}) {
  return prisma.shopFeatureOverride.upsert({
    where:  { shopId_feature: { shopId, feature } },
    create: { shopId, feature, enabled, reason, setBy },
    update: { enabled, reason, setBy },
  });
}

/** Remove a per-tenant feature override (reverts to plan default). */
export async function removeFeatureOverride(shopId, feature) {
  return prisma.shopFeatureOverride.deleteMany({ where: { shopId, feature } });
}

function _planHasFeature(planTier, feature) {
  return (PLAN_FEATURES[planTier] ?? new Set()).has(feature);
}

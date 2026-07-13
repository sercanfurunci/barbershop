/**
 * Feature flag public API — re-exports from the canonical services.
 * Import from here for backward compat; new code should import directly
 * from lib/services/FeatureService and lib/constants/features.
 */
export { FEATURE, PLAN_FEATURES } from "@/lib/constants/features";
export { hasFeature, getFeatures, setFeatureOverride, removeFeatureOverride } from "@/lib/services/FeatureService";

// AI channel helpers (backward compat with the lib/features.js written earlier)
import { CHANNEL } from "@/lib/channels/types";
import { hasFeature } from "@/lib/services/FeatureService";

const CHANNEL_TO_FEATURE = {
  [CHANNEL.AI_CHAT]:   "AI_CHAT",
  [CHANNEL.WHATSAPP]:  "WHATSAPP_AI",
  [CHANNEL.INSTAGRAM]: "INSTAGRAM_AI",
  [CHANNEL.VOICE]:     "VOICE_AI",
};

/**
 * Check whether an AI/channel feature is enabled for a shop.
 * Delegates to hasFeature() — the plan gate and tenant override are both checked there.
 */
export async function isChannelEnabled(shopOrId, channel, { isSuperAdmin = false } = {}) {
  const feature = CHANNEL_TO_FEATURE[channel];
  if (!feature) return false;
  return hasFeature(shopOrId, feature, { isSuperAdmin });
}

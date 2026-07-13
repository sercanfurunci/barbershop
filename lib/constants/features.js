// Canonical feature flag identifiers.
// Business logic checks features by these names — never by plan name.
// lib/services/FeatureService.hasFeature(shop, FEATURE.AI_CHAT)
export const FEATURE = Object.freeze({
  // AI channels
  AI_CHAT:            "AI_CHAT",
  WHATSAPP_AI:        "WHATSAPP_AI",
  INSTAGRAM_AI:       "INSTAGRAM_AI",
  VOICE_AI:           "VOICE_AI",

  // Marketing & retention
  MARKETING:          "MARKETING",
  LOYALTY:            "LOYALTY",

  // API & integrations
  API_ACCESS:         "API_ACCESS",
  GOOGLE_SYNC:        "GOOGLE_SYNC",

  // Business scale
  MULTI_BRANCH:       "MULTI_BRANCH",
  ADVANCED_ANALYTICS: "ADVANCED_ANALYTICS",
  EXPORTS:            "EXPORTS",
  CUSTOM_DOMAIN:      "CUSTOM_DOMAIN",
});

// Features bundled per plan tier (what the plan includes by default).
// ShopFeatureOverride can add or remove features on top of this.
// ponytail: STARTER/PRO/ENTERPRISE keep full access for backward compatibility —
// all existing shops are on one of these tiers and should not lose anything.
export const PLAN_FEATURES = Object.freeze({
  STARTER: new Set([
    FEATURE.LOYALTY,
    FEATURE.MARKETING,
    FEATURE.EXPORTS,
  ]),
  PRO: new Set(Object.values(FEATURE)), // legacy: full access
  ENTERPRISE: new Set(Object.values(FEATURE)), // full access
  PROFESSIONAL: new Set([
    FEATURE.LOYALTY,
    FEATURE.MARKETING,
    FEATURE.EXPORTS,
    FEATURE.API_ACCESS,
    FEATURE.GOOGLE_SYNC,
    FEATURE.MULTI_BRANCH,
    FEATURE.ADVANCED_ANALYTICS,
    FEATURE.CUSTOM_DOMAIN,
  ]),
  AI: new Set(Object.values(FEATURE)), // all features including AI channels
});

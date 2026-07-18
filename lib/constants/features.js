// Canonical feature flag identifiers.
// Business logic checks features by these names — never by plan name.
// lib/services/FeatureService.hasFeature(shop, FEATURE.AI_CHAT)
export const FEATURE = Object.freeze({
  // AI channels
  AI_CHAT:            "AI_CHAT",
  WHATSAPP_AI:        "WHATSAPP_AI",
  INSTAGRAM_AI:       "INSTAGRAM_AI",
  VOICE_AI:           "VOICE_AI",

  // AI capabilities (channel-agnostic, checked inside AI layer)
  AI_BOOKING:         "AI_BOOKING",         // AI can create/cancel/reschedule
  AI_REVIEW_ANALYSIS: "AI_REVIEW_ANALYSIS", // AI-powered review summaries
  SMART_REMINDER:     "SMART_REMINDER",     // AI-generated reminder messages
  CAMPAIGNS:          "CAMPAIGNS",          // AI-assisted campaign copy
  MULTILINGUAL:       "MULTILINGUAL",       // respond in customer's detected language

  // AI Platform (admin features)
  AI_KNOWLEDGE_BASE:  "AI_KNOWLEDGE_BASE",  // knowledge base editor
  AI_RULE_ENGINE:     "AI_RULE_ENGINE",     // visual rule editor
  AI_PLAYGROUND:      "AI_PLAYGROUND",      // test AI in admin
  AI_CONVERSATIONS:   "AI_CONVERSATIONS",   // conversation center dashboard
  HUMAN_HANDOFF:      "HUMAN_HANDOFF",      // agent can take over conversations
  CUSTOMER_MEMORY:    "CUSTOMER_MEMORY",    // persistent AI customer memory

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
  AI: new Set(Object.values(FEATURE)), // all features including AI channels + platform
});

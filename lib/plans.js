// Plan definitions. Use PLANS[shop.planTier] to get plan metadata.
// Feature access is checked via lib/services/FeatureService.hasFeature() —
// never check plan names directly in business logic.
//
// Pricing: flat 500 ₺/ay for now. Tiers are ready for when pricing diverges.

import { PLAN_FEATURES } from "@/lib/constants/features";
import { PLAN_LIMITS }   from "@/lib/constants/limits";

export const TRIAL_DAYS = 14;

const BASE = {
  priceMonthlyTry: 500,
};

export const PLANS = {
  STARTER: {
    ...BASE,
    id:    "STARTER",
    label: "Başlangıç",
    get features() { return PLAN_FEATURES.STARTER; },
    get limits()   { return PLAN_LIMITS.STARTER; },
  },
  PRO: {
    ...BASE,
    id:    "PRO",
    label: "Pro",
    get features() { return PLAN_FEATURES.PRO; },
    get limits()   { return PLAN_LIMITS.PRO; },
  },
  ENTERPRISE: {
    ...BASE,
    id:    "ENTERPRISE",
    label: "Kurumsal",
    get features() { return PLAN_FEATURES.ENTERPRISE; },
    get limits()   { return PLAN_LIMITS.ENTERPRISE; },
  },
  PROFESSIONAL: {
    ...BASE,
    id:    "PROFESSIONAL",
    label: "Profesyonel",
    get features() { return PLAN_FEATURES.PROFESSIONAL; },
    get limits()   { return PLAN_LIMITS.PROFESSIONAL; },
  },
  AI: {
    ...BASE,
    id:    "AI",
    label: "AI",
    priceMonthlyTry: 1500,
    get features() { return PLAN_FEATURES.AI; },
    get limits()   { return PLAN_LIMITS.AI; },
  },
};

export function getPlan(planTier) {
  return PLANS[planTier] ?? PLANS.STARTER;
}

// ponytail: kept for backward compat — all existing callers pass no args.
// New code should use FeatureService.hasFeature() instead.
export function hasFeature() { return true; }

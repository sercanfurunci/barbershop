// Single source of truth for plan limits and feature gates.
// Read by lib/subscription.js (enforcement) and admin Billing UI (display).
//
// Pricing is sales-led for now (real numbers negotiated per-customer), so
// priceMonthlyTry is informational only — set to a representative figure for
// internal MRR math. Update when public pricing goes live.

export const TRIAL_DAYS = 14;

export const PLANS = {
  STARTER: {
    id:           "STARTER",
    label:        "Başlangıç",
    maxBarbers:   2,
    priceMonthlyTry: 999,
    features: {
      basicBooking:      true,
      reviews:           false,
      analytics:         false,
      calendarSync:      false,
      multiLocation:     false,
      advancedAnalytics: false,
    },
  },
  PRO: {
    id:           "PRO",
    label:        "Pro",
    maxBarbers:   Infinity,
    priceMonthlyTry: 2499,
    features: {
      basicBooking:      true,
      reviews:           true,
      analytics:         true,
      calendarSync:      true,
      multiLocation:     false,
      advancedAnalytics: false,
    },
  },
  ENTERPRISE: {
    id:           "ENTERPRISE",
    label:        "Kurumsal",
    maxBarbers:   Infinity,
    priceMonthlyTry: 5999,
    features: {
      basicBooking:      true,
      reviews:           true,
      analytics:         true,
      calendarSync:      true,
      multiLocation:     true,
      advancedAnalytics: true,
    },
  },
};

export function getPlan(planTier) {
  return PLANS[planTier] ?? PLANS.STARTER;
}

export function hasFeature(planTier, featureKey) {
  return getPlan(planTier).features[featureKey] === true;
}

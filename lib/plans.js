// Single-tier plan. We sell one option at a flat price; the PlanTier enum in
// Prisma stays (STARTER/PRO/ENTERPRISE) so old rows resolve cleanly, but every
// tier maps to the same plan. If we ever bring tiering back, just split PLANS.
//
// Pricing is now public, not sales-led — flat 500 ₺/ay.

export const TRIAL_DAYS = 14;

const PLAN = {
  id:              "MAKAS",
  label:           "Makas",
  maxBarbers:      Infinity,
  priceMonthlyTry: 500,
  features: {
    basicBooking:      true,
    reviews:           true,
    analytics:         true,
    calendarSync:      true,
    multiLocation:     true,
    advancedAnalytics: true,
  },
};

// Every PlanTier enum value maps to the same plan. Keeps downstream
// `PLANS[shop.planTier]?.label` etc. working without per-call-site changes.
export const PLANS = { STARTER: PLAN, PRO: PLAN, ENTERPRISE: PLAN };

export function getPlan() { return PLAN; }
export function hasFeature() { return true; }

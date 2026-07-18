/**
 * Deterministic customer intelligence scores. No LLM, no extra queries —
 * computed from a CustomerContext (buildCustomerContext) shaped object.
 * Internal only: admin dashboards + Manager AI insights.
 */

/** 0-100. Visit frequency + recency + spend, penalized by no-shows/cancels. */
export function loyaltyScore(c) {
  if (!c) return 0;
  let s = 0;
  s += Math.min(40, (c.completedCount ?? 0) * 4);            // 10+ visits = max
  s += Math.min(20, (c.totalSpent ?? 0) / 100);              // 2000+ TRY = max
  if (c.daysSinceLastVisit != null) {
    if (c.daysSinceLastVisit <= 30) s += 25;
    else if (c.daysSinceLastVisit <= 60) s += 15;
    else if (c.daysSinceLastVisit <= 90) s += 5;
  }
  if (c.favoriteBarber) s += 10;                             // habit formed
  if (c.upcomingAppointments?.length) s += 5;
  s -= (c.noShowCount ?? 0) * 5 + (c.cancelledCount ?? 0) * 2;
  return clamp(s);
}

/**
 * 0-100, higher = more likely churned. Overdue ratio vs their own rhythm.
 * ponytail: rule-based, not a model — upgrade to survival analysis if it matters
 */
export function churnRisk(c) {
  if (!c || !c.completedCount) return 50;                    // unknown = medium
  if (c.upcomingAppointments?.length) return 5;              // already coming back
  const interval = c.avgVisitIntervalDays ?? 30;
  const since = c.daysSinceLastVisit;
  if (since == null) return 50;
  const overdue = since / Math.max(interval, 7);             // 1.0 = right on time
  if (overdue <= 1)   return 10;
  if (overdue <= 1.5) return 30;
  if (overdue <= 2)   return 55;
  if (overdue <= 3)   return 75;
  return 90;
}

/** 0-100. Loyal + high-spend + regular = VIP material. */
export function vipScore(c) {
  if (!c) return 0;
  let s = 0;
  s += Math.min(35, (c.totalSpent ?? 0) / 150);              // 5250+ TRY = max
  s += Math.min(30, (c.completedCount ?? 0) * 3);
  if (c.avgVisitIntervalDays != null && c.avgVisitIntervalDays <= 30) s += 20;
  if (c.familyMembers?.length > 1) s += 10;                  // brings the family
  if ((c.noShowCount ?? 0) === 0) s += 5;
  return clamp(s);
}

/** 0-100 composite: loyalty weighted up, churn weighted down. */
export function healthScore(c) {
  if (!c) return 0;
  return clamp(Math.round(loyaltyScore(c) * 0.6 + (100 - churnRisk(c)) * 0.4));
}

/** All scores + labels in one call. */
export function customerIntelligence(c) {
  const loyalty = loyaltyScore(c);
  const churn   = churnRisk(c);
  const vip     = vipScore(c);
  return {
    loyaltyScore: loyalty,
    churnRisk:    churn,
    vipScore:     vip,
    healthScore:  healthScore(c),
    isVip:        vip >= 70,
    churnLabel:   churn >= 70 ? "high" : churn >= 40 ? "medium" : "low",
  };
}

const clamp = n => Math.max(0, Math.min(100, Math.round(n)));

// Subscription lifecycle + access enforcement.
// All checks here read Shop.subscriptionStatus + Shop.planTier; never trust client state.
//
// Status semantics:
//   TRIAL      — 14 days from signup; full access; convert before trialEndsAt
//   ACTIVE     — paid; access until currentPeriodEndsAt
//   PAST_DUE   — payment failed; full access continues for grace period (3 days)
//   SUSPENDED  — grace period exhausted; public booking blocked, admin/staff still in
//   CANCELLED  — explicitly cancelled; treated like SUSPENDED for access
//
// Public booking is blocked ONLY for SUSPENDED + CANCELLED. PAST_DUE keeps booking
// alive during grace; cron flips to SUSPENDED after PAST_DUE_GRACE_DAYS.

import { prisma } from "@/lib/prisma";
import { getPlan, TRIAL_DAYS } from "@/lib/plans";

export const PAST_DUE_GRACE_DAYS = 3;

// Statuses where public /book is allowed.
const BOOKING_ALLOWED_STATUSES = new Set(["TRIAL", "ACTIVE", "PAST_DUE"]);

// Statuses where the admin should see a warning banner.
const BANNER_STATUSES = new Set(["PAST_DUE", "SUSPENDED", "CANCELLED"]);

export function canAcceptPublicBookings(shop) {
  if (!shop) return false;
  if (shop.status === "SUSPENDED") return false; // hard platform suspension
  return BOOKING_ALLOWED_STATUSES.has(shop.subscriptionStatus);
}

export function shouldShowBillingBanner(shop) {
  if (!shop) return false;
  return BANNER_STATUSES.has(shop.subscriptionStatus);
}

export function daysUntilTrialEnds(shop) {
  if (!shop?.trialEndsAt) return null;
  const ms = new Date(shop.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function isTrialExpired(shop) {
  if (shop?.subscriptionStatus !== "TRIAL") return false;
  if (!shop.trialEndsAt) return false;
  return new Date(shop.trialEndsAt).getTime() < Date.now();
}

// Plan-limit enforcement. Returns { ok: true } or { ok: false, reason }.
export async function canCreateBarber(shopId) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { planTier: true, _count: { select: { barbers: true } } },
  });
  if (!shop) return { ok: false, reason: "Shop not found" };
  const plan = getPlan(shop.planTier);
  const current = shop._count.barbers;
  if (current >= plan.maxBarbers) {
    return {
      ok: false,
      reason: `${plan.label} planında en fazla ${plan.maxBarbers} berber tanımlayabilirsiniz. Yükseltmek için bizimle iletişime geçin.`,
      limit: plan.maxBarbers,
      current,
    };
  }
  return { ok: true, limit: plan.maxBarbers, current };
}

// Start a 14-day trial. Called on shop creation.
export function startTrialFields() {
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000);
  return {
    subscriptionStatus: "TRIAL",
    trialEndsAt,
  };
}

// ─── Cron-callable helpers (Vercel Cron compatible) ──────────────────────────
// Idempotent: safe to run repeatedly. Each scans for shops whose state should
// flip and updates them. Designed to be called from /api/cron/billing once/day.

export async function expireTrials() {
  const now = new Date();
  const result = await prisma.shop.updateMany({
    where: {
      subscriptionStatus: "TRIAL",
      trialEndsAt: { lt: now },
    },
    data: { subscriptionStatus: "PAST_DUE" },
  });
  return { transitioned: result.count, kind: "TRIAL→PAST_DUE" };
}

export async function suspendPastDue() {
  const now = new Date();
  // Primary path: use gracePeriodEndsAt when set (accurate per-shop expiry).
  const byGrace = await prisma.shop.updateMany({
    where: { subscriptionStatus: "PAST_DUE", gracePeriodEndsAt: { lte: now, not: null } },
    data:  { subscriptionStatus: "SUSPENDED" },
  });
  // Fallback for rows without gracePeriodEndsAt (legacy): use PAST_DUE_GRACE_DAYS
  // measured from when trialEndsAt lapsed (not updatedAt — that was the bug).
  const fallbackCutoff = new Date(Date.now() - PAST_DUE_GRACE_DAYS * 86_400_000);
  const byFallback = await prisma.shop.updateMany({
    where: { subscriptionStatus: "PAST_DUE", gracePeriodEndsAt: null, trialEndsAt: { lt: fallbackCutoff } },
    data:  { subscriptionStatus: "SUSPENDED" },
  });
  return { transitioned: byGrace.count + byFallback.count, kind: "PAST_DUE→SUSPENDED" };
}

/** Set grace period when a payment fails (call from billing webhook handler). */
export function setGracePeriod(shopId) {
  const gracePeriodEndsAt = new Date(Date.now() + PAST_DUE_GRACE_DAYS * 86_400_000);
  return prisma.shop.update({
    where: { id: shopId },
    data:  { subscriptionStatus: "PAST_DUE", gracePeriodEndsAt },
  });
}

// ─── Usage tracking (read-only aggregations) ─────────────────────────────────
// No new tables. Computes on demand from existing Appointment / NotificationJob.

export async function getMonthlyUsage(shopId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [bookings, smsSent, waSent, activeBarbers, customerCount] = await Promise.all([
    prisma.appointment.count({
      where: { shopId, createdAt: { gte: monthStart } },
    }),
    prisma.notificationJob.count({
      where: { shopId, channel: "SMS", status: "SENT", processedAt: { gte: monthStart } },
    }),
    prisma.notificationJob.count({
      where: { shopId, channel: "WHATSAPP", status: "SENT", processedAt: { gte: monthStart } },
    }),
    prisma.barber.count({ where: { shopId, available: true } }),
    prisma.client.count({ where: { shopId } }),
  ]);

  return {
    bookingsThisMonth: bookings,
    smsSent,
    waSent,
    activeBarbers,
    customerCount,
    monthStart: monthStartStr,
  };
}

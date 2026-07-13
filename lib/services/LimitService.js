import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/constants/limits";

function getLimits(planTier) {
  return PLAN_LIMITS[planTier] ?? PLAN_LIMITS.STARTER;
}

function result(allowed, limitKey, current, limit) {
  return { allowed, limitKey, current, limit };
}

/**
 * Generic limit check: current count vs plan limit.
 * @returns {{ allowed: boolean, limitKey: string, current: number, limit: number }}
 */
async function check(shopId, planTier, limitKey, getCurrentCount) {
  const limits = getLimits(planTier);
  const limit  = limits[limitKey] ?? 0;
  if (limit === Infinity) return result(true, limitKey, 0, Infinity);
  const current = await getCurrentCount();
  return result(current < limit, limitKey, current, limit);
}

// ─── Shop-level helpers ───────────────────────────────────────────────────────

async function getShopPlan(shopId) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { planTier: true } });
  return shop?.planTier ?? "STARTER";
}

/**
 * Can the shop create another barber (staff member)?
 * @param {string} shopId
 * @returns {Promise<{ allowed: boolean, limitKey: string, current: number, limit: number }>}
 */
export async function canCreateBarber(shopId) {
  const planTier = await getShopPlan(shopId);
  return check(shopId, planTier, "maxBarbers", () =>
    prisma.barber.count({ where: { shopId } })
  );
}

/**
 * Can the shop create another service?
 */
export async function canCreateService(shopId) {
  const planTier = await getShopPlan(shopId);
  return check(shopId, planTier, "maxServices", () =>
    prisma.service.count({ where: { shopId, active: true } })
  );
}

/**
 * Can the shop create an appointment this month?
 */
export async function canCreateAppointment(shopId) {
  const planTier = await getShopPlan(shopId);
  const limits   = getLimits(planTier);
  if (limits.maxMonthlyAppointments === Infinity) return result(true, "maxMonthlyAppointments", 0, Infinity);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const current = await prisma.appointment.count({
    where: { shopId, createdAt: { gte: monthStart } },
  });
  return result(current < limits.maxMonthlyAppointments, "maxMonthlyAppointments", current, limits.maxMonthlyAppointments);
}

/**
 * Can the shop upload another image (storage limit)?
 * Counts gallery images and cover across Shop; each photo URL = ~1 item.
 * ponytail: counts URLs, not actual bytes. Switch to a UsageSnapshot with
 * real byte counts when storage billing is implemented.
 */
export async function canUploadImage(shopId) {
  const planTier = await getShopPlan(shopId);
  const limits   = getLimits(planTier);
  if (limits.maxStorageGB === Infinity) return result(true, "maxStorageGB", 0, Infinity);
  // Approximate: count distinct image URLs stored. Replace with real byte tracking later.
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { gallery: true } });
  const current = (shop?.gallery ?? []).length;
  const limit   = limits.maxStorageGB * 500; // ~500 images per GB (rough heuristic)
  return result(current < limit, "maxStorageGB", current, limit);
}

/**
 * Can the shop add another branch (multi-location)?
 * ponytail: branches are shops with the same ownerName for now. Replace with
 * an explicit Branch model when MULTI_BRANCH is properly implemented.
 */
export async function canCreateBranch(shopId) {
  const planTier = await getShopPlan(shopId);
  const limits   = getLimits(planTier);
  if (limits.maxBranches === Infinity) return result(true, "maxBranches", 0, Infinity);
  // For now returns the configured limit; actual branch count check added when
  // MULTI_BRANCH feature is implemented.
  return result(true, "maxBranches", 1, limits.maxBranches);
}

/**
 * Bulk limit check — returns all limits for a shop in one round-trip.
 * Useful for admin settings page to show usage bars.
 */
export async function getAllLimits(shopId) {
  const planTier = await getShopPlan(shopId);
  const limits   = getLimits(planTier);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [barbers, services, monthlyAppts, shop] = await Promise.all([
    prisma.barber.count({ where: { shopId } }),
    prisma.service.count({ where: { shopId, active: true } }),
    prisma.appointment.count({ where: { shopId, createdAt: { gte: monthStart } } }),
    prisma.shop.findUnique({ where: { id: shopId }, select: { gallery: true } }),
  ]);

  return {
    planTier,
    barbers:     { current: barbers,      limit: limits.maxBarbers },
    services:    { current: services,     limit: limits.maxServices },
    appointments:{ current: monthlyAppts, limit: limits.maxMonthlyAppointments },
    storageImages:{ current: (shop?.gallery ?? []).length, limit: limits.maxStorageGB * 500 },
  };
}

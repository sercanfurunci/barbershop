import { prisma } from "@/lib/prisma";

/**
 * Comprehensive usage snapshot for a shop.
 * All counts are read from existing tables — no separate UsageRecord model needed.
 * Call this for the admin billing page or for enforcement checks.
 *
 * @param {string} shopId
 * @returns {Promise<UsageSnapshot>}
 */
export async function getUsage(shopId) {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalAppointments,
    monthlyAppointments,
    totalCustomers,
    activeStaff,
    totalServices,
    totalReviews,
    totalFavorites,
    monthlySmsSent,
    monthlyWaSent,
    storageImages,
    conversations,
  ] = await Promise.all([
    prisma.appointment.count({ where: { shopId } }),
    prisma.appointment.count({ where: { shopId, createdAt: { gte: monthStart } } }),
    prisma.client.count({ where: { shopId } }),
    prisma.barber.count({ where: { shopId, available: true } }),
    prisma.service.count({ where: { shopId, active: true } }),
    prisma.review.count({ where: { shopId } }),
    prisma.customerFavorite.count({ where: { shopId } }),
    prisma.notificationJob.count({ where: { shopId, channel: "SMS", status: "SENT", processedAt: { gte: monthStart } } }),
    prisma.notificationJob.count({ where: { shopId, channel: "WHATSAPP", status: "SENT", processedAt: { gte: monthStart } } }),
    prisma.shop.findUnique({ where: { id: shopId }, select: { gallery: true } }).then(s => (s?.gallery ?? []).length),
    prisma.conversation.count({ where: { shopId, createdAt: { gte: monthStart } } }),
  ]);

  return {
    period: { start: monthStart.toISOString(), end: now.toISOString() },
    totals: {
      appointments: totalAppointments,
      customers:    totalCustomers,
      staff:        activeStaff,
      services:     totalServices,
      reviews:      totalReviews,
      favorites:    totalFavorites,
      storageImages,
    },
    monthly: {
      appointments:       monthlyAppointments,
      smsSent:            monthlySmsSent,
      whatsappSent:       monthlyWaSent,
      aiConversations:    conversations,
      // Future: voiceMinutes, instagramMessages — wire from respective job tables
      voiceMinutes:       0,
      instagramMessages:  0,
      apiRequests:        0, // wire from access log when API_ACCESS is implemented
    },
  };
}

/**
 * @typedef {Object} UsageSnapshot
 * @property {{ start: string, end: string }} period
 * @property {{ appointments: number, customers: number, staff: number, services: number, reviews: number, favorites: number, storageImages: number }} totals
 * @property {{ appointments: number, smsSent: number, whatsappSent: number, aiConversations: number, voiceMinutes: number, instagramMessages: number, apiRequests: number }} monthly
 */

import { prisma } from "@/lib/prisma";
import { createBooking } from "@/lib/services/BookingService";
import { resolveIdentity, findOrCreateClient } from "@/lib/services/CustomerService";
import { cancelAppointment, rescheduleAppointment } from "@/lib/services/AppointmentService";
import { getAvailableSlots, getAllBarbersSlots } from "@/lib/services/AvailabilityService";
import { todayStr } from "@/lib/utils";

// Schedule pending reminder notifications for 24h, 2h, 30min before appointment.
// Records are created with sentAt=null; a future cron processes them when WhatsApp/SMS is connected.
async function _scheduleReminders(appt) {
  if (!appt?.clientId || !appt?.shopId) return;
  await prisma.notification.createMany({
    data: [
      { shopId: appt.shopId, clientId: appt.clientId, appointmentId: appt.id, type: "reminder_24h",   channel: "sms", body: null },
      { shopId: appt.shopId, clientId: appt.clientId, appointmentId: appt.id, type: "reminder_2h",    channel: "sms", body: null },
      { shopId: appt.shopId, clientId: appt.clientId, appointmentId: appt.id, type: "reminder_30min", channel: "sms", body: null },
    ],
    skipDuplicates: true,
  });
}

// Simple token-overlap confidence: 100 = exact, 95 = all tokens match, 80 = partial, 20 = no overlap
function nameConfidence(registered, provided) {
  if (!registered || !provided) return 50;
  const norm = s => s.toLowerCase().replace(/[^a-züşğıöçÜŞĞIİÖÇ\s]/gi, "").trim();
  const a = norm(registered);
  const b = norm(provided);
  if (a === b) return 100;
  // Remove common honorifics before comparing
  const strip = s => s.replace(/\b(bay|bayan|mr|mrs|ms|dr|prof|hoca)\b\.?\s*/gi, "").trim();
  if (strip(a) === strip(b)) return 98;
  const wordsA = new Set(a.split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.split(/\s+/).filter(Boolean));
  const shared = [...wordsA].filter(w => wordsB.has(w)).length;
  if (!shared) return 20;
  const union = new Set([...wordsA, ...wordsB]).size;
  const jaccard = shared / union;
  if (jaccard >= 0.8) return 95;
  if (jaccard >= 0.5) return 80;
  return 60;
}

// minToTime used by catalog.workingHours
function minToTime(m) { return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }

/**
 * AI tool handler registry.
 * Each function matches the `handler` field in lib/ai/tools.js and accepts
 * the validated parameters object from the AI tool call.
 * Call via: dispatch(toolName, params)
 */
export const handlers = {

  // ── availability.getSlots ──────────────────────────────────────────────────
  "availability.getSlots": async ({ shopId, barberId, serviceId, date }) => {
    const result = await getAvailableSlots({ shopId, barberId, serviceId, date });
    // debugLog is for server logs only — strip before returning to AI
    const { debugLog: _log, ...aiResult } = result;
    return aiResult;
  },

  // ── availability.findAllSlots ─────────────────────────────────────────────
  "availability.findAllSlots": async ({ shopId, serviceId, date }) => {
    return getAllBarbersSlots({ shopId, serviceId, date });
  },

  // ── booking.create ────────────────────────────────────────────────────────
  "booking.create": async ({ onBehalfOf, ...params }) => {
    const appt = await createBooking({ source: "AI_CHAT", ...params, bookedByName: onBehalfOf ?? null });
    // Schedule reminder notifications (fire-and-forget, non-blocking)
    _scheduleReminders(appt).catch(() => {});
    return {
      appointmentId: appt.id,
      status:        appt.status,
      date:          appt.date,
      time:          appt.time,
      duration:      appt.duration,
      price:         appt.price,
      barberName:    appt.barber?.nameTr ?? null,
      serviceName:   appt.service?.nameTr ?? null,
    };
  },

  // ── appointment.cancel ────────────────────────────────────────────────────
  "appointment.cancel": async ({ appointmentId, cancellationReason }) => {
    return cancelAppointment(appointmentId, { reason: cancellationReason });
  },

  // ── appointment.reschedule ────────────────────────────────────────────────
  "appointment.reschedule": async ({ appointmentId, date, time }) => {
    return rescheduleAppointment(appointmentId, { date, time });
  },

  // ── customer.resolve ──────────────────────────────────────────────────────
  "customer.resolve": async ({ shopId, phone, email, channel, externalId, providedName }) => {
    const client = await resolveIdentity({ shopId, phone, email, channel, externalId });
    if (!client) return { found: false };

    const confidence = providedName ? nameConfidence(client.name, providedName) : 100;

    // Collect all client IDs for this phone (catches pre-normalization duplicates)
    const normalizedPhone = phone ? phone.replace(/\D/g, "").replace(/^(90|0)/, "").slice(-10) : null;
    const allClientIds = [client.id];
    if (normalizedPhone) {
      const altClients = await prisma.client.findMany({
        where: { shopId, phone: { in: [normalizedPhone, `0${normalizedPhone}`, `90${normalizedPhone}`] }, id: { not: client.id } },
        select: { id: true },
      });
      allClientIds.push(...altClients.map(c => c.id));
    }

    const [familyRows, upcomingAppts] = await Promise.all([
      prisma.appointment.groupBy({
        by:      ["bookedByName"],
        where:   { clientId: { in: allClientIds }, bookedByName: { not: null } },
        _count:  { bookedByName: true },
        orderBy: { _count: { bookedByName: "desc" } },
        take:    5,
      }),
      prisma.appointment.findMany({
        where:   { clientId: { in: allClientIds }, date: { gte: todayStr() }, status: { notIn: ["CANCELLED", "NOSHOW"] } },
        orderBy: { date: "asc" },
        take:    5,
        select:  { id: true, date: true, time: true, status: true, bookedByName: true,
                   barber:  { select: { nameTr: true } },
                   service: { select: { nameTr: true } } },
      }),
    ]);

    return {
      found:         true,
      clientId:      client.id,
      name:          client.name,
      phone:         client.phone,
      email:         client.email,
      blocked:       client.blocked,
      visitCount:    client.visitCount,
      nameConfidence: confidence,
      familyMembers: familyRows.map(r => ({ name: r.bookedByName, count: r._count.bookedByName })),
      upcomingAppointments: upcomingAppts.map(a => ({
        id:          a.id,
        date:        a.date,
        time:        a.time,
        status:      a.status,
        forName:     a.bookedByName ?? client.name,
        barberName:  a.barber?.nameTr,
        serviceName: a.service?.nameTr,
      })),
    };
  },

  // ── catalog.services ──────────────────────────────────────────────────────
  "catalog.services": async ({ shopId, barberId }) => {
    const services = await prisma.service.findMany({
      where: {
        shopId,
        active: true,
        ...(barberId ? { barbers: { some: { barberId } } } : {}),
      },
      select: { id: true, nameTr: true, nameEn: true, duration: true, price: true, category: true, icon: true },
      orderBy: [{ sortOrder: "asc" }, { nameTr: "asc" }],
    });
    return { services };
  },

  // ── catalog.barbers ───────────────────────────────────────────────────────
  "catalog.barbers": async ({ shopId }) => {
    const barbers = await prisma.barber.findMany({
      where:   { shopId, available: true },
      select:  { id: true, nameTr: true, nameEn: true, titleTr: true, rating: true, reviewCount: true, avatar: true, slug: true },
      orderBy: { nameTr: "asc" },
    });
    return { barbers };
  },

  // ── catalog.workingHours ──────────────────────────────────────────────────
  "catalog.workingHours": async ({ barberId }) => {
    const wh = await prisma.workingHours.findUnique({ where: { barberId } });
    if (!wh) return { found: false };
    // Return formatted HH:MM strings — not raw minutes — so AI output is consistent with prompt context
    const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];
    const DAY_LABELS = { mon:"Pazartesi",tue:"Salı",wed:"Çarşamba",thu:"Perşembe",fri:"Cuma",sat:"Cumartesi",sun:"Pazar" };
    const schedule = DAYS.map(d => {
      const s = wh[`${d}Start`], e = wh[`${d}End`];
      return { day: DAY_LABELS[d], open: s != null && e != null, start: s != null ? minToTime(s) : null, end: e != null ? minToTime(e) : null };
    });
    return { found: true, schedule };
  },

  // ── catalog.shopInfo ──────────────────────────────────────────────────────
  "catalog.shopInfo": async ({ shopId, slug }) => {
    const shop = await prisma.shop.findFirst({
      where:  shopId ? { id: shopId } : { slug, deletedAt: null },
      select: {
        id: true, name: true, slug: true, address: true, phone: true, email: true,
        description: true, about: true, timezone: true, currency: true,
        wifi: true, parking: true, creditCard: true, airConditioning: true,
        avgRating: true, totalReviews: true,
      },
    });
    if (!shop) return { found: false };
    return { found: true, shop };
  },

  // ── catalog.pricing ───────────────────────────────────────────────────────
  "catalog.pricing": async ({ shopId, category }) => {
    const services = await prisma.service.findMany({
      where:   { shopId, active: true, ...(category ? { category } : {}) },
      select:  { id: true, nameTr: true, nameEn: true, price: true, duration: true, icon: true, category: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    return { services };
  },

  // ── catalog.campaigns ────────────────────────────────────────────────────
  "catalog.campaigns": async ({ shopId }) => {
    const shop = await prisma.shop.findUnique({
      where:  { id: shopId },
      select: { birthdayCampaignType: true, birthdayCampaignValue: true, birthdayCampaignCoupon: true, hasPromotions: true },
    });
    if (!shop) return { found: false };
    return {
      found:    true,
      birthday: shop.birthdayCampaignType
        ? { type: shop.birthdayCampaignType, value: shop.birthdayCampaignValue, coupon: shop.birthdayCampaignCoupon }
        : null,
      hasPromotions: shop.hasPromotions,
    };
  },

  // ── customer.create ───────────────────────────────────────────────────────
  "customer.create": async ({ shopId, name, phone, email }) => {
    const existing = phone ? await prisma.client.findFirst({ where: { shopId, phone } }) : null;
    const client = await findOrCreateClient(prisma, { shopId, name, phone, email }, existing);
    return { clientId: client.id, name: client.name, phone: client.phone, created: !existing };
  },

  // ── reviews.list ─────────────────────────────────────────────────────────
  "reviews.list": async ({ shopId, slug, barberId, take = 5 }) => {
    let resolvedShopId = shopId;
    if (!resolvedShopId && slug) {
      const shop = await prisma.shop.findFirst({ where: { slug, deletedAt: null }, select: { id: true } });
      resolvedShopId = shop?.id;
    }
    if (!resolvedShopId) return { reviews: [] };

    const reviews = await prisma.review.findMany({
      where:   { shopId: resolvedShopId, ...(barberId ? { barberId } : {}), barberRating: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take:    Math.min(take, 20),
      select:  { id: true, barberRating: true, shopRating: true, comment: true, createdAt: true,
                 barber: { select: { nameTr: true } }, customer: { select: { name: true } } },
    });
    return {
      reviews: reviews.map(r => ({
        id:           r.id,
        barberRating: r.barberRating,
        shopRating:   r.shopRating,
        comment:      r.comment,
        createdAt:    r.createdAt,
        barberName:   r.barber?.nameTr,
        customerName: r.customer?.name ?? "Misafir",
      })),
    };
  },
};

/**
 * Dispatch an AI tool call by handler name.
 * @param {string} handlerName — the `handler` field from lib/ai/tools.js
 * @param {object} params      — validated tool call parameters
 * @returns {Promise<object>}
 */
export async function dispatch(handlerName, params) {
  const fn = handlers[handlerName];
  if (!fn) throw new Error(`Unknown AI tool handler: ${handlerName}`);
  return fn(params);
}

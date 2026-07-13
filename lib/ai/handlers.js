import { prisma } from "@/lib/prisma";
import { createBooking } from "@/lib/services/BookingService";
import { resolveIdentity } from "@/lib/services/CustomerService";
import { validateBookingWindow } from "@/lib/booking";
import { todayStr, nowMinutes } from "@/lib/utils";

const SLOT_INTERVAL = 30; // minutes
const DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function timeToMin(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
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
    const today  = todayStr();
    const nowMin = nowMinutes();
    const service = serviceId
      ? await prisma.service.findFirst({ where: { id: serviceId, shopId } })
      : null;
    const duration = service?.duration ?? 30;

    const [barber, existingAppts, holidays] = await Promise.all([
      prisma.barber.findFirst({ where: { id: barberId, shopId }, include: { workingHours: true, breaks: true } }),
      prisma.appointment.findMany({
        where: { barberId, date, status: { notIn: ["CANCELLED", "NOSHOW"] } },
        select: { time: true, duration: true },
      }),
      prisma.holiday.findMany({ where: { shopId, date, OR: [{ barberId }, { barberId: null }] } }),
    ]);

    if (!barber?.workingHours) return { slots: [], reason: "no_working_hours" };
    if (holidays.length > 0)   return { slots: [], reason: "holiday", label: holidays[0].label };

    const dow    = new Date(date + "T12:00:00Z").getUTCDay();
    const dowKey = DAY_MAP[dow];
    const wh     = barber.workingHours;
    const start  = wh[`${dowKey}Start`];
    const end    = wh[`${dowKey}End`];
    if (start == null || end == null) return { slots: [], reason: "closed" };

    const blocked = barber.breaks
      .filter(b => b.date ? b.date === date : b.dayOfWeek == null || b.dayOfWeek === dow)
      .map(b => ({ start: timeToMin(b.start), end: timeToMin(b.end) }));

    for (const a of existingAppts) {
      const s = timeToMin(a.time);
      blocked.push({ start: s, end: s + a.duration });
    }

    const floor = date === today ? nowMin + 30 : 0;
    const slots = [];
    for (let t = start; t + duration <= end; t += SLOT_INTERVAL) {
      if (t < floor) continue;
      const slotEnd = t + duration;
      if (!blocked.some(b => t < b.end && slotEnd > b.start)) {
        slots.push(minToTime(t));
      }
    }
    return { slots, date };
  },

  // ── booking.create ────────────────────────────────────────────────────────
  "booking.create": async (params) => {
    const appt = await createBooking(params);
    return { appointmentId: appt.id, status: appt.status, date: appt.date, time: appt.time };
  },

  // ── appointment.cancel ────────────────────────────────────────────────────
  "appointment.cancel": async ({ appointmentId, cancellationReason }) => {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { status: true, shopId: true },
    });
    if (!appt) throw new Error("Appointment not found");
    if (["CANCELLED", "COMPLETED"].includes(appt.status)) {
      throw new Error(`Cannot cancel appointment with status ${appt.status}`);
    }
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status:             "CANCELLED",
        cancelledAt:        new Date(),
        cancelledBy:        "channel",
        cancellationReason: cancellationReason ?? null,
      },
      select: { id: true, status: true, date: true, time: true },
    });
    return updated;
  },

  // ── appointment.reschedule ────────────────────────────────────────────────
  "appointment.reschedule": async ({ appointmentId, date, time }) => {
    const appt = await prisma.appointment.findUnique({
      where:  { id: appointmentId },
      select: { shopId: true, barberId: true, serviceId: true, duration: true, status: true },
    });
    if (!appt) throw new Error("Appointment not found");
    if (!["PENDING", "CONFIRMED"].includes(appt.status)) {
      throw new Error(`Cannot reschedule appointment with status ${appt.status}`);
    }
    const [h, m]   = time.split(":").map(Number);
    const startMin = h * 60 + m;
    const window   = await validateBookingWindow({
      shopId: appt.shopId, barberId: appt.barberId, date, startMin, durationMin: appt.duration,
    });
    if (!window.ok) throw new Error(window.error);

    const updated = await prisma.$transaction(async (tx) => {
      const conflicts = await tx.appointment.findMany({
        where:  { shopId: appt.shopId, barberId: appt.barberId, date, status: { notIn: ["CANCELLED", "NOSHOW"] }, NOT: { id: appointmentId } },
        select: { time: true, duration: true },
      });
      const taken = conflicts.some(a => {
        const aStart = timeToMin(a.time);
        return startMin < aStart + a.duration && startMin + appt.duration > aStart;
      });
      if (taken) throw new Error("SLOT_TAKEN");
      return tx.appointment.update({
        where: { id: appointmentId },
        data:  { date, time },
        select: { id: true, status: true, date: true, time: true },
      });
    }, { isolationLevel: "Serializable" });

    return updated;
  },

  // ── customer.resolve ──────────────────────────────────────────────────────
  "customer.resolve": async ({ shopId, phone, email, channel, externalId }) => {
    const client = await resolveIdentity({ shopId, phone, email, channel, externalId });
    if (!client) return { found: false };
    return {
      found:      true,
      clientId:   client.id,
      name:       client.name,
      phone:      client.phone,
      email:      client.email,
      blocked:    client.blocked,
      visitCount: client.visitCount,
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
    return { found: true, workingHours: wh };
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

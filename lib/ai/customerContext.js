/**
 * Customer context builder.
 *
 * Enriches the AI prompt with the customer's history so Claude can answer
 * naturally: "same as last time" → Claude already knows the barber and service.
 *
 * Returned object is injected into buildSystemPrompt() and never sent to the
 * AI as raw JSON — the prompt builder decides what to surface and how.
 */

import { prisma } from "@/lib/prisma";
import { todayStr } from "@/lib/utils";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/ai/cache";

// ponytail: 5min TTL — customer history rarely changes mid-conversation
const CACHE_TTL = 5 * 60_000;

const DAY_NAMES_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0")  && digits.length === 11) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

function avgIntervalDays(sortedDates) {
  if (sortedDates.length < 2) return null;
  let total = 0;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / (1000 * 60 * 60 * 24);
    total += diff;
  }
  return Math.round(total / (sortedDates.length - 1));
}

function topN(counts, n = 2) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

/**
 * Build customer context from their booking history.
 * Returns null if the phone is unknown to the shop.
 *
 * @param {string} shopId
 * @param {string} senderPhone — raw phone from channel (any format)
 * @param {"tr"|"en"} [lang]
 * @returns {Promise<CustomerContext | null>}
 */
export async function buildCustomerContext(shopId, senderPhone, lang = "tr") {
  const phone = normalizePhone(senderPhone);
  if (!phone) return null;

  const cacheKey = `custctx:${shopId}:${phone}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

  const today = todayStr();

  const [client, familyAppts] = await Promise.all([
    prisma.client.findUnique({
      where:  { shopId_phone: { shopId, phone } },
      select: {
        id: true, name: true, phone: true, notes: true,
        blocked: true, visitCount: true, lastVisitAt: true,
        totalSpent: true, noShowCount: true, createdAt: true,
        appointments: {
          orderBy: { date: "asc" },
          take:    30,
          select:  {
            id: true, date: true, time: true, status: true, bookedByName: true,
            barber:  { select: { id: true, nameTr: true } },
            service: { select: { id: true, nameTr: true } },
          },
        },
      },
    }),
    Promise.resolve(null), // placeholder, computed after client loaded
  ]);

  if (!client) return null;

  const allAppts = client.appointments;
  const completed = allAppts.filter(a => a.status === "COMPLETED");
  const cancelled = allAppts.filter(a => a.status === "CANCELLED");
  const upcoming  = allAppts.filter(a => a.date >= today && !["COMPLETED", "CANCELLED", "NOSHOW"].includes(a.status));
  const past      = completed.filter(a => a.date < today);

  // Favorite barber — most-booked from completed
  const barberCount = {};
  for (const a of completed) if (a.barber) barberCount[a.barber.id] = (barberCount[a.barber.id] ?? 0) + 1;
  const topBarberId    = Object.keys(barberCount).sort((a, b) => barberCount[b] - barberCount[a])[0];
  const favoriteBarber = topBarberId ? completed.find(a => a.barber?.id === topBarberId)?.barber ?? null : null;

  // Favorite service — most-booked from completed
  const serviceCount = {};
  for (const a of completed) if (a.service) serviceCount[a.service.id] = (serviceCount[a.service.id] ?? 0) + 1;
  const topServiceId    = Object.keys(serviceCount).sort((a, b) => serviceCount[b] - serviceCount[a])[0];
  const favoriteService = topServiceId ? completed.find(a => a.service?.id === topServiceId)?.service ?? null : null;

  // Average visit interval
  const completedDates  = past.map(a => a.date).sort();
  const avgIntervalDays_ = avgIntervalDays(completedDates);

  // Preferred hours (top 2 from completed)
  const hourCount = {};
  for (const a of completed) {
    const h = a.time?.slice(0, 5);
    if (h) hourCount[h] = (hourCount[h] ?? 0) + 1;
  }
  const preferredHours = topN(hourCount, 2);

  // Preferred days (top 2 from completed)
  const dayNames = lang === "en" ? DAY_NAMES_EN : DAY_NAMES_TR;
  const dayCount = {};
  for (const a of completed) {
    const d = new Date(a.date + "T12:00:00Z").getUTCDay();
    const name = dayNames[d];
    dayCount[name] = (dayCount[name] ?? 0) + 1;
  }
  const preferredDays = topN(dayCount, 2);

  // Family members from bookedByName
  const familyApptRows = await prisma.appointment.groupBy({
    by:      ["bookedByName"],
    where:   { clientId: client.id, bookedByName: { not: null } },
    _count:  { bookedByName: true },
    orderBy: { _count: { bookedByName: "desc" } },
    take:    5,
  });
  const familyMembers = familyApptRows.map(r => ({ name: r.bookedByName, count: r._count.bookedByName }));

  const lastAppt = past.at(-1) ?? null;

  const daysSinceLastVisit = client.lastVisitAt
    ? Math.floor((Date.now() - new Date(client.lastVisitAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const result = {
    clientId:            client.id,
    name:                client.name,
    phone:               client.phone,
    blocked:             client.blocked,
    visitCount:          client.visitCount,
    completedCount:      past.length,
    cancelledCount:      cancelled.length,
    noShowCount:         client.noShowCount ?? 0,
    totalSpent:          client.totalSpent  ?? 0,
    lastVisitAt:         client.lastVisitAt,
    customerSince:       client.createdAt,
    notes:               client.notes,
    daysSinceLastVisit,
    avgVisitIntervalDays: avgIntervalDays_,
    preferredHours,
    preferredDays,
    lastAppointment: lastAppt ? {
      barberName: lastAppt.barber?.nameTr, serviceName: lastAppt.service?.nameTr, date: lastAppt.date,
    } : null,
    upcomingAppointments: upcoming.map(a => ({
      id: a.id, date: a.date, time: a.time, status: a.status,
      forName:     a.bookedByName ?? client.name,
      barberName:  a.barber?.nameTr,
      serviceName: a.service?.nameTr,
    })),
    favoriteBarber:  favoriteBarber  ? { id: favoriteBarber.id,  name: favoriteBarber.nameTr  } : null,
    favoriteService: favoriteService ? { id: favoriteService.id, name: favoriteService.nameTr } : null,
    familyMembers,
  };

  cacheSet(cacheKey, result, CACHE_TTL);
  return result;
}

/** Call after appointment creation/cancellation to reflect changes immediately. */
export function invalidateCustomerContext(shopId, phone) {
  const normalized = phone?.replace(/\D/g, "");
  if (normalized) cacheInvalidate(`custctx:${shopId}:${normalized}`);
}

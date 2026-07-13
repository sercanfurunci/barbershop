import { prisma } from "@/lib/prisma";

/**
 * Unified search service.
 * All full-text search lives here — never duplicate search logic in routes.
 * Returns normalized result objects with a common shape for each entity type.
 */

/**
 * Search clients by name or phone within a shop.
 * @param {string} shopId
 * @param {string} query
 * @param {{ limit?: number }} opts
 */
export async function searchClients(shopId, query, { limit = 20 } = {}) {
  const clients = await prisma.client.findMany({
    where: {
      shopId,
      OR: [
        { name:  { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take:    limit,
    orderBy: { name: "asc" },
    select:  { id: true, name: true, phone: true, email: true, visitCount: true, blocked: true },
  });
  return clients.map(c => ({ type: "client", ...c }));
}

/**
 * Search appointments by date, client name, or barber name.
 */
export async function searchAppointments(shopId, query, { limit = 20, status } = {}) {
  const appts = await prisma.appointment.findMany({
    where: {
      shopId,
      ...(status ? { status } : {}),
      OR: [
        { date:   { contains: query } },
        { client: { name:  { contains: query, mode: "insensitive" } } },
        { client: { phone: { contains: query } } },
        { barber: { nameTr: { contains: query, mode: "insensitive" } } },
      ],
    },
    take:    limit,
    orderBy: [{ date: "desc" }, { time: "desc" }],
    select:  {
      id: true, date: true, time: true, status: true, source: true,
      client:  { select: { name: true, phone: true } },
      barber:  { select: { nameTr: true } },
      service: { select: { nameTr: true } },
    },
  });
  return appts.map(a => ({ type: "appointment", ...a }));
}

/**
 * Search barbers by name within a shop.
 */
export async function searchBarbers(shopId, query, { limit = 10 } = {}) {
  const barbers = await prisma.barber.findMany({
    where: {
      shopId,
      available: true,
      OR: [
        { nameTr: { contains: query, mode: "insensitive" } },
        { titleTr: { contains: query, mode: "insensitive" } },
      ],
    },
    take:    limit,
    orderBy: { nameTr: "asc" },
    select:  { id: true, nameTr: true, titleTr: true, avatar: true, rating: true, slug: true },
  });
  return barbers.map(b => ({ type: "barber", ...b }));
}

/**
 * Search shops across the platform (used by marketplace / super-admin).
 */
export async function searchShops(query, { limit = 20, city } = {}) {
  const shops = await prisma.shop.findMany({
    where: {
      deletedAt: null,
      status:    "ACTIVE",
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      OR: [
        { name:    { contains: query, mode: "insensitive" } },
        { slug:    { contains: query, mode: "insensitive" } },
        { city:    { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ],
    },
    take:    limit,
    orderBy: [{ avgRating: "desc" }, { totalReviews: "desc" }],
    select:  { id: true, slug: true, name: true, city: true, avgRating: true, totalReviews: true, logo: true },
  });
  return shops.map(s => ({ type: "shop", ...s }));
}

/**
 * Search services by name within a shop.
 */
export async function searchServices(shopId, query, { limit = 20 } = {}) {
  const services = await prisma.service.findMany({
    where: {
      shopId, active: true,
      OR: [
        { nameTr: { contains: query, mode: "insensitive" } },
        { nameEn: { contains: query, mode: "insensitive" } },
      ],
    },
    take:    limit,
    orderBy: { sortOrder: "asc" },
    select:  { id: true, nameTr: true, nameEn: true, price: true, duration: true, icon: true, category: true },
  });
  return services.map(s => ({ type: "service", ...s }));
}

/**
 * Universal search across all entity types.
 * Returns a unified list with a `type` discriminator.
 * ponytail: runs queries in parallel; client can filter by type client-side.
 *
 * @param {string} shopId
 * @param {string} query
 * @returns {Promise<Array<{ type: string, id: string, [key: string]: any }>>}
 */
export async function universalSearch(shopId, query, { limit = 10 } = {}) {
  if (!query || query.trim().length < 2) return [];

  const [clients, barbers, services] = await Promise.all([
    searchClients(shopId, query, { limit }),
    searchBarbers(shopId, query, { limit: Math.min(limit, 5) }),
    searchServices(shopId, query, { limit }),
  ]);

  return [...clients, ...barbers, ...services];
}

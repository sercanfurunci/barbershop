import { prisma } from "@/lib/prisma";

// Normalize Turkish mobile numbers to bare 10-digit format (no country code).
function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0")  && digits.length === 11) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

/**
 * Find a Client by normalized phone within a shop.
 * @param {string} shopId
 * @param {string} rawPhone
 * @returns {Promise<import("@prisma/client").Client | null>}
 */
export async function findByPhone(shopId, rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return null;
  return prisma.client.findUnique({ where: { shopId_phone: { shopId, phone } } });
}

/**
 * Find a Client by email within a shop (first match).
 * @param {string} shopId
 * @param {string} email
 * @returns {Promise<import("@prisma/client").Client | null>}
 */
export async function findByEmail(shopId, email) {
  if (!email) return null;
  return prisma.client.findFirst({ where: { shopId, email } });
}

/**
 * Find a Client (or User) via an ExternalIdentity record.
 * Returns the linked Client if present, otherwise the linked User.
 * @param {string} channel  — one of CHANNEL constants
 * @param {string} externalId
 * @returns {Promise<{ client: object|null, user: object|null } | null>}
 */
export async function findByExternalId(channel, externalId) {
  const identity = await prisma.externalIdentity.findUnique({
    where: { channel_externalId: { channel, externalId } },
    include: {
      client: true,
      user:   true,
    },
  });
  if (!identity) return null;
  return { client: identity.client, user: identity.user };
}

/**
 * Best-effort identity resolution: try all known identifiers in order.
 * Useful for AI and channel integrations that may only know one identifier.
 *
 * @param {{ shopId: string, phone?: string, email?: string, channel?: string, externalId?: string }} params
 * @returns {Promise<import("@prisma/client").Client | null>}
 */
export async function resolveIdentity({ shopId, phone, email, channel, externalId }) {
  // 1. External channel identity (most specific — unique per channel+id)
  if (channel && externalId) {
    const found = await findByExternalId(channel, externalId);
    if (found?.client) return found.client;
  }
  // 2. Phone (unique per shop)
  if (phone) {
    const byPhone = await findByPhone(shopId, phone);
    if (byPhone) return byPhone;
  }
  // 3. Email (not unique per shop but good enough as tertiary signal)
  if (email) {
    const byEmail = await findByEmail(shopId, email);
    if (byEmail) return byEmail;
  }
  return null;
}

/**
 * Find an existing Client or create one. Returns the client record.
 * Caller is responsible for running this inside a transaction when atomicity matters.
 *
 * @param {import("@prisma/client").Prisma.TransactionClient | typeof prisma} db
 * @param {{ shopId: string, name: string, phone: string, email?: string|null }} data
 * @param {import("@prisma/client").Client|null} [existing]  — pass if already fetched
 * @returns {Promise<import("@prisma/client").Client>}
 */
export async function findOrCreateClient(db, { shopId, name, phone, email }, existing = null) {
  if (existing) {
    return db.client.update({
      where: { id: existing.id },
      data:  { name: name.trim(), ...(email ? { email } : {}) },
    });
  }
  return db.client.create({
    data: { shopId, name: name.trim(), phone, email: email || null },
  });
}

/**
 * Upsert an ExternalIdentity linking a channel-specific ID to a Client or User.
 *
 * @param {{ channel: string, externalId: string, clientId?: string, userId?: string, metadata?: object }} params
 * @returns {Promise<import("@prisma/client").ExternalIdentity>}
 */
export async function upsertExternalIdentity({ channel, externalId, clientId, userId, metadata }) {
  return prisma.externalIdentity.upsert({
    where:  { channel_externalId: { channel, externalId } },
    create: { channel, externalId, clientId, userId, metadata },
    update: { clientId, userId, ...(metadata ? { metadata } : {}) },
  });
}

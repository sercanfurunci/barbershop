import { prisma } from "@/lib/prisma";
import { INTEGRATION_PROVIDER } from "@/lib/constants/limits";

export { INTEGRATION_PROVIDER };

/**
 * Get all integrations for a shop.
 * @param {string} shopId
 * @returns {Promise<Integration[]>}
 */
export async function getIntegrations(shopId) {
  return prisma.integration.findMany({
    where:   { shopId },
    select:  { id: true, provider: true, status: true, config: true, lastSyncAt: true, lastError: true, createdAt: true, updatedAt: true },
    orderBy: { provider: "asc" },
  });
}

/**
 * Get a single integration by provider.
 * @param {string} shopId
 * @param {string} provider
 */
export async function getIntegration(shopId, provider) {
  return prisma.integration.findUnique({
    where:  { shopId_provider: { shopId, provider } },
    select: { id: true, provider: true, status: true, config: true, lastSyncAt: true, lastError: true },
  });
}

/**
 * Upsert integration config. Credentials must be encrypted by the caller before
 * passing as encryptedCreds — this service never handles plaintext secrets.
 *
 * @param {string} shopId
 * @param {string} provider
 * @param {{ status?: string, config?: object, encryptedCreds?: object }} data
 */
export async function upsertIntegration(shopId, provider, data) {
  return prisma.integration.upsert({
    where:  { shopId_provider: { shopId, provider } },
    create: { shopId, provider, ...data },
    update: { ...data, updatedAt: new Date() },
  });
}

/**
 * Mark an integration as connected with its last sync time.
 */
export async function markConnected(shopId, provider) {
  return prisma.integration.upsert({
    where:  { shopId_provider: { shopId, provider } },
    create: { shopId, provider, status: "CONNECTED", lastSyncAt: new Date() },
    update: { status: "CONNECTED", lastSyncAt: new Date(), lastError: null },
  });
}

/**
 * Mark an integration as errored with the error message.
 */
export async function markError(shopId, provider, error) {
  return prisma.integration.upsert({
    where:  { shopId_provider: { shopId, provider } },
    create: { shopId, provider, status: "ERROR", lastError: String(error) },
    update: { status: "ERROR", lastError: String(error) },
  });
}

/**
 * Disconnect an integration (clear credentials, set status DISCONNECTED).
 */
export async function disconnect(shopId, provider) {
  return prisma.integration.upsert({
    where:  { shopId_provider: { shopId, provider } },
    create: { shopId, provider, status: "DISCONNECTED" },
    update: { status: "DISCONNECTED", encryptedCreds: null, lastSyncAt: null, lastError: null },
  });
}

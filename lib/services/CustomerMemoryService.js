/**
 * Customer Memory service.
 * AI-maintained persistent memory for returning customers.
 * Read at conversation start; written after AI determines noteworthy preferences.
 */

import { prisma } from "@/lib/prisma";

const MEMORY_SELECT = {
  id: true, senderPhone: true, favoriteBarber: true, favoriteService: true,
  preferredDays: true, preferredTimes: true, language: true,
  hairNotes: true, allergies: true, communication: true,
  lastUpdatedBy: true, expiresAt: true, createdAt: true, updatedAt: true,
};

/**
 * Get memory for a customer. Returns null if none exists or it has expired.
 */
export async function getMemory(shopId, senderPhone) {
  const row = await prisma.customerMemory.findUnique({
    where:  { shopId_senderPhone: { shopId, senderPhone } },
    select: MEMORY_SELECT,
  });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt < new Date()) {
    await prisma.customerMemory.delete({ where: { shopId_senderPhone: { shopId, senderPhone } } });
    return null;
  }
  return row;
}

/**
 * Upsert memory for a customer. Safe to call after every conversation.
 * Only updates provided fields — partial updates are fine.
 */
export async function setMemory(shopId, senderPhone, patch, updatedBy = "AI") {
  const clean = {};
  if (patch.favoriteBarber  !== undefined) clean.favoriteBarber  = patch.favoriteBarber;
  if (patch.favoriteService !== undefined) clean.favoriteService = patch.favoriteService;
  if (patch.preferredDays   !== undefined) clean.preferredDays   = patch.preferredDays;
  if (patch.preferredTimes  !== undefined) clean.preferredTimes  = patch.preferredTimes;
  if (patch.language        !== undefined) clean.language        = patch.language;
  if (patch.hairNotes       !== undefined) clean.hairNotes       = patch.hairNotes;
  if (patch.allergies       !== undefined) clean.allergies       = patch.allergies;
  if (patch.communication   !== undefined) clean.communication   = patch.communication;

  return prisma.customerMemory.upsert({
    where:  { shopId_senderPhone: { shopId, senderPhone } },
    create: { shopId, senderPhone, ...clean, lastUpdatedBy: updatedBy },
    update: { ...clean, lastUpdatedBy: updatedBy },
    select: MEMORY_SELECT,
  });
}

/**
 * Delete all memory for a customer (GDPR forget).
 */
export async function deleteMemory(shopId, senderPhone) {
  await prisma.customerMemory.deleteMany({ where: { shopId, senderPhone } });
}

/**
 * List all memories for a shop (admin view).
 */
export async function listMemories(shopId, { take = 50, skip = 0 } = {}) {
  const [data, total] = await Promise.all([
    prisma.customerMemory.findMany({
      where:   { shopId },
      select:  MEMORY_SELECT,
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    }),
    prisma.customerMemory.count({ where: { shopId } }),
  ]);
  return { data, total };
}

/**
 * Format memory as text for AI system prompt injection.
 * Returns null when no memory exists.
 */
export function formatMemoryForPrompt(memory) {
  if (!memory) return null;

  const lines = ["MÜŞTERİ HAFIZASI (önceki konuşmalardan öğrenildi):"];

  if (memory.favoriteBarber)                 lines.push(`Tercih ettiği berber ID: ${memory.favoriteBarber}`);
  if (memory.favoriteService)                lines.push(`Tercih ettiği hizmet ID: ${memory.favoriteService}`);
  if (memory.preferredDays?.length)          lines.push(`Tercih ettiği günler: ${memory.preferredDays.join(", ")}`);
  if (memory.preferredTimes?.length)         lines.push(`Tercih ettiği saatler: ${memory.preferredTimes.join(", ")}`);
  if (memory.hairNotes)                      lines.push(`Saç notları: ${memory.hairNotes}`);
  if (memory.allergies)                      lines.push(`Alerji / ürün notları: ${memory.allergies}`);
  if (memory.communication !== "standard")   lines.push(`İletişim tercihi: ${memory.communication}`);
  if (memory.language !== "tr")              lines.push(`Dil: ${memory.language}`);

  return lines.length > 1 ? lines.join("\n") : null;
}

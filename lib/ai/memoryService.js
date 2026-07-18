/**
 * Long-term conversation memory.
 *
 * For short conversations (< SUMMARY_THRESHOLD messages): load all messages.
 * For long conversations: load a DB summary + the last RECENT_COUNT messages.
 *
 * Summary is generated asynchronously after the conversation grows past the
 * threshold, so the first "long" turn still gets the full history once, then
 * all subsequent turns get summary + recent. This avoids a blocking summarise-
 * before-reply delay.
 */

import { prisma } from "@/lib/prisma";

const SUMMARY_THRESHOLD = 20; // messages before switching to summary + recent
const RECENT_COUNT      = 10; // messages kept alongside the summary
const REFRESH_AFTER     = 10; // regenerate summary every N new messages

/**
 * Load context for an AI turn.
 *
 * @param {string} conversationId
 * @returns {Promise<{
 *   messages: { role: "user"|"assistant", content: string }[],
 *   summary: string | null,
 *   needsSummaryRegen: boolean,
 *   messageCount: number
 * }>}
 */
export async function loadConversationContext(conversationId) {
  if (!conversationId) {
    return { messages: [], summary: null, needsSummaryRegen: false, messageCount: 0 };
  }

  const messageCount = await prisma.message.count({ where: { conversationId } });

  if (messageCount < SUMMARY_THRESHOLD) {
    const rows = await prisma.message.findMany({
      where:   { conversationId },
      orderBy: { createdAt: "asc" },
      select:  { direction: true, content: true },
    });
    return {
      messages:          toCanonical(rows),
      summary:           null,
      needsSummaryRegen: false,
      messageCount,
    };
  }

  // Large conversation — use summary + recent
  const [existing, recent] = await Promise.all([
    prisma.conversationSummary.findUnique({ where: { conversationId }, select: { summary: true, messageCount: true } }),
    prisma.message.findMany({
      where:   { conversationId },
      orderBy: { createdAt: "desc" },
      take:    RECENT_COUNT,
      select:  { direction: true, content: true },
    }),
  ]);

  recent.reverse(); // back to chronological

  return {
    messages:          toCanonical(recent),
    summary:           existing?.summary ?? null,
    needsSummaryRegen: !existing || (messageCount - existing.messageCount) >= REFRESH_AFTER,
    messageCount,
  };
}

/**
 * Generate (or regenerate) a summary of the full conversation.
 * Call this asynchronously, after the reply has been sent.
 *
 * @param {string}   conversationId
 * @param {object}   provider  — AI provider with .complete() (from lib/ai/providers/index.js)
 */
export async function refreshSummary(conversationId, provider) {
  const rows = await prisma.message.findMany({
    where:   { conversationId },
    orderBy: { createdAt: "asc" },
    select:  { direction: true, content: true },
  });

  if (rows.length === 0) return;

  const transcript = rows
    .map(r => `${r.direction === "INBOUND" ? "Müşteri" : "Asistan"}: ${r.content}`)
    .join("\n");

  const { text } = await provider.complete({
    systemPrompt: "Aşağıdaki müşteri-asistan konuşmasını 3-5 cümleyle Türkçe özetle. Randevu bilgileri, seçilen berber ve hizmet bilgileri, müşteri tercihleri ve açık kalan konuları mutlaka dahil et.",
    messages:     [{ role: "user", content: transcript }],
    config:       { maxTokens: 300 },
  });

  if (!text) return;

  await prisma.conversationSummary.upsert({
    where:  { conversationId },
    create: { conversationId, summary: text, messageCount: rows.length },
    update: { summary: text, messageCount: rows.length },
  });
}

// ── Private ───────────────────────────────────────────────────────────────────

function toCanonical(rows) {
  return rows.map(r => ({
    role:    r.direction === "INBOUND" ? "user" : "assistant",
    content: r.content,
  }));
}

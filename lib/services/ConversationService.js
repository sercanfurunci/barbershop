/**
 * Conversation persistence layer.
 *
 * Wraps the Conversation and Message Prisma models so callers never
 * touch the DB directly. Works with any channel (WHATSAPP, INSTAGRAM, etc.).
 *
 * Conversation state (fast read/write, TTL-based) lives separately in
 * lib/ai/intentParser.js. This service is the audit log layer.
 */

import { prisma } from "@/lib/prisma";

/**
 * Find or create an OPEN conversation for a channel session.
 *
 * One open thread per (channel, shopId, externalId) at a time.
 * A new thread is opened after the previous one is RESOLVED or ABANDONED.
 *
 * @param {{ channel, shopId, externalId, clientId?, userId? }} opts
 * @returns {Promise<Conversation>}
 */
export async function upsertConversation({ channel, shopId, externalId, clientId, userId }) {
  const existing = await prisma.conversation.findFirst({
    where:   { channel, shopId, externalId, status: "OPEN" },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      channel,
      shopId,
      externalId,
      clientId:  clientId ?? null,
      userId:    userId   ?? null,
      status:    "OPEN",
    },
  });
}

/**
 * Append a message to a conversation.
 * Idempotent on externalId — replayed webhooks won't create duplicates.
 *
 * @param {string} conversationId
 * @param {{ direction, senderType, contentType?, content, externalId?, attachments?, metadata? }} opts
 * @returns {Promise<Message>}
 */
export async function logMessage(conversationId, {
  direction,
  senderType,
  contentType = "TEXT",
  content,
  externalId,
  attachments,
  metadata,
}) {
  // Dedup: if we've seen this channel message ID before, skip
  if (externalId) {
    const dup = await prisma.message.findFirst({
      where:  { externalId },
      select: { id: true },
    });
    if (dup) return dup;
  }

  const [msg] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        direction,
        senderType,
        contentType,
        content:    content ?? "",
        externalId: externalId ?? null,
        attachments: attachments ?? [],
        metadata:   metadata ?? undefined,
      },
    }),
    // Touch updatedAt so ordering and "last active" queries work correctly
    prisma.conversation.update({
      where: { id: conversationId },
      data:  { updatedAt: new Date() },
    }),
  ]);

  return msg;
}

/**
 * Mark a conversation as resolved (e.g., after appointment confirmed or staff handoff).
 */
export async function resolveConversation(conversationId) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data:  { status: "RESOLVED" },
  });
}

/**
 * Mark a conversation as abandoned (e.g., 24h inactivity cron).
 */
export async function abandonConversation(conversationId) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data:  { status: "ABANDONED" },
  });
}

/**
 * Fetch recent messages for a conversation (newest first).
 */
export async function getMessages(conversationId, take = 20) {
  return prisma.message.findMany({
    where:   { conversationId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

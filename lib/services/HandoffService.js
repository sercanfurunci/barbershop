/**
 * Human Handoff service.
 * Manages the BOT → HUMAN → BOT conversation mode lifecycle.
 *
 * When mode is HUMAN:
 *   - Incoming messages are logged but NOT auto-replied by AI
 *   - The assigned agent sees messages in the Conversation Center
 *   - The agent can reply via POST /api/admin/conversations/[id]/messages
 * When released:
 *   - mode returns to BOT
 *   - AI resumes auto-reply on next incoming message
 */

import { prisma } from "@/lib/prisma";
import { createSender } from "@/lib/whatsapp/senders";
import { logMessage } from "@/lib/services/ConversationService";

/**
 * Agent takes over a conversation. Sets mode = HUMAN.
 *
 * @param {string} conversationId
 * @param {string} agentUserId — userId of the staff member taking over
 */
export async function takeover(conversationId, agentUserId) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      mode:          "HUMAN",
      assignedUserId: agentUserId,
      handoffAt:     new Date(),
    },
    select: { id: true, mode: true, assignedUserId: true, handoffAt: true },
  });
}

/**
 * Agent releases conversation back to the bot.
 */
export async function release(conversationId) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      mode:           "BOT",
      assignedUserId: null,
      handoffAt:      null,
    },
    select: { id: true, mode: true, assignedUserId: true },
  });
}

/**
 * Send a message as a human agent.
 * Logs to DB and sends via the channel.
 *
 * @param {string} conversationId
 * @param {string} agentUserId
 * @param {string} content
 */
export async function sendAgentMessage(conversationId, agentUserId, content) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true, channel: true, externalId: true, shopId: true,
      shop: {
        select: { whatsappPhoneNumberId: true },
      },
    },
  });

  if (!conversation) throw Object.assign(new Error("Konuşma bulunamadı"), { status: 404 });

  // Log the agent message
  const message = await logMessage(conversationId, {
    direction:   "OUTBOUND",
    senderType:  "AGENT",
    contentType: "TEXT",
    content,
  });

  // Deliver via the channel
  if (conversation.channel === "WHATSAPP" && conversation.externalId) {
    const sender = createSender();
    await sender.sendWithRetry(conversation.externalId, content, conversation.shop?.whatsappPhoneNumberId).catch(() => {});
  }
  // ponytail: other channels (Telegram, Instagram) send via their providers when implemented

  return message;
}

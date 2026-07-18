/**
 * WhatsApp webhook processing pipeline.
 *
 * Route handlers are thin wrappers — all logic lives here so it can be
 * tested independently and reused without HTTP context.
 *
 *   verifySignature / verifyChallenge  — Meta auth
 *   handlePayload                      — entry point for POST body
 *   processIncoming                    — exported for debug endpoint (same AI pipeline)
 */

import { createHmac, timingSafeEqual } from "crypto";
import { meta as metaConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { checkAiRateLimits } from "@/lib/ai/rateLimiter";
import { hasFeature } from "@/lib/services/FeatureService";
import { FEATURE } from "@/lib/constants/features";
import { resolveIdentity } from "@/lib/services/CustomerService";
import { upsertConversation, logMessage } from "@/lib/services/ConversationService";
import { parseMessage, parseStatus, hasActionableText } from "@/lib/whatsapp/parser";
import { createSender } from "@/lib/whatsapp/senders";
import { chat } from "@/lib/ai/aiService";

// ── Verification ──────────────────────────────────────────────────────────────

/**
 * Verify the X-Hub-Signature-256 header sent by Meta.
 * Returns true when the secret is not configured (dev mode — no verification).
 *
 * @param {string} rawBody       — request body as raw string
 * @param {string} sigHeader     — value of X-Hub-Signature-256 header
 */
export function verifySignature(rawBody, sigHeader) {
  const secret = metaConfig.appSecret;
  if (!secret) return true; // dev: skip when META_APP_SECRET not set

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = (sigHeader ?? "").replace("sha256=", "");

  // Guard against length-timing attacks and Buffer.from exceptions on odd hex
  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

/**
 * Verify Meta's GET challenge for webhook registration.
 * Returns the challenge string on success, null on failure.
 */
export function verifyChallenge(mode, token, challenge) {
  if (mode === "subscribe" && token && token === metaConfig.verifyToken) return challenge;
  return null;
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

/**
 * Process a fully verified webhook payload.
 * Iterates all entries → changes → messages, swallowing per-message errors.
 *
 * @param {object} payload — parsed JSON body from Meta
 * @param {object} log     — structured logger
 */
export async function handlePayload(payload, log) {
  if (payload.object !== "whatsapp_business_account") return;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;

      const value         = change.value ?? {};
      const phoneNumberId = value.metadata?.phone_number_id;
      const displayPhone  = value.metadata?.display_phone_number;

      // Log status updates (delivered / read / failed) — no AI processing needed
      for (const rawStatus of value.statuses ?? []) {
        const s = parseStatus(rawStatus);
        if (s) {
          log.info("wa status", { status: s.status, msgId: s.messageId.slice(-8) });
        }
      }

      // Handle inbound messages
      for (const rawMsg of value.messages ?? []) {
        await _handleMessage({ rawMsg, phoneNumberId, displayPhone, log }).catch(e =>
          log.error("wa message pipeline error", { msgId: rawMsg.id }, e),
        );
      }
    }
  }
}

// ── Exported processing entry point (also used by debug endpoint) ─────────────

/**
 * Run the full AI pipeline for a single inbound text message.
 * Called by _handleMessage (real webhook) and the debug endpoint (mock incoming).
 *
 * @param {object} shop           — shop record from Prisma
 * @param {string} senderPhone    — E.164 without +  (e.g. "905321234567")
 * @param {string} text           — message text
 * @param {string} messageId      — external message id
 * @param {string|null} phoneNumberId — Meta phone_number_id (null in debug mode)
 * @param {string} [contentType]  — inbound content type, defaults to "TEXT"
 * @param {object} [metadata]     — raw message metadata
 * @param {Array}  [attachments]  — attachment list
 * @param {boolean} [hasText]     — override hasActionableText check
 * @param {object} log            — structured logger
 */
export async function processIncoming({
  shop, senderPhone, text, messageId, phoneNumberId,
  contentType = "TEXT", metadata = {}, attachments = [], hasText = !!text,
  skipHandoffCheck = false,
  log,
}) {
  const opts = { skipHandoffCheck };
  const sender = createSender();
  const t0 = Date.now();

  log.info("wa incoming", {
    type:  contentType,
    from:  senderPhone.slice(-4),
    msgId: (messageId ?? "").slice(-8),
  });

  // Layered rate limits: per-user (minute/hour/day) + per-shop (hour/day)
  const rl = await checkAiRateLimits(shop.id, senderPhone);
  if (!rl.ok) {
    log.warn("wa rate limited", { level: rl.level, shopId: shop.id, from: senderPhone.slice(-4) });
    await sender.sendWithRetry(senderPhone, "Çok fazla mesaj gönderdiniz. Lütfen bir süre bekleyip tekrar deneyin.", phoneNumberId).catch(() => {});
    return;
  }

  // Feature gate: global kill-switch (WHATSAPP_AI env) AND per-shop plan feature
  const aiEnabled = metaConfig.aiEnabled && await hasFeature(shop, FEATURE.WHATSAPP_AI);
  if (!aiEnabled) {
    await sender.sendWithRetry(senderPhone, "Bu özellik şu anda aktif değil.", phoneNumberId).catch(() => {});
    return;
  }

  // Find or open a conversation thread in the DB
  const conversation = await upsertConversation({
    channel:    "WHATSAPP",
    shopId:     shop.id,
    externalId: senderPhone,
  });

  // Human handoff: log the message but do NOT auto-reply with AI
  // Agent responds manually via the Conversation Center
  if (conversation.mode === "HUMAN" && !opts.skipHandoffCheck) {
    log.info("wa human mode — skipping AI", { conversationId: conversation.id, assignedUserId: conversation.assignedUserId });
    await logMessage(conversation.id, {
      direction:   "INBOUND",
      senderType:  "USER",
      contentType,
      content:     text || "[non-text]",
      externalId:  messageId,
      metadata,
      attachments,
    });
    return;
  }

  // Log inbound message (deduped on externalId = msg.id)
  await logMessage(conversation.id, {
    direction:   "INBOUND",
    senderType:  "USER",
    contentType,
    content:     text || "[non-text]",
    externalId:  messageId,
    metadata,
    attachments,
  });

  // If no actionable text, reply with a prompt and stop
  if (!hasText) {
    const reply = "Yalnızca metin mesajlarını anlayabiliyorum. Lütfen yazarak devam edin. 🙏";
    await sender.sendWithRetry(senderPhone, reply, phoneNumberId);
    await logMessage(conversation.id, { direction: "OUTBOUND", senderType: "BOT", contentType: "TEXT", content: reply });
    return;
  }

  // Show typing indicator (best-effort)
  await sender.typingIndicator(messageId, phoneNumberId);

  // Resolve customer (ExternalIdentity → phone lookup → null for unknowns)
  if (!conversation.clientId) {
    const customer = await resolveIdentity({ shopId: shop.id, channel: "WHATSAPP", externalId: senderPhone });
    if (customer?.id) {
      await prisma.conversation.update({ where: { id: conversation.id }, data: { clientId: customer.id } });
    }
  }

  // AI processing — pass conversationId for DB memory + usage logging
  const t1    = Date.now();
  const reply = await chat(shop, senderPhone, text, log, {
    conversationId: conversation.id,
    channel:        "WHATSAPP",
  });
  log.info("ai latency", { ms: Date.now() - t1, shopId: shop.id });

  // Log outbound message
  await logMessage(conversation.id, {
    direction:   "OUTBOUND",
    senderType:  "BOT",
    contentType: "TEXT",
    content:     reply,
  });

  // Send to WhatsApp (or mock console in dev)
  const t2 = Date.now();
  await sender.sendWithRetry(senderPhone, reply, phoneNumberId);
  log.info("meta latency", { ms: Date.now() - t2 });

  log.info("wa handled", {
    shopId:         shop.id,
    conversationId: conversation.id,
    totalMs:        Date.now() - t0,
  });
}

// ── Private ───────────────────────────────────────────────────────────────────

async function _handleMessage({ rawMsg, phoneNumberId, displayPhone, log }) {
  const parsed = parseMessage(rawMsg);
  if (!parsed) return;

  // Multi-tenant: resolve shop by phone_number_id → fallback to display number
  const shop = await _resolveShop(phoneNumberId, displayPhone);
  if (!shop) {
    log.warn("wa unknown shop", { phoneNumberId, displayPhone });
    return;
  }

  return processIncoming({
    shop,
    senderPhone:  parsed.from,
    text:         parsed.text,
    messageId:    parsed.id,
    phoneNumberId,
    contentType:  parsed.contentType,
    metadata:     parsed.metadata,
    attachments:  parsed.attachments,
    hasText:      hasActionableText(parsed),
    log,
  });
}

// ── Shop resolution ───────────────────────────────────────────────────────────

const _shopSelect = {
  id: true, name: true, address: true, phone: true,
  planTier: true, whatsappAiEnabled: true, subscriptionStatus: true,
};

async function _resolveShop(phoneNumberId, displayPhone) {
  // Primary: phone_number_id stored on the shop (fast, exact, multi-tenant safe)
  if (phoneNumberId) {
    const shop = await prisma.shop.findFirst({
      where:  { whatsappPhoneNumberId: phoneNumberId, deletedAt: null },
      select: _shopSelect,
    });
    if (shop) return shop;
  }

  // Fallback: match whatsappNumber against Meta's display_phone_number
  if (displayPhone) {
    return prisma.shop.findFirst({
      where: {
        OR: [
          { whatsappNumber: displayPhone },
          { whatsappNumber: `+${displayPhone}` },
        ],
        deletedAt: null,
      },
      select: _shopSelect,
    });
  }

  return null;
}

/**
 * Outbound WhatsApp message functions.
 * Every call to the Meta Cloud API goes through client.js → this module.
 */

import { meta } from "@/lib/config";
import { graphPost } from "@/lib/whatsapp/client";

const MAX_CHARS    = 4096;
const RETRY_DELAYS = [1_000, 2_000]; // two retries with exponential backoff

// ── Core senders ─────────────────────────────────────────────────────────────

/**
 * Send a plain text message. Splits automatically at sentence boundaries
 * if the text exceeds Meta's 4096-character limit.
 *
 * @param {string} to            — recipient wa_id (E.164 without +, e.g. "905321234567")
 * @param {string} text
 * @param {string} [phoneNumberId] — override global META_PHONE_NUMBER_ID for multi-tenant
 */
export async function sendText(to, text, phoneNumberId) {
  const pid   = phoneNumberId ?? meta.phoneNumberId;
  const parts = splitMessage(text);
  for (const part of parts) {
    await graphPost(pid, "/messages", {
      messaging_product: "whatsapp",
      recipient_type:    "individual",
      to,
      type: "text",
      text: { body: part, preview_url: false },
    });
  }
}

/**
 * Send a pre-approved Meta template message.
 *
 * @param {string} to
 * @param {string} templateName   — approved template name in Meta Business Manager
 * @param {string} languageCode   — "tr" | "en_US" | etc.
 * @param {object[]} [components] — template parameter components array
 * @param {string} [phoneNumberId]
 */
export async function sendTemplate(to, templateName, languageCode, components, phoneNumberId) {
  const pid = phoneNumberId ?? meta.phoneNumberId;
  await graphPost(pid, "/messages", {
    messaging_product: "whatsapp",
    to,
    type:     "template",
    template: {
      name:       templateName,
      language:   { code: languageCode },
      components: components ?? [],
    },
  });
}

/**
 * Mark a received message as read. Shows the double-blue-check on the sender's side.
 * Required before typingIndicator — Meta ties the typing UI to the read receipt.
 *
 * @param {string} messageId     — externalId of the received message (msg.id from webhook)
 * @param {string} [phoneNumberId]
 */
export async function markRead(messageId, phoneNumberId) {
  const pid = phoneNumberId ?? meta.phoneNumberId;
  await graphPost(pid, "/messages", {
    messaging_product: "whatsapp",
    status:     "read",
    message_id: messageId,
  });
}

/**
 * Show a typing indicator to the user.
 * Meta requires a prior markRead on the same message — this function does both.
 * Best-effort: failures are swallowed (UX degradation only).
 *
 * @param {string} messageId     — externalId of the message being replied to
 * @param {string} [phoneNumberId]
 */
export async function typingIndicator(messageId, phoneNumberId) {
  if (!messageId) return;
  await markRead(messageId, phoneNumberId).catch(() => {});
  // ponytail: Meta deprecated standalone typing_on events in v17+; markRead is the signal
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────

/**
 * Send text with exponential retry on transient Meta API failures.
 * Use this for all outbound customer-facing messages.
 */
export async function sendWithRetry(to, text, phoneNumberId) {
  let lastErr;
  for (let i = 0; i <= RETRY_DELAYS.length; i++) {
    try {
      await sendText(to, text, phoneNumberId);
      return;
    } catch (err) {
      lastErr = err;
      const delay = RETRY_DELAYS[i];
      if (delay) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Split text at natural boundaries to stay under MAX_CHARS.
 * Exported so it can be unit-tested independently.
 */
export function splitMessage(text) {
  if (text.length <= MAX_CHARS) return [text];

  const parts = [];
  let rem = text;

  while (rem.length > MAX_CHARS) {
    let cut = rem.lastIndexOf(". ", MAX_CHARS);
    if (cut < MAX_CHARS * 0.6) cut = rem.lastIndexOf("\n", MAX_CHARS);
    if (cut < MAX_CHARS * 0.6) cut = MAX_CHARS;
    else cut += 1; // include the period/newline in the left part
    parts.push(rem.slice(0, cut).trim());
    rem = rem.slice(cut).trim();
  }

  if (rem) parts.push(rem);
  return parts;
}

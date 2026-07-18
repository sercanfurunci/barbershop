/**
 * WhatsApp Cloud API — ChannelProvider implementation.
 * Fulfils the interface defined in lib/channels/types.js.
 */

import { sendWithRetry, markRead as senderMarkRead, typingIndicator as senderTyping } from "@/lib/whatsapp/sender";
import { graphGet, graphPost } from "@/lib/whatsapp/client";
import { parseMessage } from "@/lib/whatsapp/parser";
import { meta } from "@/lib/config";
import { CHANNEL } from "@/lib/channels/types";

export default {
  channel: CHANNEL.WHATSAPP,

  /**
   * Send a text message to a WhatsApp recipient.
   * @param {string} to      — wa_id in E.164 without '+' (e.g. "905321234567")
   * @param {string} message — plain text body
   */
  async send(to, message) {
    await sendWithRetry(to, message);
  },

  /**
   * Show a typing indicator (marks message as read — Meta's typing signal).
   * Best-effort: failures are silently swallowed.
   * @param {string} to        — recipient wa_id
   * @param {string} messageId — externalId of the message being replied to
   */
  async typing(to, messageId) {
    await senderTyping(messageId).catch(() => {});
  },

  /**
   * Mark a received message as read.
   * Best-effort: failures are silently swallowed.
   * @param {string} messageId — externalId of the received message
   */
  async markRead(messageId) {
    await senderMarkRead(messageId).catch(() => {});
  },

  /**
   * Resolve a Meta media ID to a public URL and MIME type.
   * Use this before passing media to an AI vision model or storing in Cloudinary.
   *
   * @param {string} mediaId — media ID from Meta webhook (e.g. image.id)
   * @returns {Promise<{ url: string, mimeType: string }>}
   */
  async downloadMedia(mediaId) {
    const info = await graphGet(`/${mediaId}?phone_number_id=${meta.phoneNumberId}`);
    return { url: info.url, mimeType: info.mime_type };
  },

  /**
   * Upload a buffer to Meta's media endpoint and return the media ID.
   * Use the ID in template components or as a document attachment.
   *
   * @param {Buffer} buffer
   * @param {string} mimeType — e.g. "image/jpeg", "application/pdf"
   * @returns {Promise<string>} media ID
   */
  async uploadMedia(buffer, mimeType) {
    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("file", new Blob([buffer], { type: mimeType }));

    const phoneNumberId = meta.phoneNumberId;
    const res = await fetch(
      `https://graph.facebook.com/${meta.apiVersion}/${phoneNumberId}/media`,
      {
        method:  "POST",
        headers: { Authorization: `Bearer ${meta.accessToken}` },
        body:    formData,
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Meta uploadMedia ${res.status}: ${text}`);
    }

    const json = await res.json();
    return json.id;
  },

  /**
   * Parse a single entry from Meta's value.messages[] array.
   * Returns a normalised InboundMessage.
   */
  async parse(rawMessage) {
    const parsed = parseMessage(rawMessage);
    if (!parsed) throw new Error("WhatsApp: could not parse message");
    return {
      externalId:  parsed.id,
      senderId:    parsed.from,
      content:     parsed.text,
      contentType: parsed.contentType,
      attachments: parsed.attachments,
      metadata:    parsed.metadata,
    };
  },

  async healthCheck() {
    // ponytail: full check (GET /phone-number-id) deferred; add when ops needs it
    return true;
  },
};

// Channel constants — match BookingSource enum values in schema.prisma.
export const CHANNEL = Object.freeze({
  WEBSITE:   "WEBSITE",
  WHATSAPP:  "WHATSAPP",
  INSTAGRAM: "INSTAGRAM",
  VOICE:     "VOICE",
  MESSENGER: "MESSENGER",
  AI_CHAT:   "AI_CHAT",
});

/**
 * Interface every channel provider must implement.
 *
 * @typedef {Object} ChannelProvider
 * @property {string} channel — one of CHANNEL constants
 *
 * @property {(to: string, message: string, metadata?: object) => Promise<void>} send
 *   Deliver an outbound text message. `to` is the channel's sender identifier.
 *   Throws on unrecoverable failure; retries are the caller's responsibility.
 *
 * @property {(to: string, messageId: string, metadata?: object) => Promise<void>} typing
 *   Show a typing indicator to the recipient. Best-effort — never throw.
 *
 * @property {(messageId: string, metadata?: object) => Promise<void>} markRead
 *   Mark a received message as read (double-check). Best-effort — never throw.
 *
 * @property {(mediaId: string) => Promise<{ url: string, mimeType: string }>} downloadMedia
 *   Resolve a channel-native media ID to a public URL and MIME type.
 *
 * @property {(buffer: Buffer, mimeType: string) => Promise<string>} uploadMedia
 *   Upload a buffer to the channel's media endpoint and return the media ID.
 *
 * @property {(rawMessage: unknown) => Promise<InboundMessage>} parse
 *   Normalise a raw channel message object into a canonical InboundMessage.
 *
 * @property {() => Promise<boolean>} healthCheck
 *   Return true if the channel API is reachable with the current credentials.
 *
 * NOTE: receive() is intentionally absent — channels deliver messages via
 * push webhooks, so there is nothing to poll. The webhook route handles ingress.
 */

/**
 * @typedef {Object} InboundMessage
 * @property {string}   externalId   — channel message ID (dedup key)
 * @property {string}   senderId     — channel-specific sender identifier
 * @property {string}   content      — plain-text message body (AI processes this)
 * @property {string}   contentType  — TEXT | IMAGE | AUDIO | DOCUMENT
 * @property {string[]} [attachments] — media IDs or URLs
 * @property {object}   [metadata]   — channel-specific extras
 */

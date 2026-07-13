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
 * Import this type in your provider — do not import from here at runtime.
 *
 * @typedef {Object} ChannelProvider
 * @property {string} channel
 *   One of CHANNEL constant values.
 *
 * @property {(conversationId: string, message: string, metadata?: object) => Promise<void>} send
 *   Deliver an outbound message to the customer. Throws on unrecoverable failure.
 *
 * @property {(rawPayload: unknown) => Promise<InboundMessage>} parse
 *   Parse a raw webhook payload into a normalized InboundMessage.
 *
 * @property {() => Promise<boolean>} healthCheck
 *   Return true if the channel provider is reachable.
 */

/**
 * @typedef {Object} InboundMessage
 * @property {string} externalId      — channel message ID (for dedup)
 * @property {string} senderId        — channel-specific sender identifier
 * @property {string} content         — plain-text message body
 * @property {string} contentType     — TEXT | IMAGE | AUDIO | DOCUMENT
 * @property {string[]} [attachments] — media URLs if any
 * @property {object} [metadata]      — raw channel-specific extras
 */

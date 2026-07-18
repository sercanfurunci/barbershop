/**
 * Normalize raw Meta webhook payloads into a consistent internal format.
 *
 * Supported inbound types:
 *   text, interactive (button_reply | list_reply), button,
 *   image, audio, video, document, sticker,
 *   location, contacts, reaction, unsupported
 *
 * Status update events (delivered, read, sent, failed) are handled separately
 * via parseStatus() so the calling code can route them without branching.
 */

export const MsgType = Object.freeze({
  TEXT:        "TEXT",
  INTERACTIVE: "INTERACTIVE",
  BUTTON:      "BUTTON",
  IMAGE:       "IMAGE",
  AUDIO:       "AUDIO",
  VIDEO:       "VIDEO",
  DOCUMENT:    "DOCUMENT",
  STICKER:     "STICKER",
  LOCATION:    "LOCATION",
  CONTACTS:    "CONTACTS",
  REACTION:    "REACTION",
  UNSUPPORTED: "UNSUPPORTED",
});

/**
 * Parse a single message entry from `value.messages[n]`.
 *
 * Returns a normalized message object or null if parsing fails.
 *
 * @typedef {Object} ParsedMessage
 * @property {string}   id          — Meta message ID (dedup key)
 * @property {string}   from        — sender wa_id (E.164 without +)
 * @property {string}   timestamp   — Unix timestamp string from Meta
 * @property {string}   type        — one of MsgType
 * @property {string}   text        — human-readable content (AI processes this)
 * @property {string}   contentType — maps to DB Message.contentType
 * @property {string[]} attachments — media IDs or URLs
 * @property {string}   [replyId]   — machine-readable payload for interactive/button
 * @property {object}   [metadata]  — type-specific extras
 *
 * @param {object} raw — raw message from Meta webhook
 * @returns {ParsedMessage | null}
 */
export function parseMessage(raw) {
  if (!raw?.id || !raw?.from) return null;

  const base = { id: raw.id, from: raw.from, timestamp: raw.timestamp ?? "" };

  switch (raw.type) {
    case "text":
      return {
        ...base,
        type:        MsgType.TEXT,
        text:        raw.text?.body ?? "",
        contentType: "TEXT",
        attachments: [],
      };

    case "interactive": {
      const ir      = raw.interactive ?? {};
      const isBtn   = ir.type === "button_reply";
      const payload = isBtn ? ir.button_reply : ir.list_reply;
      return {
        ...base,
        type:        MsgType.INTERACTIVE,
        text:        payload?.title ?? "",
        replyId:     payload?.id    ?? "",
        contentType: "TEXT",
        attachments: [],
        metadata:    { interactiveType: ir.type, payload },
      };
    }

    case "button":
      return {
        ...base,
        type:        MsgType.BUTTON,
        text:        raw.button?.text    ?? "",
        replyId:     raw.button?.payload ?? "",
        contentType: "TEXT",
        attachments: [],
        metadata:    { payload: raw.button?.payload },
      };

    case "location":
      return {
        ...base,
        type:        MsgType.LOCATION,
        text:        [
          "📍 Konum paylaşıldı",
          raw.location?.name    ? `Ad: ${raw.location.name}`       : null,
          raw.location?.address ? `Adres: ${raw.location.address}` : null,
        ].filter(Boolean).join("\n"),
        contentType: "TEXT",
        attachments: [],
        metadata: {
          latitude:  raw.location?.latitude,
          longitude: raw.location?.longitude,
          name:      raw.location?.name,
          address:   raw.location?.address,
        },
      };

    case "contacts":
      return {
        ...base,
        type:        MsgType.CONTACTS,
        text:        (raw.contacts ?? [])
          .map(c => c.name?.formatted_name ?? "İletişim")
          .join(", "),
        contentType: "TEXT",
        attachments: [],
        metadata:    { contacts: raw.contacts },
      };

    case "image":
    case "video":
    case "audio":
    case "document":
    case "sticker": {
      const media = raw[raw.type] ?? {};
      return {
        ...base,
        type:        raw.type.toUpperCase(),
        text:        media.caption ?? "",
        contentType: raw.type.toUpperCase(),
        attachments: [media.id].filter(Boolean),
        metadata:    { mediaId: media.id, mimeType: media.mime_type, filename: media.filename },
      };
    }

    case "reaction":
      return {
        ...base,
        type:        MsgType.REACTION,
        text:        raw.reaction?.emoji ?? "",
        contentType: "TEXT",
        attachments: [],
        metadata:    { emoji: raw.reaction?.emoji, messageId: raw.reaction?.message_id },
      };

    default:
      return {
        ...base,
        type:        MsgType.UNSUPPORTED,
        text:        "",
        contentType: "TEXT",
        attachments: [],
        metadata:    { rawType: raw.type },
      };
  }
}

/**
 * Parse a Meta status update object from `value.statuses[n]`.
 * Returns null if the input isn't a valid status event.
 *
 * @typedef {Object} ParsedStatus
 * @property {string}   messageId    — original message ID
 * @property {string}   recipientId  — wa_id of the recipient
 * @property {string}   status       — sent | delivered | read | failed
 * @property {string}   timestamp
 * @property {object[]} [errors]
 *
 * @param {object} raw
 * @returns {ParsedStatus | null}
 */
export function parseStatus(raw) {
  if (!raw?.id || !raw?.status) return null;
  return {
    messageId:   raw.id,
    recipientId: raw.recipient_id,
    status:      raw.status,
    timestamp:   raw.timestamp,
    errors:      raw.errors,
  };
}

/**
 * Returns true when a parsed message has text the AI can act on.
 * Filters out media-only messages (no caption), reactions, and unsupported types.
 */
export function hasActionableText(parsed) {
  if (!parsed) return false;
  if (parsed.type === MsgType.UNSUPPORTED) return false;
  if (parsed.type === MsgType.REACTION)    return false;
  return parsed.text.trim().length > 0;
}

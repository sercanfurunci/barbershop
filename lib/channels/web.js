/**
 * Web Channel Provider.
 * Implements the same ChannelProvider interface as WhatsApp.
 * Transport: Server-Sent Events (streaming) or HTTP polling for mock mode.
 *
 * Outbound "sending" for website chat = pushing via SSE or returning in HTTP response.
 * For the web channel there is no external API to call — the reply is returned
 * directly to the client that sent the request. So send() is a no-op here;
 * the actual delivery happens in the chat API route via streaming.
 */

import { CHANNEL } from "@/lib/channels/types";

export class WebChannelProvider {
  get channel() { return CHANNEL.WEBSITE; }

  // Web chat has no outbound API — replies are streamed in the same request.
  async send()          { /* no-op: delivered via streaming response */ }
  async typing()        { /* no-op */ }
  async markRead()      { /* no-op */ }
  async downloadMedia() { return null; }
  async uploadMedia()   { return null; }

  /**
   * No raw webhook parsing needed for web — messages arrive as structured JSON.
   * This is a pass-through that returns the already-parsed message object.
   */
  parse(rawMessage) {
    return {
      id:          rawMessage.id   ?? `web_${Date.now()}`,
      from:        rawMessage.from ?? rawMessage.visitorId,
      type:        "text",
      text:        rawMessage.text ?? rawMessage.message,
      contentType: "TEXT",
      metadata:    {},
      attachments: [],
    };
  }

  async healthCheck() {
    return { ok: true, channel: CHANNEL.WEBSITE };
  }
}

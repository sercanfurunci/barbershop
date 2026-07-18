/**
 * WhatsApp sender abstraction.
 * MetaSender → real Meta Cloud API (requires META_* env vars)
 * MockSender → console output for local development
 * createSender() → picks automatically based on meta.isConfigured
 */

import { meta } from "@/lib/config";
import {
  sendText       as _sendText,
  sendWithRetry  as _sendWithRetry,
  typingIndicator as _typingIndicator,
  markRead       as _markRead,
} from "@/lib/whatsapp/sender";

if (!meta.isConfigured) {
  console.warn(
    "WhatsApp running in development mode.\n" +
    "Meta credentials not configured.\n" +
    "Outgoing messages are mocked.",
  );
}

console.info(`[wa] sender selected: ${meta.isConfigured ? "meta" : "mock"}`);

export class MetaSender {
  async sendText(to, text, pid)        { return _sendText(to, text, pid); }
  async sendWithRetry(to, text, pid)   { return _sendWithRetry(to, text, pid); }
  async typingIndicator(msgId, pid)    { return _typingIndicator(msgId, pid); }
  async markRead(msgId, pid)           { return _markRead(msgId, pid); }
}

export class MockSender {
  async sendText(to, text) {
    console.log(`\n[MOCK WHATSAPP]\nTO: +${to}\nMESSAGE:\n${text}\n`);
  }
  async sendWithRetry(to, text, pid) { return this.sendText(to, text, pid); }
  async typingIndicator()            {} // noop — no real connection
  async markRead()                   {} // noop
}

// ponytail: stateless senders, no singleton needed
export function createSender() {
  return meta.isConfigured ? new MetaSender() : new MockSender();
}

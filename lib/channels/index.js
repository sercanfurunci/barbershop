import { CHANNEL } from "@/lib/channels/types";
import { createStub } from "@/lib/channels/_stub";

// Channel provider registry.
//
// To wire a real provider:
//   1. Create lib/channels/<name>.js exporting a ChannelProvider object
//   2. Import it here and replace the createStub(...) entry
//
// Example:
//   import whatsapp from "@/lib/channels/whatsapp";
//   [CHANNEL.WHATSAPP]: whatsapp,
const registry = {
  [CHANNEL.WHATSAPP]:   createStub(CHANNEL.WHATSAPP),
  [CHANNEL.INSTAGRAM]:  createStub(CHANNEL.INSTAGRAM),
  [CHANNEL.VOICE]:      createStub(CHANNEL.VOICE),
  [CHANNEL.MESSENGER]:  createStub(CHANNEL.MESSENGER),
  [CHANNEL.AI_CHAT]:    createStub(CHANNEL.AI_CHAT),
};

/**
 * @param {string} channel — one of CHANNEL constants
 * @returns {import("./types").ChannelProvider}
 */
export function getChannelProvider(channel) {
  const provider = registry[channel];
  if (!provider) throw new Error(`No provider registered for channel: ${channel}`);
  return provider;
}

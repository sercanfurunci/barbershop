import { CHANNEL } from "@/lib/channels/types";
import { createStub } from "@/lib/channels/_stub";
import whatsapp from "@/lib/channels/whatsapp";
import { WebChannelProvider } from "@/lib/channels/web";

const registry = {
  [CHANNEL.WHATSAPP]:   whatsapp,
  [CHANNEL.WEBSITE]:    new WebChannelProvider(),
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

/**
 * Stub ChannelProvider — satisfies the interface, not wired to any external service.
 *
 * To implement a real channel:
 *   1. Create lib/channels/<channel-lowercase>.js
 *   2. Export an object matching ChannelProvider (see lib/channels/types.js)
 *   3. Import it in lib/channels/index.js and replace the stub entry
 */
export function createStub(channel) {
  return {
    channel,

    // ponytail: stubs throw, not silently no-op, so misconfigured channels are
    // immediately visible in logs rather than silently dropping messages.
    async send(_conversationId, _message) {
      throw new Error(`[${channel}] Provider not implemented. Create lib/channels/${channel.toLowerCase()}.js.`);
    },

    async parse(_rawPayload) {
      throw new Error(`[${channel}] Provider not implemented.`);
    },

    async healthCheck() {
      return false;
    },
  };
}

/**
 * OpenAI provider stub.
 * Returns a graceful message — does not throw so the playground doesn't crash.
 */

const NOT_CONFIGURED = "OpenAI sağlayıcısı henüz yapılandırılmamış. Lütfen Anthropic kullanın (AI_PROVIDER=anthropic).";

export default {
  name: "openai",

  async agentic(_opts) {
    return { text: NOT_CONFIGURED, usage: { inputTokens: 0, outputTokens: 0 }, toolCallCount: 0, rounds: 0 };
  },

  async complete(_opts) {
    return { text: NOT_CONFIGURED, usage: { inputTokens: 0, outputTokens: 0 } };
  },
};

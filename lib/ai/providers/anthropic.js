/**
 * Anthropic Claude provider.
 * Owns the entire agentic (tool-calling) loop — no Anthropic specifics leak upward.
 *
 * Tools are passed in OpenAI-format (lib/ai/tools.js). This provider converts
 * them to Anthropic's `input_schema` format internally.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ai as aiConfig } from "@/lib/config";

const MAX_ROUNDS = 5;
const FALLBACK   = "Üzgünüm, isteğinizi şu anda işleyemedim. Lütfen tekrar deneyin.";

let _client;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: aiConfig.anthropicKey, maxRetries: 3, timeout: 30_000 });
  return _client;
}

function toAnthropicTool(t) {
  return { name: t.name, description: t.description, input_schema: t.parameters };
}

export default {
  name: "anthropic",

  /**
   * Run an agentic loop: send messages to Claude, execute any tool calls, repeat.
   *
   * @param {object}   opts
   * @param {string|object[]} opts.systemPrompt — plain string, or Anthropic system content
   *   blocks ([{ type: "text", text, cache_control: { type: "ephemeral" } }, ...])
   * @param {object[]} opts.messages     — [{ role, content: string }] canonical format
   * @param {object[]} opts.tools        — OpenAI-format tool schemas from lib/ai/tools.js
   * @param {object}   opts.config       — { model?, maxTokens?, temperature? }
   * @param {Function} opts.onToolCall   — async (toolName, input) => result
   * @param {Function} [opts.onRound]    — async (round, { inputTokens, outputTokens, latencyMs, stopReason }) => void
   * @param {number}   [opts.maxRounds]  — override MAX_ROUNDS
   *
   * @returns {Promise<{ text, usage: { inputTokens, outputTokens }, toolCallCount, rounds }>}
   */
  async agentic({ systemPrompt, messages, tools, config, onToolCall, onRound, maxRounds }) {
    const model        = config?.model       ?? aiConfig.model;
    const maxTokens    = config?.maxTokens   ?? 1024;
    const temperature  = config?.temperature ?? undefined;
    const anthropicTools = (tools ?? []).map(toAnthropicTool);
    const limit        = maxRounds ?? MAX_ROUNDS;

    // Internal message list: starts canonical, extended with Anthropic-native tool pairs
    let currentMessages = messages.map(m => ({ role: m.role, content: m.content }));
    let finalText       = null;
    let totalInput      = 0;
    let totalOutput     = 0;
    let totalCacheRead  = 0;
    let totalCacheWrite = 0;
    let toolCallCount   = 0;
    let rounds          = 0;

    for (let round = 0; round < limit; round++) {
      rounds = round + 1;
      const t0 = Date.now();

      const response = await client().messages.create({
        model,
        max_tokens:  maxTokens,
        temperature,
        system:      systemPrompt,
        tools:       anthropicTools.length ? anthropicTools : undefined,
        messages:    currentMessages,
      });

      const roundInput  = response.usage?.input_tokens  ?? 0;
      const roundOutput = response.usage?.output_tokens ?? 0;
      totalInput      += roundInput;
      totalOutput     += roundOutput;
      totalCacheRead  += response.usage?.cache_read_input_tokens     ?? 0;
      totalCacheWrite += response.usage?.cache_creation_input_tokens ?? 0;

      await onRound?.(round, {
        inputTokens:  roundInput,
        outputTokens: roundOutput,
        cacheReadTokens:  response.usage?.cache_read_input_tokens     ?? 0,
        cacheWriteTokens: response.usage?.cache_creation_input_tokens ?? 0,
        latencyMs:    Date.now() - t0,
        stopReason:   response.stop_reason,
      });

      if (response.stop_reason === "end_turn") {
        finalText = response.content?.find(b => b.type === "text")?.text ?? null;
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolBlocks   = response.content.filter(b => b.type === "tool_use");
        const toolResults  = [];

        for (const block of toolBlocks) {
          toolCallCount++;
          let result;
          try {
            result = await onToolCall(block.name, block.input);
          } catch (err) {
            result = { error: err.message };
          }
          toolResults.push({
            type:        "tool_result",
            tool_use_id: block.id,
            content:     JSON.stringify(result),
          });
        }

        currentMessages = [
          ...currentMessages,
          { role: "assistant", content: response.content },
          { role: "user",      content: toolResults },
        ];
        continue;
      }

      // max_tokens or unexpected stop — grab any text and exit
      finalText = response.content?.find(b => b.type === "text")?.text ?? null;
      break;
    }

    return {
      text:         finalText ?? FALLBACK,
      usage:        { inputTokens: totalInput, outputTokens: totalOutput,
                      cacheReadTokens: totalCacheRead, cacheWriteTokens: totalCacheWrite },
      toolCallCount,
      rounds,
    };
  },

  /**
   * Single completion without tools — used for summarisation and simple tasks.
   *
   * @param {object}   opts
   * @param {string}   opts.systemPrompt
   * @param {object[]} opts.messages  — [{ role, content }]
   * @param {object}   opts.config    — { model?, maxTokens? }
   * @returns {Promise<{ text, usage: { inputTokens, outputTokens } }>}
   */
  async complete({ systemPrompt, messages, config }) {
    const model     = config?.model     ?? aiConfig.model;
    const maxTokens = config?.maxTokens ?? 512;

    const response = await client().messages.create({
      model,
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages:   messages.map(m => ({ role: m.role, content: m.content })),
    });

    return {
      text:  response.content?.find(b => b.type === "text")?.text ?? null,
      usage: {
        inputTokens:  response.usage?.input_tokens  ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
      },
    };
  },
};

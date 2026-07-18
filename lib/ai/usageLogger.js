/**
 * AI usage logging and cost estimation.
 *
 * Every AI completion is logged to AiUsageLog for billing dashboards,
 * per-shop cost monitoring, and anomaly detection.
 *
 * logUsage() is fire-and-forget — callers should not await it.
 * calculateCost() is synchronous and safe to call anywhere.
 */

import { prisma } from "@/lib/prisma";

// ── Pricing table (USD per 1M tokens) ────────────────────────────────────────
// Update when providers change pricing. Approximate — not for invoicing.
const PRICING = {
  anthropic: {
    "claude-haiku-4-5-20251001": { input: 0.80,  output: 4.00  },
    "claude-sonnet-4-6":         { input: 3.00,  output: 15.00 },
    "claude-opus-4-7":           { input: 15.00, output: 75.00 },
    _default:                    { input: 0.80,  output: 4.00  },
  },
  openai: {
    "gpt-4o-mini": { input: 0.15, output: 0.60 },
    "gpt-4o":      { input: 2.50, output: 10.00 },
    _default:      { input: 0.15, output: 0.60 },
  },
  gemini: {
    "gemini-1.5-flash": { input: 0.075, output: 0.30 },
    _default:           { input: 0.075, output: 0.30 },
  },
};

/**
 * Estimate cost in USD for a single AI completion.
 *
 * @param {string} provider
 * @param {string} model
 * @param {{ inputTokens: number, outputTokens: number }} usage
 * @returns {number | null} — null when pricing not available
 */
export function calculateCost(provider, model, usage) {
  const { inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0 } = usage;
  const table = PRICING[provider];
  if (!table) return null;
  const p = table[model] ?? table._default;
  if (!p) return null;
  // Anthropic prompt caching: reads 10% of input price, writes 125%
  return (inputTokens      / 1_000_000 * p.input)
       + (cacheReadTokens  / 1_000_000 * p.input * 0.1)
       + (cacheWriteTokens / 1_000_000 * p.input * 1.25)
       + (outputTokens     / 1_000_000 * p.output);
}

/** USD saved by cache reads vs paying full input price. */
export function cacheSavings(provider, model, cacheReadTokens = 0) {
  const p = PRICING[provider]?.[model] ?? PRICING[provider]?._default;
  if (!p) return 0;
  return cacheReadTokens / 1_000_000 * p.input * 0.9;
}

/**
 * Persist a usage record. Fire-and-forget — wrap in .catch() at the call site.
 *
 * @param {object} opts
 * @param {string} [opts.shopId]
 * @param {string} [opts.conversationId]
 * @param {string} [opts.channel]
 * @param {string}  opts.provider
 * @param {string}  opts.model
 * @param {{ inputTokens, outputTokens }} opts.usage
 * @param {number}  opts.latencyMs
 * @param {number}  [opts.toolCallCount]
 * @param {number}  [opts.rounds]
 * @param {boolean} [opts.success]
 * @param {string}  [opts.error]
 */
export async function logUsage({
  shopId, conversationId, channel,
  provider, model, usage,
  latencyMs, toolCallCount = 0, rounds = 1,
  success = true, error,
  intent, qualityScore, debug,
}) {
  const estimatedCostUsd = calculateCost(provider, model, usage);
  await prisma.aiUsageLog.create({
    data: {
      shopId:          shopId          ?? null,
      conversationId:  conversationId  ?? null,
      channel:         channel         ?? null,
      provider,
      model,
      inputTokens:     usage.inputTokens  ?? 0,
      outputTokens:    usage.outputTokens ?? 0,
      totalTokens:     (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      cacheReadTokens:  usage.cacheReadTokens  ?? 0,
      cacheWriteTokens: usage.cacheWriteTokens ?? 0,
      estimatedCostUsd,
      latencyMs,
      toolCallCount,
      rounds,
      success,
      error: error ?? null,
      intent:       intent       ?? null,
      qualityScore: qualityScore ?? null,
      debug:        debug        ?? undefined,
    },
  });
}

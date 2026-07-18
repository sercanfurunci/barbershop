/**
 * AI provider registry.
 *
 * Active provider is selected via:
 *   1. explicit `providerName` argument (per-shop override from ShopAISettings)
 *   2. AI_PROVIDER env var
 *   3. default: "anthropic"
 *
 * To add a new provider:
 *   1. Create lib/ai/providers/<name>.js implementing agentic() + complete()
 *   2. Import it here and add to the registry
 */

import anthropic from "@/lib/ai/providers/anthropic";
import openai    from "@/lib/ai/providers/openai";
import gemini    from "@/lib/ai/providers/gemini";
import mock      from "@/lib/ai/providers/mock";
import { ai as aiConfig } from "@/lib/config";

const registry = {
  anthropic,
  openai,
  gemini,
  mock,
};

/**
 * Return the provider instance for a given name.
 * Falls back to the globally configured provider, then to Anthropic.
 * Auto-falls-back to mock when ANTHROPIC_API_KEY is absent and provider is anthropic.
 *
 * @param {string} [providerName] — "anthropic" | "openai" | "gemini" | "mock"
 */
export function getProvider(providerName) {
  const name = providerName ?? aiConfig.provider ?? "anthropic";
  // ponytail: auto-mock when no key — zero config needed for local dev
  if (name === "anthropic" && !aiConfig.anthropicKey) return mock;
  const provider = registry[name];
  if (!provider) throw new Error(`Unknown AI provider: "${name}". Available: ${Object.keys(registry).join(", ")}`);
  return provider;
}

export { registry };

/**
 * Transport-agnostic AI service.
 *
 * chat(shop, sender, text, log, opts) is the single entry point for all channels.
 * WhatsApp, Telegram, Instagram DM — same call, different opts.channel.
 *
 * Orchestrates:
 *   - per-shop AI settings (provider, model, temperature, personality v2)
 *   - knowledge base injection (KnowledgeService)
 *   - AI rule injection (AiRuleService)
 *   - customer context (history, favorite barber/service)
 *   - customer memory (persistent AI-curated preferences)
 *   - long-term memory (summary + recent messages for large conversations)
 *   - short-term state (Redis/memory via intentParser)
 *   - AI provider (Anthropic, OpenAI, Gemini)
 *   - tool dispatch (BookingService, catalog, etc.)
 *   - usage logging (AiUsageLog for billing dashboards)
 *
 * opts.trace = true → returns { text, trace } instead of just text (AI Playground only)
 */

import { AI_TOOLS, AI_TOOLS_MAP } from "@/lib/ai/tools";
import { dispatch } from "@/lib/ai/handlers";
import { buildSystemPromptParts } from "@/lib/ai/prompt";
import { getState, setState, addMessage, freshState } from "@/lib/ai/intentParser";
import { detectIntent, filterDynamicContext, filterKnowledgeSections, toolsForIntent, SKIP_CUSTOMER_CONTEXT } from "@/lib/ai/intentDetector";
import { buildPlan, refineTools } from "@/lib/ai/planner";
import { reviewReply, REGEN_NOTE } from "@/lib/ai/selfReview";
import { computeQualityScore } from "@/lib/ai/qualityScore";
import { getProvider } from "@/lib/ai/providers/index";
import { buildCustomerContext } from "@/lib/ai/customerContext";
import { buildDynamicContext } from "@/lib/ai/dynamicContext";
import { loadConversationContext, refreshSummary } from "@/lib/ai/memoryService";
import { logUsage } from "@/lib/ai/usageLogger";
import { getShopAISettings, resolveModel } from "@/lib/services/ShopAISettingsService";
import { getKnowledgeSections } from "@/lib/services/KnowledgeService";
import { getRulesForPrompt } from "@/lib/services/AiRuleService";
import { getMemory, formatMemoryForPrompt } from "@/lib/services/CustomerMemoryService";
import { prisma } from "@/lib/prisma";

const FALLBACK_TR = "Üzgünüm, isteğinizi şu anda işleyemedim. Lütfen tekrar deneyin.";

/**
 * Process a customer message and return an AI reply.
 *
 * @param {object}  shop    — shop record (id, name, address, phone, ...)
 * @param {string}  sender  — channel sender ID (WhatsApp: wa_id, Telegram: user_id, ...)
 * @param {string}  text    — customer message
 * @param {object}  log     — structured logger
 * @param {object}  [opts]
 * @param {string}  [opts.conversationId]  — DB conversation ID (for message history + usage log)
 * @param {string}  [opts.channel]         — "WHATSAPP" | "INSTAGRAM" | "AI_CHAT" | ...
 * @param {boolean} [opts.trace]           — when true, returns { text, trace } (playground only)
 * @returns {Promise<string | { text, trace }>}
 */
export async function chat(shop, sender, text, log, opts = {}) {
  const { conversationId, channel } = opts;
  const t0 = Date.now();

  // ── 1. Per-shop AI config ─────────────────────────────────────────────────
  const settings = await getShopAISettings(shop.id);
  const provider = getProvider(settings.provider);
  const model    = resolveModel(settings);
  const config   = { model, maxTokens: settings.maxTokens, temperature: settings.temperature };

  // ── 2. Short-term state (fast, Redis/memory) ──────────────────────────────
  let state = (await getState(shop.id, sender)) ?? freshState(shop.id);
  state = addMessage(state, "user", text);

  const intent = detectIntent(text);

  // ── 3. Knowledge base + rules + dynamic context (parallel, cached) ────────
  const [dynamicContext, rules, customer, memory] = await Promise.all([
    buildDynamicContext(shop.id).catch(() => null),
    getRulesForPrompt(shop.id).catch(() => ""),
    SKIP_CUSTOMER_CONTEXT.has(intent) ? null : buildCustomerContext(shop.id, sender).catch(() => null),
    getMemory(shop.id, sender).catch(() => null),
  ]);
  // KB sections depend on dynamicContext to avoid duplication; pass query for relevance scoring
  const knowledgeSections = await getKnowledgeSections(shop.id, dynamicContext, text).catch(() => null);

  // ── 4. System prompt ──────────────────────────────────────────────────────
  const { stable, dynamic } = buildSystemPromptParts({
    shop, settings, customer,
    memory:           formatMemoryForPrompt(memory),
    knowledgeSections: filterKnowledgeSections(knowledgeSections, intent),
    rules,
    dynamicContext:   filterDynamicContext(dynamicContext, intent),
    now: new Date(),
  });

  // ── 5. Message history (long-term memory for large conversations) ─────────
  const memCtx = await loadConversationContext(conversationId);

  const historyMessages = memCtx.messages.length > 0
    ? memCtx.messages
    : state.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));

  const plan = buildPlan(text, intent, customer, dynamicContext);
  const dynamicFull = [
    dynamic,
    memCtx.summary ? `KONUŞMA ÖZETİ (önceki mesajlar):\n${memCtx.summary}` : null,
    plan,
  ].filter(Boolean).join("\n\n");

  const effectiveSystem = provider.name === "anthropic"
    ? [
        { type: "text", text: stable, cache_control: { type: "ephemeral" } },
        ...(dynamicFull ? [{ type: "text", text: dynamicFull }] : []),
      ]
    : [stable, dynamicFull].filter(Boolean).join("\n\n");

  const messages = [...historyMessages, { role: "user", content: text }];

  // ── 6. Agentic AI call ────────────────────────────────────────────────────
  let result;
  let success  = true;
  let errorMsg = null;
  const toolCallTrace = opts.trace ? [] : null;
  const toolLog = [];
  const activeTools = refineTools(toolsForIntent(AI_TOOLS, intent), intent, customer);

  const runAgentic = (system) => provider.agentic({
    systemPrompt: system,
    messages,
    tools:  activeTools,
    config,
    onToolCall: async (name, input) => {
      const toolDef = AI_TOOLS_MAP[name];
      if (!toolDef?.handler) throw new Error(`Unknown tool: ${name}`);
      const tt0 = Date.now();
      const output = await dispatch(toolDef.handler, input, { customer });
      toolLog.push({ name, ms: Date.now() - tt0, ok: !output?.error && output?.ok !== false });
      if (toolCallTrace) toolCallTrace.push({ name, input, output });
      return output;
    },
    onRound: (round, meta) => {
      log.info("ai round", {
        round, shopId: shop.id, channel,
        inputTokens: meta.inputTokens, outputTokens: meta.outputTokens,
        cacheReadTokens: meta.cacheReadTokens, cacheWriteTokens: meta.cacheWriteTokens,
        latencyMs: meta.latencyMs, stopReason: meta.stopReason,
      });
    },
  });

  let review = null;
  try {
    result = await runAgentic(effectiveSystem);

    // Self-review: strip leaked IDs; regenerate once on hallucinated booking claim
    review = reviewReply(result.text, toolLog);
    if (review.ok) {
      result.text = review.text;
    } else {
      log.warn("ai self-review failed — regenerating", { shopId: shop.id, reason: review.reason });
      const correctiveSystem = typeof effectiveSystem === "string"
        ? `${effectiveSystem}\n\n${REGEN_NOTE}`
        : [...effectiveSystem, { type: "text", text: REGEN_NOTE }];
      const retry  = await runAgentic(correctiveSystem);
      const retryReview = reviewReply(retry.text, toolLog);
      result = {
        ...retry,
        text:  retryReview.text,
        usage: {
          inputTokens:      result.usage.inputTokens  + retry.usage.inputTokens,
          outputTokens:     result.usage.outputTokens + retry.usage.outputTokens,
          cacheReadTokens:  (result.usage.cacheReadTokens  ?? 0) + (retry.usage.cacheReadTokens  ?? 0),
          cacheWriteTokens: (result.usage.cacheWriteTokens ?? 0) + (retry.usage.cacheWriteTokens ?? 0),
        },
        toolCallCount: result.toolCallCount + retry.toolCallCount,
      };
    }
  } catch (err) {
    log.error("ai provider error", { shopId: shop.id, provider: settings.provider }, err);
    success  = false;
    errorMsg = err.message;
    result   = { text: FALLBACK_TR, usage: { inputTokens: 0, outputTokens: 0 }, toolCallCount: 0, rounds: 0 };
  }

  const latencyMs = Date.now() - t0;

  log.info("ai chat complete", {
    shopId:       shop.id,
    channel,
    provider:     settings.provider,
    model,
    latencyMs,
    inputTokens:  result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    toolCallCount: result.toolCallCount,
    rounds:       result.rounds,
    success,
  });

  // ── 7. Fire-and-forget side effects ──────────────────────────────────────

  logUsage({
    shopId: shop.id, conversationId, channel,
    provider: settings.provider, model,
    usage:    result.usage,
    latencyMs,
    toolCallCount: result.toolCallCount,
    rounds:   result.rounds,
    success,
    error:    errorMsg,
    intent,
    qualityScore: computeQualityScore({ success, review, toolLog, rounds: result.rounds, planUsed: !!plan }),
    debug: {
      message: text.slice(0, 500),
      plan,
      toolLog,
      review: review ? { ok: review.ok, reason: review.reason ?? null } : null,
      reply:  result.text?.slice(0, 1000) ?? null,
      promptSizes: {
        stable:  stable?.length  ?? 0,
        dynamic: dynamicFull?.length ?? 0,
        memory:  formatMemoryForPrompt(memory)?.length ?? 0,
        kb: (knowledgeSections ? Object.values(knowledgeSections).filter(v => typeof v === "string").join("").length : 0),
      },
    },
  }).catch(e => log.warn("usage log failed", { error: e.message }));

  // Knowledge usage tracking: we can't attribute usage per-entry, so bump all
  // enabled entries when the AI produced a successful reply that had KB context.
  if (success && knowledgeSections?.count > 0) {
    prisma.knowledgeEntry.updateMany({
      where: { shopId: shop.id, enabled: true },
      data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
    }).catch(e => log.warn("kb usage bump failed", { error: e.message }));
  }

  // Simple safety validation (log-only, no regeneration).
  // ponytail: simple safety check, full validation when needed
  if (success) {
    const check = _validateResponse(result.text, shop);
    if (!check.valid) {
      log.warn("ai response validation warning", { shopId: shop.id, reason: check.reason });
    }
  }

  if (conversationId && memCtx.needsSummaryRegen) {
    refreshSummary(conversationId, provider)
      .catch(e => log.warn("summary refresh failed", { conversationId, error: e.message }));
  }

  // ── 8. Persist short-term state ───────────────────────────────────────────
  state = addMessage(state, "assistant", result.text);
  await setState(shop.id, sender, state);

  // ── 9. Return ─────────────────────────────────────────────────────────────
  if (opts.trace) {
    return {
      text: result.text,
      trace: {
        systemPrompt:    typeof effectiveSystem === "string"
          ? effectiveSystem
          : effectiveSystem.map(b => b.text).join("\n\n"),
        usage:           result.usage,
        latencyMs,
        toolCalls:       toolCallTrace ?? [],
        toolCallCount:   result.toolCallCount,
        rounds:          result.rounds,
        model,
        provider:        settings.provider,
        kbEntriesUsed:   knowledgeSections?.count ?? 0,
        memoryUsed:      Boolean(memory?.summary || memory?.preferences?.length),
        personalityUsed: settings.personality ?? "professional",
        temperature:     settings.temperature,
      },
    };
  }

  return result.text;
}

/**
 * Minimal safety validation on the AI response.
 * ponytail: simple safety check, full validation when needed.
 * Currently just logs warnings, does not regenerate.
 */
function _validateResponse(text, _shop) {
  if (!text || typeof text !== "string") return { valid: true };
  const lower = text.toLowerCase();
  // Loose signal: mentions a booking confirmation phrase.
  // Real check needs the tool call history; this is a placeholder for
  // future full validation (regenerate on fake confirmations).
  if (/randevunuz onaylandı|randevun onaylandı|kaydınız (oluşturuldu|alındı)/.test(lower)) {
    return { valid: true, reason: null };
  }
  return { valid: true };
}


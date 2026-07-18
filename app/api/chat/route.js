export const dynamic = "force-dynamic";

/**
 * Website Chat API — streaming Server-Sent Events.
 *
 * POST /api/chat
 * Body: { shopSlug, visitorId, message, conversationId? }
 *
 * Returns a text/event-stream. Each event:
 *   data: {"type":"delta","text":"..."}\n\n   — token chunk
 *   data: {"type":"done","conversationId":"..."}\n\n  — final
 *   data: {"type":"tool","name":"...","status":"running|done"}\n\n  — tool call status
 *   data: {"type":"error","message":"..."}\n\n
 *
 * GET /api/chat?shopSlug=&visitorId= — check or create conversation (non-streaming)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAiRateLimits } from "@/lib/ai/rateLimiter";
import { upsertConversation, logMessage } from "@/lib/services/ConversationService";
import { resolveIdentity } from "@/lib/services/CustomerService";
import { getShopAISettings, resolveModel } from "@/lib/services/ShopAISettingsService";
import { getKnowledgeSections } from "@/lib/services/KnowledgeService";
import { getRulesForPrompt } from "@/lib/services/AiRuleService";
import { getMemory, formatMemoryForPrompt } from "@/lib/services/CustomerMemoryService";
import { buildCustomerContext } from "@/lib/ai/customerContext";
import { buildDynamicContext } from "@/lib/ai/dynamicContext";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { loadConversationContext, refreshSummary } from "@/lib/ai/memoryService";
import { logUsage } from "@/lib/ai/usageLogger";
import { AI_TOOLS, AI_TOOLS_MAP } from "@/lib/ai/tools";
import { dispatch } from "@/lib/ai/handlers";
import { getProvider } from "@/lib/ai/providers/index";
import { getState, setState, addMessage, freshState } from "@/lib/ai/intentParser";
import { detectIntent, filterDynamicContext, SKIP_CUSTOMER_CONTEXT } from "@/lib/ai/intentDetector";
import { rateLimit, getIp } from "@/lib/rateLimit";

const _shopSelect = {
  id: true, name: true, address: true, phone: true,
  planTier: true, whatsappAiEnabled: true, aiChatEnabled: true, subscriptionStatus: true,
};

// SSE helper: encode a JSON event
function sseEvent(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// GET — resolve visitor's open conversation (for reconnect after page refresh)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopSlug  = searchParams.get("shopSlug");
  const visitorId = searchParams.get("visitorId");

  if (!shopSlug || !visitorId) {
    return NextResponse.json({ error: "shopSlug and visitorId required" }, { status: 400 });
  }

  const shop = await prisma.shop.findFirst({
    where:  { slug: shopSlug, deletedAt: null },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const conv = await prisma.conversation.findFirst({
    where:   { shopId: shop.id, channel: "WEBSITE", externalId: visitorId, status: "OPEN" },
    orderBy: { updatedAt: "desc" },
    select:  { id: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ conversation: conv ?? null });
}

// POST — send a message and get a streaming AI reply
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { shopSlug, visitorId, message, conversationId } = body;

  if (!shopSlug || !visitorId || !message?.trim()) {
    return NextResponse.json({ error: "shopSlug, visitorId, message required" }, { status: 400 });
  }

  // Rate limit: 10 messages / minute per visitor
  const ip  = getIp(request);
  const rlv = await rateLimit(`webchat:${visitorId}`, { limit: 10, windowMs: 60_000 });
  const rli = await rateLimit(`webchat:ip:${ip}`,     { limit: 30, windowMs: 60_000 });
  if (!rlv.ok || !rli.ok) {
    return NextResponse.json({ error: "Çok fazla mesaj. Lütfen bekleyin." }, { status: 429 });
  }

  const shop = await prisma.shop.findFirst({
    where:  { slug: shopSlug, deletedAt: null },
    select: _shopSelect,
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const t0 = Date.now();

  // Stream via SSE
  const encoder = new TextEncoder();
  const stream  = new TransformStream();
  const writer  = stream.writable.getWriter();

  function write(data) {
    writer.write(encoder.encode(sseEvent(data))).catch(() => {});
  }

  // Run pipeline async — response is returned immediately as SSE stream
  (async () => {
    try {
      // Find or create conversation
      const conv = await upsertConversation({
        channel:    "WEBSITE",
        shopId:     shop.id,
        externalId: visitorId,
        ...(conversationId ? {} : {}),
      });

      // Human handoff: if agent took over, just log and tell the user
      if (conv.mode === "HUMAN") {
        await logMessage(conv.id, { direction: "INBOUND", senderType: "USER", contentType: "TEXT", content: message.trim() });
        write({ type: "delta", text: "Temsilcimiz en kısa sürede size yardımcı olacak." });
        write({ type: "done", conversationId: conv.id });
        return;
      }

      // Log inbound
      await logMessage(conv.id, { direction: "INBOUND", senderType: "USER", contentType: "TEXT", content: message.trim() });

      // Resolve customer identity
      if (!conv.clientId) {
        const customer = await resolveIdentity({ shopId: shop.id, channel: "WEBSITE", externalId: visitorId });
        if (customer?.id) {
          await prisma.conversation.update({ where: { id: conv.id }, data: { clientId: customer.id } });
        }
      }

      // ── AI pipeline ──────────────────────────────────────────────────────
      const settings = await getShopAISettings(shop.id);
      const provider  = getProvider(settings.provider);
      const model     = resolveModel(settings);
      const config    = { model, maxTokens: settings.maxTokens, temperature: settings.temperature };

      let state = (await getState(shop.id, visitorId)) ?? freshState(shop.id);
      state = addMessage(state, "user", message.trim());

      const intent = detectIntent(message.trim());

      const [knowledgeSections, rules, customer, memory, dynamicContext] = await Promise.all([
        getKnowledgeSections(shop.id, null, message.trim()).catch(() => null),
        getRulesForPrompt(shop.id).catch(() => ""),
        SKIP_CUSTOMER_CONTEXT.has(intent) ? null : buildCustomerContext(shop.id, visitorId).catch(() => null),
        getMemory(shop.id, visitorId).catch(() => null),
        buildDynamicContext(shop.id).catch(() => null),
      ]);

      const systemPrompt = buildSystemPrompt({
        shop, settings, customer,
        memory:           formatMemoryForPrompt(memory),
        knowledgeSections,
        rules,
        dynamicContext:   filterDynamicContext(dynamicContext, intent),
        now: new Date(),
      });

      const memCtx = await loadConversationContext(conv.id);
      const historyMessages = memCtx.messages.length > 0
        ? memCtx.messages
        : state.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));

      const effectiveSystem = memCtx.summary
        ? `${systemPrompt}\n\nKONUŞMA ÖZETİ (önceki mesajlar):\n${memCtx.summary}`
        : systemPrompt;

      const messages = [...historyMessages, { role: "user", content: message.trim() }];

      let fullReply    = "";
      let success      = true;
      let errorMsg     = null;
      let toolCallCount = 0;
      let inputTokens   = 0;
      let outputTokens  = 0;

      try {
        // Use streaming if the provider supports it; otherwise buffer and stream manually
        if (typeof provider.agenticStream === "function") {
          // Provider-native streaming
          await provider.agenticStream({
            systemPrompt: effectiveSystem,
            messages,
            tools:   AI_TOOLS,
            config,
            onDelta: (text) => {
              fullReply += text;
              write({ type: "delta", text });
            },
            onToolCall: async (name, input) => {
              write({ type: "tool", name, status: "running" });
              toolCallCount++;
              const toolDef = AI_TOOLS_MAP[name];
              if (!toolDef?.handler) throw new Error(`Unknown tool: ${name}`);
              const output = await dispatch(toolDef.handler, input);
              write({ type: "tool", name, status: "done" });
              return output;
            },
            onUsage: (u) => { inputTokens = u.inputTokens; outputTokens = u.outputTokens; },
          });
        } else {
          // Non-streaming provider: buffer full reply, then stream it character by character
          const result = await provider.agentic({
            systemPrompt: effectiveSystem,
            messages,
            tools:   AI_TOOLS,
            config,
            onToolCall: async (name, input) => {
              write({ type: "tool", name, status: "running" });
              toolCallCount++;
              const toolDef = AI_TOOLS_MAP[name];
              if (!toolDef?.handler) throw new Error(`Unknown tool: ${name}`);
              const output = await dispatch(toolDef.handler, input);
              write({ type: "tool", name, status: "done" });
              return output;
            },
            onRound: () => {},
          });
          fullReply    = result.text;
          inputTokens  = result.usage?.inputTokens  ?? 0;
          outputTokens = result.usage?.outputTokens ?? 0;
          // Simulate streaming for consistent client experience
          const chunkSize = 4;
          for (let i = 0; i < fullReply.length; i += chunkSize) {
            write({ type: "delta", text: fullReply.slice(i, i + chunkSize) });
            await new Promise(r => setTimeout(r, 12));
          }
        }
      } catch (err) {
        success  = false;
        errorMsg = err.message;
        fullReply = "Üzgünüm, isteğinizi şu anda işleyemedim. Lütfen tekrar deneyin.";
        write({ type: "delta", text: fullReply });
      }

      const latencyMs = Date.now() - t0;

      // Log outbound reply
      await logMessage(conv.id, { direction: "OUTBOUND", senderType: "BOT", contentType: "TEXT", content: fullReply });

      // Side effects (fire-and-forget)
      logUsage({
        shopId: shop.id, conversationId: conv.id, channel: "WEBSITE",
        provider: settings.provider, model,
        usage:    { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
        latencyMs, toolCallCount, rounds: 1, success, error: errorMsg,
      }).catch(() => {});

      if (memCtx.needsSummaryRegen) {
        refreshSummary(conv.id, provider).catch(() => {});
      }

      // Persist short-term state
      state = addMessage(state, "assistant", fullReply);
      await setState(shop.id, visitorId, state);

      write({ type: "done", conversationId: conv.id, latencyMs });
    } catch (err) {
      write({ type: "error", message: err.message });
    } finally {
      writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

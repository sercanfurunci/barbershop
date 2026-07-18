import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { chat } from "@/lib/ai/aiService";
import { countEnabledEntries } from "@/lib/services/KnowledgeService";
import { calculateCost } from "@/lib/ai/usageLogger";
import { setShopAISettings, getShopAISettings } from "@/lib/services/ShopAISettingsService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

const _shopSelect = {
  id: true, name: true, address: true, phone: true,
  planTier: true, whatsappAiEnabled: true, subscriptionStatus: true,
};

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// POST /api/admin/ai-playground?model=&provider=&temperature=
// Body: { message, conversationId? }
// Query params model/provider/temperature temporarily override shop settings
// for this single request (restored after). Used by the Evaluate/Compare page.
// Returns: { reply, trace: { systemPrompt, usage, latencyMs, toolCalls, model, provider, kbCount, contextSize, estimatedCostUsd, totalTokens } }
export const POST = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  if (!body.message?.trim()) return badRequest("message gerekli");

  const { searchParams } = new URL(request.url);
  const overrideModel       = searchParams.get("model")       ?? body.model       ?? null;
  const overrideProvider    = searchParams.get("provider")    ?? body.provider    ?? null;
  const overrideTemperature = searchParams.get("temperature") ?? body.temperature ?? null;

  const shop = await prisma.shop.findFirst({
    where:  { id: sid, deletedAt: null },
    select: _shopSelect,
  });
  if (!shop) return badRequest("Salon bulunamadı");

  const log    = logger(request);
  const sender = `playground_${payload.userId ?? payload.id ?? "admin"}`;

  // Temporarily override settings if requested (for compare-mode)
  let originalSettings = null;
  const hasOverride = overrideModel || overrideProvider || overrideTemperature != null;
  if (hasOverride) {
    originalSettings = await getShopAISettings(sid);
    const patch = {};
    if (overrideModel)       patch.model       = overrideModel;
    if (overrideProvider)    patch.provider    = overrideProvider;
    if (overrideTemperature != null) patch.temperature = Number(overrideTemperature);
    await setShopAISettings(sid, patch);
  }

  try {
    const [result, kbCount] = await Promise.all([
      chat(shop, sender, body.message.trim(), log, {
        conversationId: body.conversationId ?? null,
        channel:        "AI_CHAT",
        trace:          true,
      }),
      countEnabledEntries(sid),
    ]);

    const { text, trace } = result;
    const estimatedCostUsd = calculateCost(trace.provider, trace.model, trace.usage);
    const contextSize      = Math.ceil((trace.systemPrompt?.length ?? 0) / 4); // rough token estimate

    return ok({
      reply: text,
      trace: {
        ...trace,
        kbCount,
        contextSize,
        estimatedCostUsd,
        totalTokens: (trace.usage?.inputTokens ?? 0) + (trace.usage?.outputTokens ?? 0),
      },
    });
  } catch (e) {
    return err(e.message, 500);
  } finally {
    // Restore original settings if we overrode them
    if (originalSettings) {
      await setShopAISettings(sid, {
        model:       originalSettings.model,
        provider:    originalSettings.provider,
        temperature: originalSettings.temperature,
      }).catch(() => {});
    }
  }
});

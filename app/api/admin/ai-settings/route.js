import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { getShopAISettings, setShopAISettings } from "@/lib/services/ShopAISettingsService";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

const VALID_PERSONALITIES  = ["professional", "friendly", "formal", "luxury", "minimal", "funny", "casual", "youthful", "premium"];
const VALID_BOOKING_STYLES = ["guided", "direct", "brief"];
const VALID_EMOJI          = ["none", "minimal", "moderate", "heavy"];
const VALID_LENGTH         = ["brief", "medium", "detailed"];
const VALID_SALES          = ["passive", "neutral", "proactive"];
const VALID_HUMOR          = ["none", "light", "moderate", "high"];
const VALID_PROVIDERS      = ["anthropic", "openai", "gemini"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  const [settings, shop] = await Promise.all([
    getShopAISettings(sid),
    prisma.shop.findUnique({ where: { id: sid }, select: { aiChatEnabled: true } }),
  ]);
  return ok({ ...settings, aiChatEnabled: shop?.aiChatEnabled ?? false });
});

export const PATCH = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  const patch = {};

  if (body.enabled             !== undefined) patch.enabled             = Boolean(body.enabled);
  if (body.provider            !== undefined) {
    if (!VALID_PROVIDERS.includes(body.provider)) return badRequest("Geçersiz sağlayıcı");
    patch.provider = body.provider;
  }
  if (body.model               !== undefined) patch.model               = body.model || null;
  if (body.temperature         !== undefined) {
    const t = Number(body.temperature);
    if (isNaN(t) || t < 0 || t > 2) return badRequest("Sıcaklık 0-2 arası olmalı");
    patch.temperature = t;
  }
  if (body.maxTokens           !== undefined) {
    const m = Number(body.maxTokens);
    if (!Number.isInteger(m) || m < 64 || m > 8192) return badRequest("maxTokens 64-8192 arası olmalı");
    patch.maxTokens = m;
  }
  if (body.language            !== undefined) patch.language            = body.language;
  if (body.personality         !== undefined) {
    if (!VALID_PERSONALITIES.includes(body.personality)) return badRequest("Geçersiz kişilik");
    patch.personality = body.personality;
  }
  if (body.bookingStyle        !== undefined) {
    if (!VALID_BOOKING_STYLES.includes(body.bookingStyle)) return badRequest("Geçersiz randevu stili");
    patch.bookingStyle = body.bookingStyle;
  }
  if (body.emojiUsage          !== undefined) {
    if (!VALID_EMOJI.includes(body.emojiUsage)) return badRequest("Geçersiz emoji kullanımı");
    patch.emojiUsage = body.emojiUsage;
  }
  if (body.messageLength       !== undefined) {
    if (!VALID_LENGTH.includes(body.messageLength)) return badRequest("Geçersiz mesaj uzunluğu");
    patch.messageLength = body.messageLength;
  }
  if (body.salesBehavior       !== undefined) {
    if (!VALID_SALES.includes(body.salesBehavior)) return badRequest("Geçersiz satış davranışı");
    patch.salesBehavior = body.salesBehavior;
  }
  if (body.upsellEnabled       !== undefined) patch.upsellEnabled       = Boolean(body.upsellEnabled);
  if (body.humorLevel          !== undefined) {
    if (!VALID_HUMOR.includes(body.humorLevel)) return badRequest("Geçersiz mizah seviyesi");
    patch.humorLevel = body.humorLevel;
  }
  if (body.greeting            !== undefined) patch.greeting            = body.greeting || null;
  if (body.closing             !== undefined) patch.closing             = body.closing  || null;
  if (body.systemPromptOverride !== undefined) patch.systemPromptOverride = body.systemPromptOverride || null;

  try {
    const ops = [setShopAISettings(sid, patch)];
    if (body.aiChatEnabled !== undefined) {
      ops.push(prisma.shop.update({ where: { id: sid }, data: { aiChatEnabled: Boolean(body.aiChatEnabled) } }));
    }
    const [settings, shop] = await Promise.all(ops);

    // ponytail: snapshot only when prompt-affecting fields change; fire-and-forget
    const PROMPT_KEYS = ["personality","bookingStyle","emojiUsage","messageLength","salesBehavior","humorLevel","greeting","closing","language","systemPromptOverride"];
    if (PROMPT_KEYS.some(k => k in patch)) {
      autoSnapshot(sid, patch, payload).catch(() => {});
    }

    return ok({ ...settings, aiChatEnabled: shop?.aiChatEnabled ?? body.aiChatEnabled ?? false });
  } catch (e) {
    return err(e.message, 500);
  }
});

async function autoSnapshot(sid, patch, payload) {
  const { buildSystemPromptForShop } = await import("@/lib/ai/prompt");
  const snapshot = await buildSystemPromptForShop(sid).catch(() => null);
  if (!snapshot) return;
  const last = await prisma.promptVersion.findFirst({
    where: { shopId: sid },
    orderBy: { version: "desc" },
    select: { version: true, snapshot: true },
  });
  if (last && last.snapshot === snapshot) return; // no actual change
  await prisma.promptVersion.create({
    data: {
      shopId: sid,
      version: (last?.version ?? 0) + 1,
      snapshot,
      changeNote: `Değişen: ${Object.keys(patch).join(", ")}`,
      source: "SETTINGS",
      createdBy: payload.userId ?? payload.id ?? null,
    },
  });
}

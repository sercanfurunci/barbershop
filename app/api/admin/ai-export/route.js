import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { getShopAISettings, setShopAISettings } from "@/lib/services/ShopAISettingsService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/ai-export — export all AI config as JSON
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  try {
    const [shop, settings, rules, knowledge] = await Promise.all([
      prisma.shop.findUnique({ where: { id: sid }, select: { slug: true, name: true } }),
      getShopAISettings(sid),
      prisma.aiRule.findMany({
        where: { shopId: sid },
        select: { rule: true, type: true, priority: true, enabled: true },
        orderBy: { priority: "asc" },
      }),
      prisma.knowledgeEntry.findMany({
        where: { shopId: sid },
        select: { category: true, title: true, content: true, tags: true, enabled: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    // Strip DB-only fields from settings
    const { shopId: _s, id: _id, createdAt: _c, updatedAt: _u, ...settingsClean } = settings;

    return ok({
      exportedAt: new Date().toISOString(),
      shopSlug: shop?.slug ?? null,
      shopName: shop?.name ?? null,
      settings: settingsClean,
      rules,
      knowledge,
    });
  } catch (e) {
    return err(e.message, 500);
  }
});

// POST /api/admin/ai-export?replace=true — import from JSON body
export const POST = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const { searchParams } = new URL(request.url);
  const replace = searchParams.get("replace") === "true";

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return badRequest("Geçersiz JSON");

  try {
    // 1. Settings — always upsert (partial merge)
    if (body.settings && typeof body.settings === "object") {
      const s = body.settings;
      const patch = {};
      const KEYS = [
        "enabled", "provider", "model", "temperature", "maxTokens", "language",
        "personality", "greeting", "closing", "bookingStyle", "systemPromptOverride",
        "emojiUsage", "messageLength", "salesBehavior", "upsellEnabled", "humorLevel",
      ];
      for (const k of KEYS) if (s[k] !== undefined) patch[k] = s[k];
      await setShopAISettings(sid, patch);
    }

    // 2. Rules
    if (Array.isArray(body.rules)) {
      if (replace) {
        await prisma.aiRule.deleteMany({ where: { shopId: sid } });
      }
      for (const r of body.rules) {
        if (!r?.rule) continue;
        await prisma.aiRule.create({
          data: {
            shopId:   sid,
            rule:     String(r.rule).trim(),
            type:     ["positive", "negative"].includes(r.type) ? r.type : "positive",
            priority: Number(r.priority ?? 100),
            enabled:  r.enabled !== false,
          },
        });
      }
    }

    // 3. Knowledge
    if (Array.isArray(body.knowledge)) {
      if (replace) {
        await prisma.knowledgeEntry.deleteMany({ where: { shopId: sid } });
      }
      for (const k of body.knowledge) {
        if (!k?.title || !k?.content || !k?.category) continue;
        await prisma.knowledgeEntry.create({
          data: {
            shopId:    sid,
            category:  k.category,
            title:     String(k.title).trim(),
            content:   String(k.content).trim(),
            tags:      Array.isArray(k.tags) ? k.tags : [],
            enabled:   k.enabled !== false,
            sortOrder: Number(k.sortOrder ?? 0),
          },
        });
      }
    }

    return ok({ imported: true, replace });
  } catch (e) {
    return err(e.message, 500);
  }
});

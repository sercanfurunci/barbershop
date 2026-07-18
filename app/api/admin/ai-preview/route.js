import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { buildSystemPromptForShop } from "@/lib/ai/prompt";
import { buildDynamicContext } from "@/lib/ai/dynamicContext";
import { getKnowledgeSections } from "@/lib/services/KnowledgeService";
import { getRulesForPrompt } from "@/lib/services/AiRuleService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// POST /api/admin/ai-preview
// Body: { preview?: true } — build the effective system prompt without calling AI
// Returns: { systemPrompt, estimatedTokens, sections: { ... } }
export const POST = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  try {
    const shopExists = await prisma.shop.findUnique({ where: { id: sid }, select: { id: true } });
    if (!shopExists) return badRequest("Salon bulunamadı");

    const systemPrompt = await buildSystemPromptForShop(sid);
    if (!systemPrompt) return err("Prompt oluşturulamadı", 500);

    // Section presence flags (best-effort, non-fatal)
    const [dynamicContext, rules] = await Promise.all([
      buildDynamicContext(sid).catch(() => null),
      getRulesForPrompt(sid).catch(() => ""),
    ]);
    const knowledgeSections = await getKnowledgeSections(sid, dynamicContext).catch(() => null);

    return ok({
      systemPrompt,
      estimatedTokens: Math.ceil(systemPrompt.length / 4),
      sections: {
        identity:     true,
        shopInfo:     Boolean(dynamicContext?.sections?.shopInfo),
        services:     Boolean(dynamicContext?.sections?.services),
        barbers:      Boolean(dynamicContext?.sections?.barbers),
        workingHours: Boolean(dynamicContext?.sections?.workingHours),
        holidays:     Boolean(dynamicContext?.sections?.holidays),
        payment:      Boolean(dynamicContext?.sections?.payment),
        knowledge:    knowledgeSections?.count ?? 0,
        rules:        Boolean(rules),
      },
    });
  } catch (e) {
    return err(e.message, 500);
  }
});

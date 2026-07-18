import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest, notFound } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { setShopAISettings } from "@/lib/services/ShopAISettingsService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// POST /api/admin/ai-history/restore — copy snapshot → systemPromptOverride
// Body: { id }
export const POST = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  if (!body.id) return badRequest("id gerekli");

  try {
    const version = await prisma.promptVersion.findFirst({
      where: { id: body.id, shopId: sid },
      select: { snapshot: true, version: true },
    });
    if (!version) return notFound("Sürüm bulunamadı");

    await setShopAISettings(sid, { systemPromptOverride: version.snapshot });
    return ok({ restored: true, version: version.version });
  } catch (e) {
    return err(e.message, 500);
  }
});

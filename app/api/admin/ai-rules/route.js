import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { listRules, createRule, reorderRules } from "@/lib/services/AiRuleService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  return ok(await listRules(sid));
});

export const POST = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  const body = await request.json().catch(() => ({}));
  try {
    return ok(await createRule(sid, body), 201);
  } catch (e) {
    return err(e.message, e.status ?? 400);
  }
});

// PUT /api/admin/ai-rules — batch reorder
export const PUT = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.order)) return badRequest("order dizisi gerekli");
  await reorderRules(sid, body.order);
  return ok({ reordered: true });
});

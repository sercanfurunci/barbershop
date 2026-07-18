import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { updateRule, deleteRule } from "@/lib/services/AiRuleService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

export const PATCH = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  const body = await request.json().catch(() => ({}));
  try {
    return ok(await updateRule(sid, params.id, body));
  } catch (e) {
    return err(e.message, e.status ?? 400);
  }
});

export const DELETE = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  try {
    await deleteRule(sid, params.id);
    return ok({ deleted: true });
  } catch (e) {
    return err(e.message, e.status ?? 400);
  }
});

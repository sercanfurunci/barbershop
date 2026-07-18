import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest, notFound } from "@/lib/apiResponse";
import { getEntry, updateEntry, deleteEntry } from "@/lib/services/KnowledgeService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

export const GET = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  try {
    return ok(await getEntry(sid, params.id));
  } catch (e) {
    return err(e.message, e.status ?? 500);
  }
});

export const PATCH = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  const body = await request.json().catch(() => ({}));
  try {
    return ok(await updateEntry(sid, params.id, body));
  } catch (e) {
    return err(e.message, e.status ?? 400);
  }
});

export const DELETE = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  try {
    await deleteEntry(sid, params.id);
    return ok({ deleted: true });
  } catch (e) {
    return err(e.message, e.status ?? 400);
  }
});

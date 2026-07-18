import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { listEntries, createEntry } from "@/lib/services/KnowledgeService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/knowledge — list entries with optional search and pagination
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const { searchParams } = new URL(request.url);
  const category     = searchParams.get("category") ?? undefined;
  const search       = searchParams.get("search")   ?? undefined;
  const enabledParam = searchParams.get("enabled");
  const enabled      = enabledParam === null ? undefined : enabledParam !== "false";
  const page         = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit        = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

  const result = await listEntries(sid, { category, enabled, search, page, limit });
  return ok(result);
});

// POST /api/admin/knowledge — create a new entry
export const POST = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  try {
    const entry = await createEntry(sid, body);
    return ok(entry, 201);
  } catch (e) {
    return err(e.message, e.status ?? 400);
  }
});

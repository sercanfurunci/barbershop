import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest, notFound } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { takeover, release } from "@/lib/services/HandoffService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// POST /api/admin/conversations/[id]/handoff
// Body: { action: "takeover" | "release" }
export const POST = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  const { action } = body;
  if (!["takeover", "release"].includes(action)) return badRequest("action: takeover | release");

  const conv = await prisma.conversation.findFirst({
    where:  { id: params.id, shopId: sid },
    select: { id: true },
  });
  if (!conv) return notFound("Konuşma bulunamadı");

  try {
    const updated = action === "takeover"
      ? await takeover(params.id, payload.userId ?? payload.id)
      : await release(params.id);
    return ok(updated);
  } catch (e) {
    return err(e.message, 500);
  }
});

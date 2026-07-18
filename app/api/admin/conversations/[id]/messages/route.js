import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest, notFound } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { sendAgentMessage } from "@/lib/services/HandoffService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// POST /api/admin/conversations/[id]/messages — send agent message
export const POST = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  if (!body.content?.trim()) return badRequest("content gerekli");

  const conv = await prisma.conversation.findFirst({
    where:  { id: params.id, shopId: sid },
    select: { id: true, mode: true },
  });
  if (!conv) return notFound("Konuşma bulunamadı");
  if (conv.mode !== "HUMAN") return badRequest("Konuşma bot modunda — önce devral");

  try {
    const message = await sendAgentMessage(params.id, payload.userId ?? payload.id, body.content.trim());
    return ok(message, 201);
  } catch (e) {
    return err(e.message, e.status ?? 500);
  }
});

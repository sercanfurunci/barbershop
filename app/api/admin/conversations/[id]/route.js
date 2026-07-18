import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest, notFound } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/conversations/[id]
export const GET = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, shopId: sid },
    select: {
      id: true, channel: true, status: true, mode: true,
      assignedUserId: true, handoffAt: true, externalId: true,
      createdAt: true, updatedAt: true,
      client: { select: { id: true, name: true, phone: true, notes: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true, direction: true, senderType: true, contentType: true,
          content: true, metadata: true, status: true, createdAt: true,
        },
      },
    },
  });

  if (!conversation) return notFound("Konuşma bulunamadı");
  return ok(conversation);
});

// PATCH /api/admin/conversations/[id] — status updates (resolve, abandon)
export const PATCH = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  const VALID_STATUSES = ["OPEN", "RESOLVED", "ABANDONED"];
  if (body.status && !VALID_STATUSES.includes(body.status)) return badRequest("Geçersiz durum");

  const existing = await prisma.conversation.findFirst({ where: { id: params.id, shopId: sid }, select: { id: true } });
  if (!existing) return notFound("Konuşma bulunamadı");

  const updated = await prisma.conversation.update({
    where: { id: params.id },
    data:  { ...(body.status ? { status: body.status } : {}) },
    select: { id: true, status: true, mode: true, updatedAt: true },
  });

  return ok(updated);
});

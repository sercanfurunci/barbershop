import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest, notFound } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

const MESSAGE_PAGE = 100;

// GET /api/admin/conversations/[id]?before=<ISO date>
// Returns the newest MESSAGE_PAGE messages (ascending); pass `before` to load older ones.
export const GET = withRole(ROLES, async (request, { params }, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const before = new URL(request.url).searchParams.get("before");
  const beforeDate = before ? new Date(before) : null;
  if (beforeDate && isNaN(beforeDate)) return badRequest("Geçersiz before parametresi");

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, shopId: sid },
    select: {
      id: true, channel: true, status: true, mode: true,
      assignedUserId: true, handoffAt: true, externalId: true,
      createdAt: true, updatedAt: true,
      client: { select: { id: true, name: true, phone: true, notes: true } },
      _count: { select: { messages: true } },
      messages: {
        where: beforeDate ? { createdAt: { lt: beforeDate } } : undefined,
        orderBy: { createdAt: "desc" },
        take: MESSAGE_PAGE + 1,
        select: {
          id: true, direction: true, senderType: true, contentType: true,
          content: true, metadata: true, status: true, createdAt: true,
        },
      },
    },
  });

  if (!conversation) return notFound("Konuşma bulunamadı");

  const hasMoreMessages = conversation.messages.length > MESSAGE_PAGE;
  const messages = conversation.messages.slice(0, MESSAGE_PAGE).reverse();
  const { _count, ...rest } = conversation;
  return ok({ ...rest, messages, hasMoreMessages, messageCount: _count.messages });
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

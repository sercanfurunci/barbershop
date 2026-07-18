import { withRole } from "@/lib/middleware/withRole";
import { ok, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/conversations?channel=&status=&mode=&page=1&limit=20
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel") ?? undefined;
  const status  = searchParams.get("status")  ?? undefined;
  const mode    = searchParams.get("mode")    ?? undefined;
  const search  = searchParams.get("search")  ?? undefined;
  const page    = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit   = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip    = (page - 1) * limit;

  const where = {
    shopId: sid,
    ...(channel ? { channel } : {}),
    ...(status  ? { status  } : {}),
    ...(mode    ? { mode    } : {}),
    ...(search  ? {
      OR: [
        { externalId: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ],
    } : {}),
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true, channel: true, status: true, mode: true,
        assignedUserId: true, handoffAt: true, externalId: true,
        createdAt: true, updatedAt: true,
        client: { select: { id: true, name: true, phone: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, direction: true, senderType: true, createdAt: true },
        },
        feedback: { select: { rating: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  const data = conversations.map(c => ({
    ...c,
    lastMessage:  c.messages[0] ?? null,
    messageCount: c._count.messages,
    messages:     undefined,
    _count:       undefined,
  }));

  return ok({ data, total, page, limit });
});

import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/ai-feedback?rating=helpful|not_helpful&page=1&limit=20
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const { searchParams } = new URL(request.url);
  const rating = searchParams.get("rating");
  const page   = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit  = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip   = (page - 1) * limit;

  const where = {
    shopId: sid,
    ...(rating && ["helpful", "not_helpful"].includes(rating) ? { rating } : {}),
  };

  try {
    const [rows, total] = await Promise.all([
      prisma.conversationFeedback.findMany({
        where,
        include: {
          conversation: {
            select: {
              id: true, channel: true, createdAt: true, status: true,
              _count: { select: { messages: true } },
              client: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.conversationFeedback.count({ where }),
    ]);

    const data = rows.map(r => ({
      id: r.id,
      conversationId: r.conversationId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      conversation: r.conversation ? {
        id: r.conversation.id,
        channel: r.conversation.channel,
        createdAt: r.conversation.createdAt,
        status: r.conversation.status,
        messageCount: r.conversation._count.messages,
        clientName: r.conversation.client?.name ?? null,
      } : null,
    }));

    return ok({ data, total, page, limit });
  } catch (e) {
    return err(e.message, 500);
  }
});

// POST /api/admin/ai-feedback
// Body: { conversationId, rating, comment? }
export const POST = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  if (!body.conversationId) return badRequest("conversationId gerekli");
  if (!["helpful", "not_helpful"].includes(body.rating)) return badRequest("rating: helpful | not_helpful");

  try {
    // Verify conversation belongs to shop
    const conv = await prisma.conversation.findFirst({
      where: { id: body.conversationId, shopId: sid },
      select: { id: true },
    });
    if (!conv) return badRequest("Konuşma bulunamadı");

    const row = await prisma.conversationFeedback.upsert({
      where:  { conversationId: body.conversationId },
      create: {
        shopId: sid,
        conversationId: body.conversationId,
        rating: body.rating,
        comment: body.comment ?? null,
      },
      update: {
        rating: body.rating,
        comment: body.comment ?? null,
      },
    });
    return ok(row);
  } catch (e) {
    return err(e.message, 500);
  }
});

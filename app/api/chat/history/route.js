export const dynamic = "force-dynamic";

/**
 * GET /api/chat/history?shopSlug=&visitorId=&conversationId=&limit=30&before=
 * Returns paginated message history for a website conversation.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopSlug       = searchParams.get("shopSlug");
  const visitorId      = searchParams.get("visitorId");
  const conversationId = searchParams.get("conversationId");
  const limit          = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 30)));
  const before         = searchParams.get("before"); // createdAt cursor for pagination

  if (!shopSlug || !visitorId) {
    return NextResponse.json({ error: "shopSlug and visitorId required" }, { status: 400 });
  }

  const shop = await prisma.shop.findFirst({
    where:  { slug: shopSlug, deletedAt: null },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  // Resolve conversation
  const conv = conversationId
    ? await prisma.conversation.findFirst({
        where:  { id: conversationId, shopId: shop.id, externalId: visitorId },
        select: { id: true, status: true, mode: true, createdAt: true },
      })
    : await prisma.conversation.findFirst({
        where:   { shopId: shop.id, channel: "WEBSITE", externalId: visitorId, status: "OPEN" },
        orderBy: { updatedAt: "desc" },
        select:  { id: true, status: true, mode: true, createdAt: true },
      });

  if (!conv) return NextResponse.json({ messages: [], conversationId: null });

  const messages = await prisma.message.findMany({
    where: {
      conversationId: conv.id,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take:    limit,
    select: {
      id: true, direction: true, senderType: true, contentType: true,
      content: true, createdAt: true,
    },
  });

  return NextResponse.json({
    conversationId: conv.id,
    status:         conv.status,
    mode:           conv.mode,
    messages:       messages.reverse(), // chronological
    hasMore:        messages.length === limit,
  });
}

/**
 * DELETE /api/chat/history?shopSlug=&visitorId=
 * Closes the open conversation so the next message starts a fresh session.
 */
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const shopSlug  = searchParams.get("shopSlug");
  const visitorId = searchParams.get("visitorId");

  if (!shopSlug || !visitorId) {
    return NextResponse.json({ error: "shopSlug and visitorId required" }, { status: 400 });
  }

  const shop = await prisma.shop.findFirst({
    where:  { slug: shopSlug, deletedAt: null },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  await prisma.conversation.updateMany({
    where: { shopId: shop.id, channel: "WEBSITE", externalId: visitorId, status: "OPEN" },
    data:  { status: "CLOSED" },
  });

  return NextResponse.json({ ok: true });
}

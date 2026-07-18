export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { meta } from "@/lib/config";
import { platform } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { processIncoming } from "@/lib/whatsapp/webhook";
import { withRole } from "@/lib/middleware/withRole";

const _shopSelect = {
  id: true, name: true, address: true, phone: true,
  planTier: true, whatsappAiEnabled: true, subscriptionStatus: true,
};

// GET /api/debug/whatsapp — configuration health check (SUPER_ADMIN only)
export const GET = withRole(["SUPER_ADMIN"], async () => {
  return NextResponse.json({
    configured:    meta.isConfigured,
    development:   !meta.isConfigured,
    accessToken:   !!meta.accessToken,
    phoneNumberId: !!meta.phoneNumberId,
    appSecret:     !!meta.appSecret,
    verifyToken:   !!meta.verifyToken,
    sender:        meta.isConfigured ? "meta" : "mock",
  });
});

// POST /api/debug/whatsapp — inject a mock inbound message through the real AI pipeline
// SUPER_ADMIN only, and still blocked entirely in production.
export const POST = withRole(["SUPER_ADMIN"], async (request) => {
  if (platform.isProd) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { shopId, phone, message } = body ?? {};
  if (!shopId || !phone || !message) {
    return NextResponse.json({ error: "shopId, phone, and message are required" }, { status: 400 });
  }

  const shop = await prisma.shop.findFirst({
    where:  { id: shopId, deletedAt: null },
    select: _shopSelect,
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const log         = logger(request);
  const senderPhone = phone.replace(/^\+/, ""); // normalize E.164 without +

  await processIncoming({
    shop,
    senderPhone,
    text:             message,
    messageId:        `debug_${Date.now()}`,
    phoneNumberId:    null,
    skipHandoffCheck: true, // debug always runs AI regardless of conversation mode
    log,
  });

  return NextResponse.json({ ok: true, sender: meta.isConfigured ? "meta" : "mock" });
});

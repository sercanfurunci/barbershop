import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST /api/notifications/push-token
// Upserts a push token for the authenticated user.
// Called from the mobile app on launch after permission grant.
// TODO: When push provider is chosen (FCM/APNS), wire delivery here.
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, platform = "ios" } = await request.json();
  if (!token || typeof token !== "string" || token.length > 512) {
    return NextResponse.json({ error: "Geçersiz token" }, { status: 400 });
  }
  const safePlatform = ["ios", "android", "web"].includes(platform) ? platform : "ios";

  await prisma.pushToken.upsert({
    where: { token },
    update: { userId: payload.userId, platform: safePlatform, updatedAt: new Date() },
    create: { userId: payload.userId, token, platform: safePlatform },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/notifications/push-token
// Removes a push token on logout.
export async function DELETE(request) {
  const payload = await requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await request.json().catch(() => ({}));
  if (!token) return NextResponse.json({ ok: true }); // idempotent

  await prisma.pushToken.deleteMany({
    where: { userId: payload.userId, token },
  });

  return NextResponse.json({ ok: true });
}

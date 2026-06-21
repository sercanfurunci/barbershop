import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, clearAuthCache } from "@/lib/auth";

export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true, email: true, username: true, displayName: true, role: true,
      shopId: true,
      barber: { select: { id: true, slug: true, nameTr: true, avatar: true, profilePhoto: true } },
      shop:   { select: { id: true, slug: true, name: true, status: true, subscriptionStatus: true, planTier: true, trialEndsAt: true } },
    },
  });

  if (!user) return unauthorized();
  return NextResponse.json(user);
}

export async function DELETE(request) {
  const payload = await requireAuth(request);
  if (payload?.userId) {
    clearAuthCache(payload.userId);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { tokenVersion: { increment: 1 } },
    }).catch(() => {});
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("makas-token", "", { maxAge: 0, path: "/" });
  return response;
}

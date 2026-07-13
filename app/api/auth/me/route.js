import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, clearAuthCache } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/apiResponse";
import { withAuth } from "@/lib/middleware/withRole";

export const GET = withAuth(async (request, _ctx, payload) => {

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true, email: true, username: true, displayName: true, role: true,
      shopId: true, phone: true, avatarUrl: true,
      notifAppt: true, notifReminder: true, notifPromo: true,
      barber: { select: { id: true, slug: true, nameTr: true, avatar: true, profilePhoto: true } },
      shop:   { select: { id: true, slug: true, name: true, status: true, subscriptionStatus: true, planTier: true, trialEndsAt: true } },
    },
  });

  if (!user) return unauthorized();
  return ok(user);
});

export async function DELETE(request) {
  const payload = await requireAuth(request);
  if (payload?.userId) {
    clearAuthCache(payload.userId);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { tokenVersion: { increment: 1 } },
    }).catch(() => {});
  }
  const response = ok({ ok: true });
  response.cookies.set("makas-token", "", { maxAge: 0, path: "/" });
  return response;
}

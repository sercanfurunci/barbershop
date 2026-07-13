import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAuthCache } from "@/lib/auth";
import { withAuth } from "@/lib/middleware/withRole";

// POST /api/auth/logout-all — invalidate every session for this user across
// all devices by bumping tokenVersion. Requires a valid session so an
// attacker with a stolen cookie can't lock the real user out — they can
// already do worse with the cookie, but requiring auth costs us nothing.
export const POST = withAuth(async (request, _ctx, payload) => {

  clearAuthCache(payload.userId);
  await prisma.user.update({
    where: { id: payload.userId },
    data:  { tokenVersion: { increment: 1 } },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("makas-token", "", { maxAge: 0, path: "/" });
  return response;
});

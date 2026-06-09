import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth";

export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true, email: true, role: true,
      barber: { select: { id: true, slug: true, nameTr: true, avatar: true } },
    },
  });

  if (!user) return unauthorized();
  return NextResponse.json(user);
}

export async function DELETE(request) {
  // logout — clear cookie
  const response = NextResponse.json({ ok: true });
  response.cookies.set("makas-token", "", { maxAge: 0, path: "/" });
  return response;
}

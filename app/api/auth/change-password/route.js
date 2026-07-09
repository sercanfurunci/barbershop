import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, signToken, unauthorized } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

export async function PATCH(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  // Rate-limit on userId so IP rotation doesn't help brute-force current password
  const rl = await rateLimit(`chpw:${payload.userId}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Çok fazla deneme. Lütfen bekleyin." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Mevcut ve yeni şifre gerekli" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalı" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return unauthorized();

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updated = await prisma.user.update({
    where: { id: payload.userId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });

  // Issue fresh token so this session stays valid after version bump
  const token = await signToken({
    userId: payload.userId,
    role: payload.role,
    shopId: payload.shopId ?? null,
    barberId: payload.barberId ?? null,
    tokenVersion: updated.tokenVersion,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("makas-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { signToken, clearAuthCache, secret } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { rateLimit, getIp } from "@/lib/rateLimit";

// POST /api/auth/reset-password — { token, password }
// Verifies the signed reset token, checks tokenVersion (single-use), updates
// password, bumps tokenVersion (invalidates old tokens including this one),
// and returns a fresh session token.
export async function POST(request) {
  const ip = getIp(request);
  const rl = await rateLimit(`reset:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const { token, password } = await request.json().catch(() => ({}));

  if (!token || !password) {
    return NextResponse.json({ error: "Token ve şifre gerekli" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Şifre en az 8 karakter olmalı" }, { status: 400 });
  }

  let claims;
  try {
    const { payload } = await jwtVerify(token, secret);
    claims = payload;
  } catch {
    return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı" }, { status: 400 });
  }

  if (claims.purpose !== "reset" || !claims.userId) {
    return NextResponse.json({ error: "Geçersiz token" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: { id: true, tokenVersion: true, role: true, shopId: true, barberId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 400 });
  }

  // tokenVersion mismatch means password was already changed or logout-all ran
  if (user.tokenVersion !== claims.tokenVersion) {
    return NextResponse.json({ error: "Bu bağlantı artık geçerli değil" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  clearAuthCache(user.id);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data:  { passwordHash, tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });

  const sessionToken = await signToken({
    userId:       user.id,
    role:         user.role,
    shopId:       user.shopId ?? null,
    barberId:     user.barberId ?? null,
    tokenVersion: updated.tokenVersion,
  });

  const response = NextResponse.json({ token: sessionToken });
  response.cookies.set("makas-token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

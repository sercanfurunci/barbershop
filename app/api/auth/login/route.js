import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { err, tooManyRequests, serverError } from "@/lib/apiResponse";

export async function POST(request) {
  const log = logger(request);
  try {
    // 10 attempts per 15 minutes per IP — brute-force protection
    const ip  = getIp(request);
    const rl  = await rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) {
      return tooManyRequests(rl.retryAfter);
    }

    const { email, password, expectedRole } = await request.json();

    if (!email || !password) {
      return err("Email ve şifre gerekli");
    }

    const identifier = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: {
        barber: { select: { id: true, slug: true, nameTr: true, avatar: true, profilePhoto: true } },
        shop:   { select: { id: true, slug: true, name: true, status: true } },
      },
    });

    if (!user) {
      log.warn("login failed — user not found", { identifier });
      return err("Geçersiz kullanıcı adı veya şifre", 401);
    }

    // Block logins to suspended shops before revealing whether the password is
    // correct — prevents confirming valid credentials for suspended accounts.
    if (user.shop && user.shop.status === "SUSPENDED") {
      return err("Geçersiz kullanıcı adı veya şifre", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      log.warn("login failed — wrong password", { userId: user.id });
      return err("Geçersiz kullanıcı adı veya şifre", 401);
    }

    // Role guard: if caller declares expected role, reject mismatches before issuing token.
    if (expectedRole && user.role !== expectedRole) {
      log.warn("login failed — role mismatch", { userId: user.id, role: user.role, expectedRole });
      return err("Geçersiz kullanıcı adı veya şifre", 401);
    }

    const token = await signToken({
      userId: user.id,
      role: user.role,
      shopId: user.shopId ?? null,
      barberId: user.barberId ?? null,
      tokenVersion: user.tokenVersion,
    });

    log.info("login ok", { userId: user.id, role: user.role, shopId: user.shopId });
    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? null,
        displayName: user.displayName ?? null,
        role: user.role,
        barber: user.barber ?? null,
        shop: user.shop ?? null,
      },
    });

    response.cookies.set("makas-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (e) {
    log.error("login error", {}, e);
    return serverError();
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const log = logger(request);
  try {
    // 10 attempts per 15 minutes per IP — brute-force protection
    const ip  = getIp(request);
    const rl  = await rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Çok fazla giriş denemesi. Lütfen bekleyin." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email ve şifre gerekli" }, { status: 400 });
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
      return NextResponse.json({ error: "Geçersiz kullanıcı adı veya şifre" }, { status: 401 });
    }

    // Block logins to suspended shops before revealing whether the password is
    // correct — prevents confirming valid credentials for suspended accounts.
    if (user.shop && user.shop.status === "SUSPENDED") {
      return NextResponse.json({ error: "Geçersiz kullanıcı adı veya şifre" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      log.warn("login failed — wrong password", { userId: user.id });
      return NextResponse.json({ error: "Geçersiz kullanıcı adı veya şifre" }, { status: 401 });
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
  } catch (err) {
    log.error("login error", {}, err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

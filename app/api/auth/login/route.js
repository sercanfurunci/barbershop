import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
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
        barber: { select: { id: true, slug: true, nameTr: true, avatar: true } },
        shop:   { select: { id: true, slug: true, name: true, status: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Geçersiz kullanıcı adı veya şifre" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Geçersiz kullanıcı adı veya şifre" }, { status: 401 });
    }

    // Block logins to suspended shops (except SUPER_ADMIN, who has no shop)
    if (user.shop && user.shop.status === "SUSPENDED") {
      return NextResponse.json({ error: "Bu salon askıya alındı. Yöneticinizle iletişime geçin." }, { status: 403 });
    }

    const token = await signToken({
      userId: user.id,
      role: user.role,
      shopId: user.shopId ?? null,
      barberId: user.barberId ?? null,
      tokenVersion: user.tokenVersion,
    });

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
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

const DEMO_EMAIL    = process.env.DEMO_EMAIL    || "demo-admin@makas.tech";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demo123";

// POST /api/auth/demo — no credentials needed, auto-logins as demo tenant admin.
export async function POST() {
  const user = await prisma.user.findFirst({
    where: { email: DEMO_EMAIL },
    include: {
      shop: { select: { id: true, slug: true, name: true, status: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Demo hesabı bulunamadı. Seed'i çalıştırın: node prisma/seed-demo.js" }, { status: 404 });
  }

  const valid = await bcrypt.compare(DEMO_PASSWORD, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Demo giriş hatası" }, { status: 500 });
  }

  const token = await signToken({
    userId: user.id,
    role: user.role,
    shopId: user.shopId ?? null,
    barberId: user.barberId ?? null,
    tokenVersion: user.tokenVersion,
  });

  const redirectTo = user.shop?.slug ? `/${user.shop.slug}/admin` : "/admin";

  const response = NextResponse.json({ ok: true, redirectTo });
  response.cookies.set("makas-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

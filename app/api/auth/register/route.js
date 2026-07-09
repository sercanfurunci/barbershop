import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

// POST /api/auth/register
// Creates a CUSTOMER account. Guest bookings are linked if phone matches a Client.
export async function POST(request) {
  const ip = getIp(request);
  const rl = await rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Çok fazla kayıt denemesi. Lütfen bekleyin." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { displayName, email, password, phone } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email ve şifre gerekli" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Bu email adresi zaten kullanılıyor" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Link to existing Client records by phone (across all shops) so guest bookings
  // become visible in the authenticated appointment history.
  // ponytail: link only when there's exactly one match to avoid ambiguity.
  let clientId = null;
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length >= 10) {
      const clients = await prisma.client.findMany({
        where: { phone: { contains: cleanPhone } },
        select: { id: true },
        take: 2,
      });
      if (clients.length === 1) clientId = clients[0].id;
    }
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      displayName: displayName?.trim() || null,
      passwordHash,
      phone: phone || null,
      role: "CUSTOMER",
      shopId: null,
      clientId,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      phone: true,
    },
  });

  const token = await signToken({
    userId: user.id,
    role: user.role,
    shopId: null,
    barberId: null,
    tokenVersion: 0,
  });

  const response = NextResponse.json({ token, user }, { status: 201 });
  response.cookies.set("makas-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

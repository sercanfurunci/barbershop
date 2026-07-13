import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { err, created, conflict, tooManyRequests } from "@/lib/apiResponse";

// POST /api/auth/register
// Creates a CUSTOMER account. Guest bookings are linked if phone matches a Client.
export async function POST(request) {
  const ip = getIp(request);
  const rl = await rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return tooManyRequests(rl.retryAfter);
  }

  const { displayName, email, password, phone } = await request.json();

  if (!email || !password) {
    return err("Email ve şifre gerekli");
  }
  if (password.length < 8) {
    return err("Şifre en az 8 karakter olmalı");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return conflict("Bu email adresi zaten kullanılıyor");
  }

  if (phone) {
    const phone10 = phone.replace(/\D/g, "").slice(-10);
    if (phone10.length >= 10) {
      const phoneTaken = await prisma.user.findFirst({ where: { phone: { endsWith: phone10 } } });
      if (phoneTaken) {
        return conflict("Bu telefon numarası zaten başka bir hesaba kayıtlı");
      }
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Link to existing Client records by phone (across all shops) so guest bookings
  // become visible in the authenticated appointment history.
  // ponytail: link only when there's exactly one match to avoid ambiguity.
  let clientId = null;
  if (phone) {
    const phone10 = phone.replace(/\D/g, "").slice(-10);
    if (phone10.length >= 10) {
      const clients = await prisma.client.findMany({
        where: { phone: { endsWith: phone10 } },
        select: { id: true },
        take: 2,
      });
      if (clients.length === 1) clientId = clients[0].id;
    }
  }

  let user;
  try {
    user = await prisma.user.create({
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
        tokenVersion: true,
      },
    });
  } catch (e) {
    if (e.code === "P2002") {
      return conflict("Bu email adresi zaten kullanılıyor");
    }
    throw e;
  }

  const token = await signToken({
    userId: user.id,
    role: user.role,
    shopId: null,
    barberId: null,
    tokenVersion: user.tokenVersion,
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

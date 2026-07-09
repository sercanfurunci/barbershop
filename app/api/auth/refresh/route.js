import { NextResponse } from "next/server";
import { requireAuth, signToken, unauthorized } from "@/lib/auth";

// POST /api/auth/refresh — issue a fresh 7-day token to a still-valid session.
// Mobile clients call this on app open. Web calls it opportunistically.
// If the current token has expired or its tokenVersion is stale, requireAuth
// returns null and we 401 — the client must fall back to /api/auth/login.
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const token = await signToken({
    userId:       payload.userId,
    role:         payload.role,
    shopId:       payload.shopId ?? null,
    barberId:     payload.barberId ?? null,
    tokenVersion: payload.tokenVersion,
  });

  const response = NextResponse.json({ token });
  response.cookies.set("makas-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

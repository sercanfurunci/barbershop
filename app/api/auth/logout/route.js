import { NextResponse } from "next/server";

// POST /api/auth/logout — soft single-device logout. Clears the cookie so the
// web session ends; mobile clients discard their stored Bearer. tokenVersion
// is untouched — other devices stay logged in. Use /api/auth/logout-all to
// invalidate everywhere.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("makas-token", "", { maxAge: 0, path: "/" });
  return response;
}

import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required in production");
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "makas-jwt-secret-change-in-production"
);

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = request.cookies?.get?.("makas-token")?.value;
  return cookie ?? null;
}

export async function requireAuth(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Verify tokenVersion to detect invalidated tokens (logout / password change).
  // Also backfill shopId for tokens issued before multi-tenant rollout: those
  // payloads lack shopId, but we need it to scope every API query by shop.
  if (payload.userId) {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true, shopId: true },
    });
    if (!user) return null;
    if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) return null;
    if (payload.shopId === undefined) payload.shopId = user.shopId;
  }

  return payload;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

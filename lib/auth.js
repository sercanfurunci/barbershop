import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required in production");
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "makas-jwt-secret-change-in-production"
);

// Short-lived in-process cache for the tokenVersion DB lookup.
// Eliminates one DB roundtrip per authenticated API call.
// TTL: 15 seconds. Evicted immediately on version mismatch (logout).
const authCache = new Map(); // userId → { version, shopId, expiresAt }
const AUTH_CACHE_TTL = 15_000;

export function clearAuthCache(userId) {
  if (userId) authCache.delete(userId);
}

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
  if (!payload) {
    console.warn("[requireAuth] token verification failed — expired or wrong secret");
    return null;
  }

  if (payload.userId) {
    const now    = Date.now();
    const cached = authCache.get(payload.userId);

    // Cache hit: tokenVersion matches and entry hasn't expired → skip DB
    if (cached && now < cached.expiresAt && cached.version === payload.tokenVersion) {
      if (payload.shopId === undefined) payload.shopId = cached.shopId;
      return payload;
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { tokenVersion: true, shopId: true },
      });
    } catch (err) {
      console.error("[requireAuth] DB lookup failed:", err.message);
      return null;
    }

    if (!user) {
      console.warn("[requireAuth] user not found in DB:", payload.userId);
      return null;
    }
    if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
      console.warn("[requireAuth] tokenVersion mismatch — session invalidated for user:", payload.userId);
      authCache.delete(payload.userId);
      return null;
    }

    authCache.set(payload.userId, {
      version:   user.tokenVersion,
      shopId:    user.shopId,
      expiresAt: now + AUTH_CACHE_TTL,
    });

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

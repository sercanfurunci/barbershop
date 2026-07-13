import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// ── Imports after mocks ──────────────────────────────────────────────────────

import { requireAuth, signToken, verifyToken, getTokenFromRequest, clearAuthCache } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const p = prisma as any;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(headers: Record<string, string> = {}, cookieValue?: string) {
  const headerMap = new Map(Object.entries(headers));
  return {
    headers: {
      get: (key: string) => headerMap.get(key.toLowerCase()) ?? null,
    },
    cookies: {
      get: (name: string) => (name === "makas-token" && cookieValue ? { value: cookieValue } : undefined),
    },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("verifyToken", () => {
  it("returns null for an empty/invalid token string", async () => {
    const result = await verifyToken("not-a-jwt");
    expect(result).toBeNull();
  });

  it("returns payload for a valid token", async () => {
    const token = await signToken({ userId: "u-1", role: "ADMIN", shopId: "s-1", tokenVersion: 1 });
    const payload = await verifyToken(token);
    expect(payload).toMatchObject({ userId: "u-1", role: "ADMIN", shopId: "s-1" });
  });
});

describe("getTokenFromRequest", () => {
  it("extracts token from Authorization: Bearer header", () => {
    const req = makeRequest({ authorization: "Bearer my-token-123" });
    expect(getTokenFromRequest(req as any)).toBe("my-token-123");
  });

  it("extracts token from makas-token cookie", () => {
    const req = makeRequest({}, "cookie-token-456");
    expect(getTokenFromRequest(req as any)).toBe("cookie-token-456");
  });

  it("returns null when no token is present", () => {
    const req = makeRequest();
    expect(getTokenFromRequest(req as any)).toBeNull();
  });

  it("header takes precedence over cookie", () => {
    const req = makeRequest({ authorization: "Bearer header-token" }, "cookie-token");
    expect(getTokenFromRequest(req as any)).toBe("header-token");
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no token is present", async () => {
    const req = makeRequest();
    const result = await requireAuth(req as any);
    expect(result).toBeNull();
  });

  it("returns null for an invalid/expired token", async () => {
    const req = makeRequest({ authorization: "Bearer invalid.jwt.token" });
    const result = await requireAuth(req as any);
    expect(result).toBeNull();
  });

  it("returns null when tokenVersion in DB does not match token", async () => {
    // Token has tokenVersion: 1, DB has tokenVersion: 2 (logged out)
    const token = await signToken({ userId: "u-1", role: "CUSTOMER", shopId: null, tokenVersion: 1 });
    p.user.findUnique.mockResolvedValue({ tokenVersion: 2, shopId: null });
    clearAuthCache("u-1"); // ensure no cache hit

    const req = makeRequest({ authorization: `Bearer ${token}` });
    const result = await requireAuth(req as any);
    expect(result).toBeNull();
  });

  it("returns null when user does not exist in DB", async () => {
    const token = await signToken({ userId: "u-999", role: "ADMIN", shopId: "s-1", tokenVersion: 1 });
    p.user.findUnique.mockResolvedValue(null);
    clearAuthCache("u-999");

    const req = makeRequest({ authorization: `Bearer ${token}` });
    const result = await requireAuth(req as any);
    expect(result).toBeNull();
  });

  it("returns payload with userId, role, shopId on valid token and matching tokenVersion", async () => {
    const token = await signToken({ userId: "u-1", role: "ADMIN", shopId: "s-1", tokenVersion: 3 });
    p.user.findUnique.mockResolvedValue({ tokenVersion: 3, shopId: "s-1" });
    clearAuthCache("u-1");

    const req = makeRequest({ authorization: `Bearer ${token}` });
    const result = await requireAuth(req as any) as any;

    expect(result).not.toBeNull();
    expect(result.userId).toBe("u-1");
    expect(result.role).toBe("ADMIN");
    expect(result.shopId).toBe("s-1");
  });

  it("uses cached result on second call (avoids second DB lookup)", async () => {
    const token = await signToken({ userId: "u-2", role: "BARBER", shopId: "s-2", tokenVersion: 5 });
    p.user.findUnique.mockResolvedValue({ tokenVersion: 5, shopId: "s-2" });
    clearAuthCache("u-2");

    const req = makeRequest({ authorization: `Bearer ${token}` });

    await requireAuth(req as any); // first call — populates cache
    await requireAuth(req as any); // second call — should hit cache

    // DB should only be called once despite two requireAuth calls
    expect(p.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("returns payload for tokens without tokenVersion field (legacy tokens)", async () => {
    // Some older tokens may not have tokenVersion in payload
    const token = await signToken({ userId: "u-3", role: "CUSTOMER", shopId: "s-3" });
    p.user.findUnique.mockResolvedValue({ tokenVersion: 99, shopId: "s-3" });
    clearAuthCache("u-3");

    const req = makeRequest({ authorization: `Bearer ${token}` });
    const result = await requireAuth(req as any) as any;

    // tokenVersion undefined in payload → mismatch check is skipped
    expect(result).not.toBeNull();
    expect(result.userId).toBe("u-3");
  });
});

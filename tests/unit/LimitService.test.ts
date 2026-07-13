import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
    },
    barber: {
      count: vi.fn(),
    },
    service: {
      count: vi.fn(),
    },
    appointment: {
      count: vi.fn(),
    },
  },
}));

// ── Imports after mocks ──────────────────────────────────────────────────────

import {
  canCreateBarber,
  canCreateService,
  canCreateAppointment,
  canUploadImage,
  canCreateBranch,
  getAllLimits,
} from "@/lib/services/LimitService";
import { prisma } from "@/lib/prisma";

const p = prisma as any;

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockShopPlan(planTier: string) {
  p.shop.findUnique.mockResolvedValue({ planTier, gallery: [] });
}

// ── canCreateBarber ───────────────────────────────────────────────────────────

describe("canCreateBarber", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns allowed:true when under STARTER barber limit (3)", async () => {
    mockShopPlan("STARTER");
    p.barber.count.mockResolvedValue(2); // under limit of 3

    const result = await canCreateBarber("shop-1");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(2);
    expect(result.limit).toBe(3);
  });

  it("returns allowed:false at the STARTER barber limit (3/3)", async () => {
    mockShopPlan("STARTER");
    p.barber.count.mockResolvedValue(3); // at limit

    const result = await canCreateBarber("shop-1");
    expect(result.allowed).toBe(false);
    expect(result.current).toBe(3);
  });

  it("returns allowed:false when over STARTER barber limit", async () => {
    mockShopPlan("STARTER");
    p.barber.count.mockResolvedValue(5);

    const result = await canCreateBarber("shop-1");
    expect(result.allowed).toBe(false);
  });

  it("returns allowed:true with Infinity limit for ENTERPRISE plan", async () => {
    mockShopPlan("ENTERPRISE");
    // count should not be called because Infinity short-circuits
    const result = await canCreateBarber("shop-1");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
    expect(p.barber.count).not.toHaveBeenCalled();
  });

  it("returns allowed:false at PROFESSIONAL barber limit (10/10)", async () => {
    mockShopPlan("PROFESSIONAL");
    p.barber.count.mockResolvedValue(10);

    const result = await canCreateBarber("shop-1");
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(10);
  });
});

// ── canCreateService ──────────────────────────────────────────────────────────

describe("canCreateService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns allowed:true when under STARTER service limit (20)", async () => {
    mockShopPlan("STARTER");
    p.service.count.mockResolvedValue(10);

    const result = await canCreateService("shop-1");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(20);
  });

  it("returns allowed:false at STARTER service limit (20/20)", async () => {
    mockShopPlan("STARTER");
    p.service.count.mockResolvedValue(20);

    const result = await canCreateService("shop-1");
    expect(result.allowed).toBe(false);
  });

  it("returns allowed:true with Infinity limit for AI plan", async () => {
    mockShopPlan("AI");
    const result = await canCreateService("shop-1");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
    expect(p.service.count).not.toHaveBeenCalled();
  });
});

// ── canCreateAppointment ──────────────────────────────────────────────────────

describe("canCreateAppointment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns allowed:true when under monthly appointment limit", async () => {
    mockShopPlan("STARTER");
    p.appointment.count.mockResolvedValue(150);

    const result = await canCreateAppointment("shop-1");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(300);
    expect(result.current).toBe(150);
  });

  it("returns allowed:false at monthly appointment limit (300/300 STARTER)", async () => {
    mockShopPlan("STARTER");
    p.appointment.count.mockResolvedValue(300);

    const result = await canCreateAppointment("shop-1");
    expect(result.allowed).toBe(false);
  });

  it("returns allowed:true with Infinity limit for ENTERPRISE", async () => {
    mockShopPlan("ENTERPRISE");
    const result = await canCreateAppointment("shop-1");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
    expect(p.appointment.count).not.toHaveBeenCalled();
  });

  it("returns allowed:false over PROFESSIONAL monthly limit (2000)", async () => {
    mockShopPlan("PROFESSIONAL");
    p.appointment.count.mockResolvedValue(2001);

    const result = await canCreateAppointment("shop-1");
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(2000);
  });
});

// ── canUploadImage ────────────────────────────────────────────────────────────

describe("canUploadImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns allowed:true when gallery is empty (STARTER: 2 GB × 500 = 1000 slots)", async () => {
    p.shop.findUnique
      .mockResolvedValueOnce({ planTier: "STARTER" })   // getShopPlan call
      .mockResolvedValueOnce({ gallery: [] });           // gallery count call

    const result = await canUploadImage("shop-1");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(0);
    expect(result.limit).toBe(2 * 500);
  });

  it("returns allowed:false when gallery is full", async () => {
    const fullGallery = new Array(1000).fill("url");
    p.shop.findUnique
      .mockResolvedValueOnce({ planTier: "STARTER" })
      .mockResolvedValueOnce({ gallery: fullGallery });

    const result = await canUploadImage("shop-1");
    expect(result.allowed).toBe(false);
  });

  it("returns allowed:true with Infinity limit for ENTERPRISE", async () => {
    p.shop.findUnique.mockResolvedValue({ planTier: "ENTERPRISE", gallery: [] });

    const result = await canUploadImage("shop-1");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
  });
});

// ── canCreateBranch ───────────────────────────────────────────────────────────

describe("canCreateBranch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns allowed:true for STARTER (current implementation always returns true < limit)", async () => {
    mockShopPlan("STARTER");
    const result = await canCreateBranch("shop-1");
    expect(result.allowed).toBe(true);
  });

  it("returns allowed:true with Infinity branches for ENTERPRISE", async () => {
    mockShopPlan("ENTERPRISE");
    const result = await canCreateBranch("shop-1");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
  });
});

// ── getAllLimits ──────────────────────────────────────────────────────────────

describe("getAllLimits", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns aggregated limits with correct planTier", async () => {
    p.shop.findUnique.mockResolvedValue({ planTier: "STARTER", gallery: ["img1", "img2"] });
    p.barber.count.mockResolvedValue(1);
    p.service.count.mockResolvedValue(5);
    p.appointment.count.mockResolvedValue(42);

    const result = await getAllLimits("shop-1");

    expect(result.planTier).toBe("STARTER");
    expect(result.barbers.current).toBe(1);
    expect(result.barbers.limit).toBe(3);
    expect(result.services.current).toBe(5);
    expect(result.services.limit).toBe(20);
    expect(result.appointments.current).toBe(42);
    expect(result.appointments.limit).toBe(300);
    expect(result.storageImages.current).toBe(2);
  });
});

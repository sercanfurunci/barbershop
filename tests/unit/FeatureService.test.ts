import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shopFeatureOverride: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    shop: {
      findUnique: vi.fn(),
    },
  },
}));

// ── Imports after mocks ──────────────────────────────────────────────────────

import { hasFeature, getFeatures } from "@/lib/services/FeatureService";
import { FEATURE } from "@/lib/constants/features";
import { prisma } from "@/lib/prisma";

const p = prisma as any;

describe("hasFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true immediately for superAdmin regardless of plan", async () => {
    const result = await hasFeature("shop-1", FEATURE.AI_CHAT, { isSuperAdmin: true });
    expect(result).toBe(true);
    expect(p.shopFeatureOverride.findUnique).not.toHaveBeenCalled();
  });

  it("returns true when feature is in the shop plan (STARTER includes LOYALTY)", async () => {
    p.shopFeatureOverride.findUnique.mockResolvedValue(null); // no override
    p.shop.findUnique.mockResolvedValue({ planTier: "STARTER" });

    const result = await hasFeature("shop-1", FEATURE.LOYALTY);
    expect(result).toBe(true);
  });

  it("returns false when feature is not in plan (STARTER excludes AI_CHAT)", async () => {
    p.shopFeatureOverride.findUnique.mockResolvedValue(null);
    p.shop.findUnique.mockResolvedValue({ planTier: "STARTER" });

    const result = await hasFeature("shop-1", FEATURE.AI_CHAT);
    expect(result).toBe(false);
  });

  it("returns true when ShopFeatureOverride enables a feature despite plan exclusion", async () => {
    // STARTER normally excludes AI_CHAT; override enables it
    p.shopFeatureOverride.findUnique.mockResolvedValue({ enabled: true });
    p.shop.findUnique.mockResolvedValue({ planTier: "STARTER" });

    const result = await hasFeature("shop-1", FEATURE.AI_CHAT);
    expect(result).toBe(true);
    // Plan lookup should be skipped because override was found
    expect(p.shop.findUnique).not.toHaveBeenCalled();
  });

  it("returns false when ShopFeatureOverride disables a feature despite plan inclusion", async () => {
    // STARTER includes LOYALTY; override disables it
    p.shopFeatureOverride.findUnique.mockResolvedValue({ enabled: false });
    p.shop.findUnique.mockResolvedValue({ planTier: "STARTER" });

    const result = await hasFeature("shop-1", FEATURE.LOYALTY);
    expect(result).toBe(false);
  });

  it("returns false for unknown feature even on AI plan", async () => {
    p.shopFeatureOverride.findUnique.mockResolvedValue(null);
    p.shop.findUnique.mockResolvedValue({ planTier: "AI" });

    const result = await hasFeature("shop-1", "UNKNOWN_FEATURE_XYZ");
    expect(result).toBe(false);
  });

  it("returns false when shopId is empty/null", async () => {
    const result = await hasFeature("", FEATURE.AI_CHAT);
    expect(result).toBe(false);
  });

  it("accepts a shop object to avoid extra DB round-trip for plan lookup", async () => {
    const shopObj = { id: "shop-1", planTier: "STARTER" };
    p.shopFeatureOverride.findUnique.mockResolvedValue(null); // no override

    const result = await hasFeature(shopObj, FEATURE.LOYALTY);
    expect(result).toBe(true);
    // shop.findUnique should NOT be called since planTier was on the object
    expect(p.shop.findUnique).not.toHaveBeenCalled();
  });

  it("respects pre-loaded overrides map (batch path)", async () => {
    const shopObj = { id: "shop-1", planTier: "STARTER" };
    const overrides = new Map([[FEATURE.AI_CHAT, true]]);

    const result = await hasFeature(shopObj, FEATURE.AI_CHAT, { overrides });
    expect(result).toBe(true);
    // Must not hit DB at all
    expect(p.shopFeatureOverride.findUnique).not.toHaveBeenCalled();
    expect(p.shop.findUnique).not.toHaveBeenCalled();
  });

  it("falls back to plan when pre-loaded overrides map does not have the feature", async () => {
    const shopObj = { id: "shop-1", planTier: "STARTER" };
    const overrides = new Map<string, boolean>(); // empty

    // LOYALTY is in STARTER plan
    const result = await hasFeature(shopObj, FEATURE.LOYALTY, { overrides });
    expect(result).toBe(true);
  });
});

describe("getFeatures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all features as true for superAdmin", async () => {
    const features = await getFeatures("shop-1", { isSuperAdmin: true });
    for (const key of Object.values(FEATURE)) {
      expect(features[key]).toBe(true);
    }
  });

  it("returns plan defaults merged with overrides", async () => {
    p.shop.findUnique.mockResolvedValue({ planTier: "STARTER" });
    p.shopFeatureOverride.findMany.mockResolvedValue([
      { feature: FEATURE.AI_CHAT, enabled: true }, // override: enable
    ]);

    const features = await getFeatures("shop-1");

    // Override wins: AI_CHAT enabled despite STARTER plan
    expect(features[FEATURE.AI_CHAT]).toBe(true);
    // Plan default: LOYALTY is in STARTER
    expect(features[FEATURE.LOYALTY]).toBe(true);
    // Plan default: WHATSAPP_AI is not in STARTER and has no override
    expect(features[FEATURE.WHATSAPP_AI]).toBe(false);
  });
});

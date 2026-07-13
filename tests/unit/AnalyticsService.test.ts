import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      aggregate: vi.fn(),
      count:     vi.fn(),
      groupBy:   vi.fn(),
      findMany:  vi.fn(),
    },
    service: {
      findMany: vi.fn(),
    },
    barber: {
      findMany: vi.fn(),
    },
  },
}));

// ── Imports after mocks ──────────────────────────────────────────────────────

import {
  getRevenueSummary,
  getOccupancyRate,
  getPopularServices,
  getTopBarbers,
  getBusyHours,
  getReturningCustomerRate,
} from "@/lib/services/AnalyticsService";
import { prisma } from "@/lib/prisma";

const p = prisma as any;

// ── getRevenueSummary ─────────────────────────────────────────────────────────

describe("getRevenueSummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns revenue totals from aggregate result", async () => {
    p.appointment.aggregate.mockResolvedValue({
      _sum:   { grossAmount: 1500, barberAmount: 900, shopAmount: 600, tipAmount: 50 },
      _count: { id: 10 },
    });

    const result = await getRevenueSummary("shop-1");

    expect(result.totalRevenue).toBe(1500);
    expect(result.barberRevenue).toBe(900);
    expect(result.shopRevenue).toBe(600);
    expect(result.tips).toBe(50);
    expect(result.completedCount).toBe(10);
  });

  it("returns zero values when aggregate sums are null (no appointments)", async () => {
    p.appointment.aggregate.mockResolvedValue({
      _sum:   { grossAmount: null, barberAmount: null, shopAmount: null, tipAmount: null },
      _count: { id: 0 },
    });

    const result = await getRevenueSummary("shop-1");

    expect(result.totalRevenue).toBe(0);
    expect(result.barberRevenue).toBe(0);
    expect(result.shopRevenue).toBe(0);
    expect(result.tips).toBe(0);
    expect(result.completedCount).toBe(0);
  });

  it("passes date range filter when start and end are provided", async () => {
    p.appointment.aggregate.mockResolvedValue({
      _sum: { grossAmount: 0, barberAmount: 0, shopAmount: 0, tipAmount: 0 },
      _count: { id: 0 },
    });

    await getRevenueSummary("shop-1", { start: "2026-07-01", end: "2026-07-31" });

    const callArg = p.appointment.aggregate.mock.calls[0][0];
    expect(callArg.where.date).toMatchObject({ gte: "2026-07-01", lte: "2026-07-31" });
  });

  it("filters to only COMPLETED status", async () => {
    p.appointment.aggregate.mockResolvedValue({
      _sum: { grossAmount: 100, barberAmount: 60, shopAmount: 40, tipAmount: 0 },
      _count: { id: 1 },
    });

    await getRevenueSummary("shop-1");

    const callArg = p.appointment.aggregate.mock.calls[0][0];
    expect(callArg.where.status).toBe("COMPLETED");
    expect(callArg.where.shopId).toBe("shop-1");
  });
});

// ── getOccupancyRate ──────────────────────────────────────────────────────────

describe("getOccupancyRate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calculates correct occupancy, cancellation, and noshow rates", async () => {
    // 8 completed, 1 cancelled, 1 noshow out of 10 total
    p.appointment.count
      .mockResolvedValueOnce(8)  // completed
      .mockResolvedValueOnce(1)  // cancelled
      .mockResolvedValueOnce(1)  // noshow
      .mockResolvedValueOnce(10); // total

    const result = await getOccupancyRate("shop-1");

    expect(result.completed).toBe(8);
    expect(result.cancelled).toBe(1);
    expect(result.noshow).toBe(1);
    expect(result.total).toBe(10);
    expect(result.occupancyRate).toBe(80);
    expect(result.cancellationRate).toBe(10);
    expect(result.noshowRate).toBe(10);
  });

  it("returns 0 rates when there are no appointments", async () => {
    p.appointment.count.mockResolvedValue(0);

    const result = await getOccupancyRate("shop-1");

    expect(result.total).toBe(0);
    expect(result.occupancyRate).toBe(0);
    expect(result.cancellationRate).toBe(0);
    expect(result.noshowRate).toBe(0);
  });

  it("passes date range to all count queries", async () => {
    p.appointment.count.mockResolvedValue(5);

    await getOccupancyRate("shop-1", { start: "2026-07-01", end: "2026-07-31" });

    // All four count calls should include the date filter
    for (const call of p.appointment.count.mock.calls) {
      expect(call[0].where.date).toMatchObject({ gte: "2026-07-01", lte: "2026-07-31" });
    }
  });

  it("rounds rates to whole numbers", async () => {
    // 1 completed out of 3 total = 33.33% → rounds to 33
    p.appointment.count
      .mockResolvedValueOnce(1)  // completed
      .mockResolvedValueOnce(1)  // cancelled
      .mockResolvedValueOnce(1)  // noshow
      .mockResolvedValueOnce(3); // total

    const result = await getOccupancyRate("shop-1");

    expect(result.occupancyRate).toBe(33);
  });
});

// ── getPopularServices ────────────────────────────────────────────────────────

describe("getPopularServices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns services ordered by appointment count", async () => {
    p.appointment.groupBy.mockResolvedValue([
      { serviceId: "svc-1", _count: { id: 15 } },
      { serviceId: "svc-2", _count: { id: 8 } },
    ]);
    p.service.findMany.mockResolvedValue([
      { id: "svc-1", nameTr: "Saç Kesimi", price: 100, icon: null },
      { id: "svc-2", nameTr: "Sakal",      price: 60,  icon: null },
    ]);

    const result = await getPopularServices("shop-1");

    expect(result).toHaveLength(2);
    expect(result[0].nameTr).toBe("Saç Kesimi");
    expect(result[0].count).toBe(15);
    expect(result[1].nameTr).toBe("Sakal");
    expect(result[1].count).toBe(8);
  });

  it("returns empty array when no appointments", async () => {
    p.appointment.groupBy.mockResolvedValue([]);
    p.service.findMany.mockResolvedValue([]);

    const result = await getPopularServices("shop-1");
    expect(result).toHaveLength(0);
  });

  it("respects the limit option", async () => {
    p.appointment.groupBy.mockResolvedValue([]);
    p.service.findMany.mockResolvedValue([]);

    await getPopularServices("shop-1", { limit: 3 });

    const callArg = p.appointment.groupBy.mock.calls[0][0];
    expect(callArg.take).toBe(3);
  });

  it("excludes CANCELLED appointments", async () => {
    p.appointment.groupBy.mockResolvedValue([]);
    p.service.findMany.mockResolvedValue([]);

    await getPopularServices("shop-1");

    const callArg = p.appointment.groupBy.mock.calls[0][0];
    expect(callArg.where.status).toMatchObject({ notIn: ["CANCELLED"] });
  });
});

// ── getTopBarbers ─────────────────────────────────────────────────────────────

describe("getTopBarbers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns barbers with revenue and appointment count", async () => {
    p.appointment.groupBy.mockResolvedValue([
      { barberId: "b-1", _sum: { barberAmount: 2000 }, _count: { id: 20 } },
      { barberId: "b-2", _sum: { barberAmount: 1200 }, _count: { id: 15 } },
    ]);
    p.barber.findMany.mockResolvedValue([
      { id: "b-1", nameTr: "Ali Usta", avatar: null, rating: 4.8 },
      { id: "b-2", nameTr: "Veli Usta", avatar: null, rating: 4.5 },
    ]);

    const result = await getTopBarbers("shop-1");

    expect(result).toHaveLength(2);
    expect(result[0].nameTr).toBe("Ali Usta");
    expect(result[0].revenue).toBe(2000);
    expect(result[0].appointments).toBe(20);
    expect(result[1].revenue).toBe(1200);
  });

  it("treats null barberAmount as 0 revenue", async () => {
    p.appointment.groupBy.mockResolvedValue([
      { barberId: "b-1", _sum: { barberAmount: null }, _count: { id: 5 } },
    ]);
    p.barber.findMany.mockResolvedValue([
      { id: "b-1", nameTr: "Ali Usta", avatar: null, rating: 4.0 },
    ]);

    const result = await getTopBarbers("shop-1");

    expect(result[0].revenue).toBe(0);
  });

  it("returns empty array when no completed appointments", async () => {
    p.appointment.groupBy.mockResolvedValue([]);
    p.barber.findMany.mockResolvedValue([]);

    const result = await getTopBarbers("shop-1");
    expect(result).toHaveLength(0);
  });

  it("filters to COMPLETED status only", async () => {
    p.appointment.groupBy.mockResolvedValue([]);
    p.barber.findMany.mockResolvedValue([]);

    await getTopBarbers("shop-1");

    const callArg = p.appointment.groupBy.mock.calls[0][0];
    expect(callArg.where.status).toBe("COMPLETED");
  });
});

// ── getBusyHours ──────────────────────────────────────────────────────────────

describe("getBusyHours", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns correct hour distribution", async () => {
    p.appointment.findMany.mockResolvedValue([
      { time: "10:00" },
      { time: "10:30" },
      { time: "11:00" },
      { time: "14:00" },
    ]);

    const result = await getBusyHours("shop-1");

    const hour10 = result.find(h => h.hour === 10);
    const hour11 = result.find(h => h.hour === 11);
    const hour14 = result.find(h => h.hour === 14);

    expect(hour10?.count).toBe(2);
    expect(hour11?.count).toBe(1);
    expect(hour14?.count).toBe(1);
  });

  it("returns empty array when there are no appointments", async () => {
    p.appointment.findMany.mockResolvedValue([]);

    const result = await getBusyHours("shop-1");

    // All counts are 0, so they all get filtered out
    expect(result).toHaveLength(0);
  });

  it("excludes CANCELLED appointments", async () => {
    p.appointment.findMany.mockResolvedValue([]);

    await getBusyHours("shop-1");

    const callArg = p.appointment.findMany.mock.calls[0][0];
    expect(callArg.where.status).toMatchObject({ notIn: ["CANCELLED"] });
  });

  it("only returns hours that have at least one appointment", async () => {
    p.appointment.findMany.mockResolvedValue([{ time: "09:00" }]);

    const result = await getBusyHours("shop-1");

    expect(result.every(h => h.count > 0)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].hour).toBe(9);
  });
});

// ── getReturningCustomerRate ──────────────────────────────────────────────────

describe("getReturningCustomerRate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("correctly identifies returning vs new customers", async () => {
    // 3 unique clients: 2 have >1 visit, 1 has exactly 1
    p.appointment.groupBy.mockResolvedValue([
      { clientId: "c-1", _count: { id: 3 } },
      { clientId: "c-2", _count: { id: 2 } },
      { clientId: "c-3", _count: { id: 1 } },
    ]);

    const result = await getReturningCustomerRate("shop-1");

    expect(result.total).toBe(3);
    expect(result.returning).toBe(2);
    expect(result.rate).toBe(67); // 2/3 rounded
  });

  it("returns 0 rate when all customers are new (single visit)", async () => {
    p.appointment.groupBy.mockResolvedValue([
      { clientId: "c-1", _count: { id: 1 } },
      { clientId: "c-2", _count: { id: 1 } },
    ]);

    const result = await getReturningCustomerRate("shop-1");

    expect(result.returning).toBe(0);
    expect(result.rate).toBe(0);
  });

  it("returns zeros when there are no completed appointments", async () => {
    p.appointment.groupBy.mockResolvedValue([]);

    const result = await getReturningCustomerRate("shop-1");

    expect(result.total).toBe(0);
    expect(result.returning).toBe(0);
    expect(result.rate).toBe(0);
  });

  it("returns 100% rate when every customer has returned", async () => {
    p.appointment.groupBy.mockResolvedValue([
      { clientId: "c-1", _count: { id: 5 } },
      { clientId: "c-2", _count: { id: 3 } },
    ]);

    const result = await getReturningCustomerRate("shop-1");

    expect(result.rate).toBe(100);
  });

  it("filters to COMPLETED status when querying", async () => {
    p.appointment.groupBy.mockResolvedValue([]);

    await getReturningCustomerRate("shop-1");

    const callArg = p.appointment.groupBy.mock.calls[0][0];
    expect(callArg.where.status).toBe("COMPLETED");
    expect(callArg.where.shopId).toBe("shop-1");
  });
});

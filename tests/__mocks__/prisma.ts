import { vi } from "vitest";

export const prismaMock = {
  shop: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  appointment: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
  barber: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
  service: { findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
  client: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  user: { findUnique: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
  shopFeatureOverride: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
  barberService: { findUnique: vi.fn(), count: vi.fn() },
  workingHours: { findUnique: vi.fn() },
  barberBreak: { findMany: vi.fn() },
  holiday: { findMany: vi.fn() },
  backgroundJob: { create: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
};

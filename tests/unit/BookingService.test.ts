import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks (hoisted before imports) ───────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shop: { findUnique: vi.fn() },
    service: { findFirst: vi.fn() },
    barber: { findFirst: vi.fn() },
    barberService: { findUnique: vi.fn(), count: vi.fn() },
    client: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { findFirst: vi.fn(), updateMany: vi.fn() },
    appointment: { count: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/events", () => ({
  emit: vi.fn(),
  EVENTS: { APPOINTMENT_CREATED: "appointment.created" },
}));

vi.mock("@/lib/utils", () => ({
  todayStr: vi.fn(() => "2026-07-12"),
  nowMinutes: vi.fn(() => 600), // 10:00 — slots after 10:00 are future
}));

vi.mock("@/lib/subscription", () => ({
  canAcceptPublicBookings: vi.fn(() => true),
}));

vi.mock("@/lib/booking", () => ({
  validateBookingWindow: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock("@/lib/services/CustomerService", () => ({
  findOrCreateClient: vi.fn(() => Promise.resolve({ id: "client-1" })),
}));

// ── Imports after mocks ──────────────────────────────────────────────────────

import { createBooking, BookingError, normalizeSource } from "@/lib/services/BookingService";
import { prisma } from "@/lib/prisma";
import { canAcceptPublicBookings } from "@/lib/subscription";
import { validateBookingWindow } from "@/lib/booking";
import { todayStr, nowMinutes } from "@/lib/utils";

// Typed shorthand for mocked prisma
const p = prisma as any;

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeValidShop(overrides = {}) {
  return {
    id: "shop-1",
    status: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    trialEndsAt: null,
    deletedAt: null,
    autoConfirmBookings: true,
    ...overrides,
  };
}

function makeValidService(overrides = {}) {
  return { id: "svc-1", shopId: "shop-1", duration: 30, price: 100, ...overrides };
}

function makeValidBarber(overrides = {}) {
  return { id: "barber-1", shopId: "shop-1", available: true, ...overrides };
}

const BASE_PARAMS = {
  shopId: "shop-1",
  name: "Ali Veli",
  phone: "5551234567",
  serviceId: "svc-1",
  barberId: "barber-1",
  date: "2026-07-13", // tomorrow — always future
  time: "11:00",
};

function setupHappyPath() {
  p.user.findFirst.mockResolvedValue(null);          // no account for phone
  p.shop.findUnique.mockResolvedValue(makeValidShop());
  p.service.findFirst.mockResolvedValue(makeValidService());
  p.barber.findFirst.mockResolvedValue(makeValidBarber());
  p.barberService.findUnique.mockResolvedValue({ barberId: "barber-1", serviceId: "svc-1" });
  p.barberService.count.mockResolvedValue(1);
  p.client.findUnique.mockResolvedValue(null);       // no existing client
  p.appointment.count.mockResolvedValue(0);
  (canAcceptPublicBookings as any).mockReturnValue(true);
  (validateBookingWindow as any).mockResolvedValue({ ok: true });

  const createdAppointment = {
    id: "appt-1",
    shopId: "shop-1",
    clientId: "client-1",
    barberId: "barber-1",
    serviceId: "svc-1",
    date: "2026-07-13",
    time: "11:00",
    duration: 30,
    price: 100,
    status: "CONFIRMED",
    source: "ONLINE",
    notes: null,
    bookedByUserId: null,
    bookedByName: null,
    shop: { name: "Test Shop", address: "Istanbul", phone: "5550000000" },
  };

  // $transaction runs the callback and resolves with the appointment
  p.$transaction.mockImplementation(async (fn: any) => {
    p.appointment.findMany.mockResolvedValue([]); // no conflicts inside tx
    p.appointment.create.mockResolvedValue(createdAppointment);
    return fn({
      appointment: { findMany: p.appointment.findMany, create: p.appointment.create },
      user: { updateMany: vi.fn().mockResolvedValue({}) },
    });
  });

  return createdAppointment;
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe("normalizeSource", () => {
  it("returns ONLINE for null/undefined", () => {
    expect(normalizeSource(null)).toBe("ONLINE");
    expect(normalizeSource(undefined)).toBe("ONLINE");
  });

  it("maps alias PHONE → MANUAL", () => {
    expect(normalizeSource("PHONE")).toBe("MANUAL");
  });

  it("maps alias WALKIN → WALK_IN", () => {
    expect(normalizeSource("walkin")).toBe("WALK_IN");
  });

  it("returns unknown values as ONLINE", () => {
    expect(normalizeSource("CARRIER_PIGEON")).toBe("ONLINE");
  });

  it("passes through valid WHATSAPP source", () => {
    expect(normalizeSource("WHATSAPP")).toBe("WHATSAPP");
  });
});

describe("createBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (todayStr as any).mockReturnValue("2026-07-12");
    (nowMinutes as any).mockReturnValue(600); // 10:00
  });

  // ── Past date / time guards ────────────────────────────────────────────────

  it("throws PAST_TIME for same-day past slot", async () => {
    (todayStr as any).mockReturnValue("2026-07-13");
    (nowMinutes as any).mockReturnValue(700); // 11:40 — after 11:00

    // Still need user.findFirst to not throw before the date check
    p.user.findFirst.mockResolvedValue(null);

    await expect(
      createBooking({ ...BASE_PARAMS, date: "2026-07-13", time: "11:00" })
    ).rejects.toThrow(BookingError);

    await expect(
      createBooking({ ...BASE_PARAMS, date: "2026-07-13", time: "11:00" })
    ).rejects.toMatchObject({ code: "PAST_TIME" });
  });

  it("does not throw PAST_TIME for same-day future slot", async () => {
    (todayStr as any).mockReturnValue("2026-07-13");
    (nowMinutes as any).mockReturnValue(600); // 10:00 — slot at 11:00 is future
    setupHappyPath();

    const appt = await createBooking({ ...BASE_PARAMS, date: "2026-07-13", time: "11:00" });
    expect(appt.id).toBe("appt-1");
  });

  // ── Phone has account guard ────────────────────────────────────────────────

  it("throws PHONE_HAS_ACCOUNT when unauthenticated and phone belongs to a user account", async () => {
    p.user.findFirst.mockResolvedValue({ id: "user-99" });

    await expect(
      createBooking({ ...BASE_PARAMS })
    ).rejects.toMatchObject({ code: "PHONE_HAS_ACCOUNT" });
  });

  it("skips PHONE_HAS_ACCOUNT guard when bookedByUserId is set", async () => {
    // No user.findFirst call should happen when bookedByUserId provided
    setupHappyPath();

    const appt = await createBooking({ ...BASE_PARAMS, bookedByUserId: "user-1" });
    expect(appt.id).toBe("appt-1");
    expect(p.user.findFirst).not.toHaveBeenCalled();
  });

  // ── Shop guards ────────────────────────────────────────────────────────────

  it("throws SHOP_NOT_FOUND when shop does not exist", async () => {
    p.user.findFirst.mockResolvedValue(null);
    p.shop.findUnique.mockResolvedValue(null);
    p.service.findFirst.mockResolvedValue(makeValidService());
    p.barber.findFirst.mockResolvedValue(makeValidBarber());
    p.barberService.findUnique.mockResolvedValue(null);
    p.barberService.count.mockResolvedValue(0);
    p.client.findUnique.mockResolvedValue(null);

    await expect(createBooking({ ...BASE_PARAMS })).rejects.toMatchObject({
      code: "SHOP_NOT_FOUND",
    });
  });

  it("throws SHOP_SUSPENDED when shop cannot accept public bookings", async () => {
    p.user.findFirst.mockResolvedValue(null);
    p.shop.findUnique.mockResolvedValue(makeValidShop({ subscriptionStatus: "SUSPENDED" }));
    p.service.findFirst.mockResolvedValue(makeValidService());
    p.barber.findFirst.mockResolvedValue(makeValidBarber());
    p.barberService.findUnique.mockResolvedValue(null);
    p.barberService.count.mockResolvedValue(0);
    p.client.findUnique.mockResolvedValue(null);
    (canAcceptPublicBookings as any).mockReturnValue(false);

    await expect(createBooking({ ...BASE_PARAMS })).rejects.toMatchObject({
      code: "SHOP_SUSPENDED",
    });
  });

  // ── Service guard ──────────────────────────────────────────────────────────

  it("throws SERVICE_NOT_FOUND when service does not exist", async () => {
    p.user.findFirst.mockResolvedValue(null);
    p.shop.findUnique.mockResolvedValue(makeValidShop());
    p.service.findFirst.mockResolvedValue(null);
    p.barber.findFirst.mockResolvedValue(makeValidBarber());
    p.barberService.findUnique.mockResolvedValue(null);
    p.barberService.count.mockResolvedValue(0);
    p.client.findUnique.mockResolvedValue(null);
    (canAcceptPublicBookings as any).mockReturnValue(true);

    await expect(createBooking({ ...BASE_PARAMS })).rejects.toMatchObject({
      code: "SERVICE_NOT_FOUND",
    });
  });

  // ── Barber guards ──────────────────────────────────────────────────────────

  it("throws BARBER_NOT_FOUND when barber does not exist", async () => {
    p.user.findFirst.mockResolvedValue(null);
    p.shop.findUnique.mockResolvedValue(makeValidShop());
    p.service.findFirst.mockResolvedValue(makeValidService());
    p.barber.findFirst.mockResolvedValue(null);
    p.barberService.findUnique.mockResolvedValue(null);
    p.barberService.count.mockResolvedValue(0);
    p.client.findUnique.mockResolvedValue(null);
    (canAcceptPublicBookings as any).mockReturnValue(true);

    await expect(createBooking({ ...BASE_PARAMS })).rejects.toMatchObject({
      code: "BARBER_NOT_FOUND",
    });
  });

  it("throws BARBER_UNAVAILABLE when barber.available is false", async () => {
    p.user.findFirst.mockResolvedValue(null);
    p.shop.findUnique.mockResolvedValue(makeValidShop());
    p.service.findFirst.mockResolvedValue(makeValidService());
    p.barber.findFirst.mockResolvedValue(makeValidBarber({ available: false }));
    p.barberService.findUnique.mockResolvedValue(null);
    p.barberService.count.mockResolvedValue(0);
    p.client.findUnique.mockResolvedValue(null);
    (canAcceptPublicBookings as any).mockReturnValue(true);

    await expect(createBooking({ ...BASE_PARAMS })).rejects.toMatchObject({
      code: "BARBER_UNAVAILABLE",
    });
  });

  // ── Slot conflict ──────────────────────────────────────────────────────────

  it("throws SLOT_TAKEN when existing appointment overlaps", async () => {
    p.user.findFirst.mockResolvedValue(null);
    p.shop.findUnique.mockResolvedValue(makeValidShop());
    p.service.findFirst.mockResolvedValue(makeValidService());
    p.barber.findFirst.mockResolvedValue(makeValidBarber());
    p.barberService.findUnique.mockResolvedValue({ barberId: "barber-1", serviceId: "svc-1" });
    p.barberService.count.mockResolvedValue(1);
    p.client.findUnique.mockResolvedValue(null);
    p.appointment.count.mockResolvedValue(0);
    (canAcceptPublicBookings as any).mockReturnValue(true);
    (validateBookingWindow as any).mockResolvedValue({ ok: true });

    // The transaction callback finds a conflict
    p.$transaction.mockImplementation(async (fn: any) => {
      // 11:00 = 660 min, duration 30, so conflict [660, 690)
      const conflictingAppts = [{ time: "11:00", duration: 30 }];
      const txMock = {
        appointment: {
          findMany: vi.fn().mockResolvedValue(conflictingAppts),
          create: vi.fn(),
        },
        user: { updateMany: vi.fn() },
      };
      return fn(txMock);
    });

    await expect(createBooking({ ...BASE_PARAMS })).rejects.toMatchObject({
      code: "SLOT_TAKEN",
    });
  });

  // ── Slot unavailable (booking window) ─────────────────────────────────────

  it("throws SLOT_UNAVAILABLE when validateBookingWindow returns not ok", async () => {
    p.user.findFirst.mockResolvedValue(null);
    p.shop.findUnique.mockResolvedValue(makeValidShop());
    p.service.findFirst.mockResolvedValue(makeValidService());
    p.barber.findFirst.mockResolvedValue(makeValidBarber());
    p.barberService.findUnique.mockResolvedValue({ barberId: "barber-1", serviceId: "svc-1" });
    p.barberService.count.mockResolvedValue(1);
    p.client.findUnique.mockResolvedValue(null);
    p.appointment.count.mockResolvedValue(0);
    (canAcceptPublicBookings as any).mockReturnValue(true);
    (validateBookingWindow as any).mockResolvedValue({ ok: false, error: "Berber bu gün çalışmıyor.", status: 409 });

    await expect(createBooking({ ...BASE_PARAMS })).rejects.toMatchObject({
      code: "SLOT_UNAVAILABLE",
    });
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it("happy path: creates appointment with correct shape", async () => {
    const expected = setupHappyPath();

    const result = await createBooking({ ...BASE_PARAMS, source: "ONLINE" });

    expect(result.id).toBe("appt-1");
    expect(result.shopId).toBe("shop-1");
    expect(result.barberId).toBe("barber-1");
    expect(result.serviceId).toBe("svc-1");
    expect(result.date).toBe("2026-07-13");
    expect(result.time).toBe("11:00");
    expect(result.status).toBe("CONFIRMED");
    expect((result as any).shop).toMatchObject({ name: "Test Shop" });
  });

  it("happy path: status is PENDING when autoConfirmBookings is false", async () => {
    setupHappyPath();
    p.shop.findUnique.mockResolvedValue(makeValidShop({ autoConfirmBookings: false }));

    // Update create mock to return PENDING status
    const pendingAppt = {
      id: "appt-2",
      status: "PENDING",
      shopId: "shop-1",
      barberId: "barber-1",
      serviceId: "svc-1",
      date: "2026-07-13",
      time: "11:00",
      duration: 30,
      price: 100,
      source: "ONLINE",
      notes: null,
      bookedByUserId: null,
      bookedByName: null,
      clientId: "client-1",
      shop: { name: "Test Shop", address: "Istanbul", phone: "5550000000" },
    };

    p.$transaction.mockImplementation(async (fn: any) => {
      p.appointment.findMany.mockResolvedValue([]);
      p.appointment.create.mockResolvedValue(pendingAppt);
      return fn({
        appointment: { findMany: p.appointment.findMany, create: p.appointment.create },
        user: { updateMany: vi.fn().mockResolvedValue({}) },
      });
    });

    const result = await createBooking({ ...BASE_PARAMS });
    expect(result.status).toBe("PENDING");
  });

  it("emits APPOINTMENT_CREATED event after successful booking", async () => {
    setupHappyPath();
    const { emit } = await import("@/lib/events");

    await createBooking({ ...BASE_PARAMS });

    expect(emit).toHaveBeenCalledWith(
      "appointment.created",
      expect.objectContaining({ appointmentId: "appt-1", shopId: "shop-1" })
    );
  });
});

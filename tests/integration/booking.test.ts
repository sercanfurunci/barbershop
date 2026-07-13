/**
 * Integration tests for the full booking flow.
 *
 * These tests require a live PostgreSQL database and run the real Prisma client
 * against a test schema. They are automatically SKIPPED when DATABASE_URL is
 * not set so that CI unit-test jobs pass without a database service.
 *
 * To run locally:
 *   DATABASE_URL=postgresql://... npm run test -- tests/integration/booking.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

const HAS_DB = Boolean(process.env.DATABASE_URL);

describe.skipIf(!HAS_DB)("BookingService integration", () => {
  // Dynamic imports so the module (and Prisma client) are only loaded when DB is present
  let prisma: any;
  let createBooking: Function;
  let BookingError: any;

  // A seeded shop/barber/service created for these tests
  let shopId: string;
  let barberId: string;
  let serviceId: string;

  beforeAll(async () => {
    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.prisma;

    const bookingModule = await import("@/lib/services/BookingService.js");
    createBooking = bookingModule.createBooking;
    BookingError  = bookingModule.BookingError;

    // Seed minimal data
    const shop = await prisma.shop.create({
      data: {
        name:               "Integration Test Shop",
        slug:               `test-shop-${Date.now()}`,
        phone:              "5550000000",
        address:            "Test Address",
        status:             "ACTIVE",
        subscriptionStatus: "ACTIVE",
        planTier:           "STARTER",
        autoConfirmBookings: true,
      },
    });
    shopId = shop.id;

    const barber = await prisma.barber.create({
      data: {
        shopId,
        name:      "Test Barber",
        available: true,
      },
    });
    barberId = barber.id;

    await prisma.workingHours.create({
      data: {
        barberId,
        monStart: 480, // 08:00
        monEnd:   1080, // 18:00
        tueStart: 480,
        tueEnd:   1080,
        wedStart: 480,
        wedEnd:   1080,
        thuStart: 480,
        thuEnd:   1080,
        friStart: 480,
        friEnd:   1080,
        satStart: null,
        satEnd:   null,
        sunStart: null,
        sunEnd:   null,
      },
    });

    const service = await prisma.service.create({
      data: {
        shopId,
        name:     "Integration Test Haircut",
        duration: 30,
        price:    100,
      },
    });
    serviceId = service.id;

    await prisma.barberService.create({
      data: { barberId, serviceId },
    });
  });

  afterAll(async () => {
    if (!prisma || !shopId) return;
    // Clean up in reverse dependency order
    await prisma.appointment.deleteMany({ where: { shopId } }).catch(() => {});
    await prisma.barberService.deleteMany({ where: { barberId } }).catch(() => {});
    await prisma.workingHours.deleteMany({ where: { barberId } }).catch(() => {});
    await prisma.service.deleteMany({ where: { shopId } }).catch(() => {});
    await prisma.barber.deleteMany({ where: { shopId } }).catch(() => {});
    await prisma.client.deleteMany({ where: { shopId } }).catch(() => {});
    await prisma.shop.delete({ where: { id: shopId } }).catch(() => {});
    await prisma.$disconnect().catch(() => {});
  });

  it("creates an appointment successfully on a future weekday", async () => {
    // Pick next Monday to ensure it's a working day and always in the future
    const nextMonday = getNextWeekday(1);

    const appt = await createBooking({
      shopId,
      barberId,
      serviceId,
      name:  "Test Customer",
      phone: "5551112233",
      date:  nextMonday,
      time:  "10:00",
    });

    expect(appt.id).toBeTruthy();
    expect(appt.shopId).toBe(shopId);
    expect(appt.barberId).toBe(barberId);
    expect(appt.serviceId).toBe(serviceId);
    expect(appt.status).toBe("CONFIRMED");
  });

  it("throws SLOT_TAKEN when same slot is booked twice", async () => {
    const nextMonday = getNextWeekday(1);

    // First booking
    await createBooking({
      shopId,
      barberId,
      serviceId,
      name:  "First Customer",
      phone: "5551113344",
      date:  nextMonday,
      time:  "11:00",
    });

    // Second booking for same slot should fail
    await expect(
      createBooking({
        shopId,
        barberId,
        serviceId,
        name:  "Second Customer",
        phone: "5551114455",
        date:  nextMonday,
        time:  "11:00",
      })
    ).rejects.toMatchObject({ code: "SLOT_TAKEN" });
  });

  it("creates a Client record and links it to the appointment", async () => {
    const nextMonday = getNextWeekday(1);

    const appt = await createBooking({
      shopId,
      barberId,
      serviceId,
      name:  "New Client",
      phone: "5559998877",
      date:  nextMonday,
      time:  "14:00",
    });

    const client = await prisma.client.findUnique({
      where: { shopId_phone: { shopId, phone: "5559998877" } },
    });
    expect(client).not.toBeNull();
    expect(appt.clientId).toBe(client.id);
  });

  it("prevents double-booking when slots overlap due to service duration", async () => {
    // First booking at 09:00 with a 30-min service; 09:15 overlaps within that window
    const nextWednesday = getNextWeekday(3);

    await createBooking({
      shopId,
      barberId,
      serviceId,
      name:  "Early Bird",
      phone: "5550001111",
      date:  nextWednesday,
      time:  "09:00",
    });

    // 09:15 starts inside the 09:00–09:30 window — must be rejected
    await expect(
      createBooking({
        shopId,
        barberId,
        serviceId,
        name:  "Overlapper",
        phone: "5550002222",
        date:  nextWednesday,
        time:  "09:15",
      })
    ).rejects.toMatchObject({ code: "SLOT_TAKEN" });
  });

  it("throws BARBER_NOT_FOUND for a barberId that does not belong to the shop", async () => {
    const nextMonday = getNextWeekday(1);

    await expect(
      createBooking({
        shopId,
        barberId:  "00000000-0000-0000-0000-000000000000", // non-existent
        serviceId,
        name:  "Ghost Barber",
        phone: "5550003333",
        date:  nextMonday,
        time:  "15:00",
      })
    ).rejects.toMatchObject({ code: "BARBER_NOT_FOUND" });
  });

  it("throws SLOT_UNAVAILABLE when booking is outside barber working hours", async () => {
    // The barber's working hours end at 18:00 (1080 min); 20:00 is outside
    const nextMonday = getNextWeekday(1);

    await expect(
      createBooking({
        shopId,
        barberId,
        serviceId,
        name:  "Night Owl",
        phone: "5550004444",
        date:  nextMonday,
        time:  "20:00",
      })
    ).rejects.toMatchObject({ code: "SLOT_UNAVAILABLE" });
  });

  it("allows the same phone to book two different slots on the same day", async () => {
    const nextThursday = getNextWeekday(4);

    const appt1 = await createBooking({
      shopId,
      barberId,
      serviceId,
      name:  "Multi Booker",
      phone: "5550005555",
      date:  nextThursday,
      time:  "08:00",
    });

    const appt2 = await createBooking({
      shopId,
      barberId,
      serviceId,
      name:  "Multi Booker",
      phone: "5550005555",
      date:  nextThursday,
      time:  "09:00",
    });

    expect(appt1.id).not.toBe(appt2.id);
    expect(appt1.status).toBe("CONFIRMED");
    expect(appt2.status).toBe("CONFIRMED");
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the next date (YYYY-MM-DD) for the given weekday (0=Sun, 1=Mon … 6=Sat). */
function getNextWeekday(targetDow: number): string {
  const d   = new Date();
  const dow = d.getDay();
  const diff = (targetDow - dow + 7) % 7 || 7; // at least 1 day ahead
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

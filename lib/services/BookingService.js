import { prisma } from "@/lib/prisma";
import { todayStr, nowMinutes } from "@/lib/utils";
import { canAcceptPublicBookings } from "@/lib/subscription";
import { validateBookingWindow } from "@/lib/booking";
import { findOrCreateClient } from "@/lib/services/CustomerService";
import { emit, EVENTS } from "@/lib/events";

// Structured error — route maps .status to HTTP status, .code to JSON body.
export class BookingError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code   = code;
    this.status = status;
  }
}

const ALLOWED_SOURCES = new Set(["ONLINE", "WALK_IN", "MANUAL", "WHATSAPP", "INSTAGRAM", "VOICE", "AI_CHAT", "MESSENGER"]);
const SOURCE_ALIASES  = { PHONE: "MANUAL", ADMIN: "MANUAL", WALKIN: "WALK_IN" };

export function normalizeSource(s) {
  if (!s) return "ONLINE";
  const up = String(s).toUpperCase();
  return ALLOWED_SOURCES.has(SOURCE_ALIASES[up] ?? up) ? (SOURCE_ALIASES[up] ?? up) : "ONLINE";
}

/**
 * Core booking engine. Call this from any channel: website API, AI agent, WhatsApp
 * webhook, admin panel — never duplicate this logic.
 *
 * Preconditions (enforced by caller before calling):
 *   - phone is a valid 10-digit Turkish mobile number
 *   - name.trim().length >= 2
 *   - date matches /^\d{4}-\d{2}-\d{2}$/ and is not in the past
 *   - time matches /^\d{2}:\d{2}$/
 *
 * @param {{
 *   shopId:        string,
 *   name:          string,
 *   phone:         string,
 *   email?:        string|null,
 *   serviceId:     string,
 *   barberId:      string,
 *   date:          string,
 *   time:          string,
 *   notes?:        string|null,
 *   source?:       string,
 *   bookedByUserId?: string|null,
 *   bookedByName?:   string|null,
 * }} params
 * @returns {Promise<import("@prisma/client").Appointment>}
 * @throws {BookingError}
 */
export async function createBooking({
  shopId, name, phone, email, serviceId, barberId, date, time,
  notes = null, source = "ONLINE", bookedByUserId = null, bookedByName = null,
}) {
  const today = todayStr();

  // Same-day past-slot guard (service-layer re-check; HTTP layer also checks)
  if (date === today) {
    const [hh, mm] = time.split(":").map(Number);
    if (hh * 60 + mm <= nowMinutes()) {
      throw new BookingError("Geçmiş bir saate randevu oluşturulamaz.", "PAST_TIME", 400);
    }
  }

  // Guard: unauthenticated booking for a phone that has an account must log in.
  if (!bookedByUserId) {
    const phone10 = phone.slice(-10);
    const ownerUser = await prisma.user.findFirst({
      where: { phone: { endsWith: phone10 } },
      select: { id: true },
    });
    if (ownerUser) {
      throw new BookingError(
        "Bu telefon numarası kayıtlı bir müşteri hesabına ait. Devam etmek için lütfen giriş yapın.",
        "PHONE_HAS_ACCOUNT",
        409,
      );
    }
  }

  const [shop, service, barber, barberOffersService, barberServiceCount, existingClient] =
    await Promise.all([
      prisma.shop.findUnique({
        where:  { id: shopId },
        select: { id: true, status: true, subscriptionStatus: true, trialEndsAt: true, deletedAt: true, autoConfirmBookings: true },
      }),
      prisma.service.findFirst({ where: { id: serviceId, shopId } }),
      prisma.barber.findFirst({ where: { id: barberId, shopId } }),
      prisma.barberService.findUnique({ where: { barberId_serviceId: { barberId, serviceId } } }),
      prisma.barberService.count({ where: { barberId } }),
      prisma.client.findUnique({
        where:  { shopId_phone: { shopId, phone } },
        select: { id: true, blocked: true },
      }),
    ]);

  if (!shop || shop.deletedAt)   throw new BookingError("Salon bulunamadı", "SHOP_NOT_FOUND", 404);
  if (!canAcceptPublicBookings(shop)) throw new BookingError("Bu salon şu an çevrimiçi randevu almıyor.", "SHOP_SUSPENDED", 403);
  if (!service)                  throw new BookingError("Hizmet bulunamadı", "SERVICE_NOT_FOUND", 404);
  if (!barber)                   throw new BookingError("Berber bulunamadı", "BARBER_NOT_FOUND", 404);
  if (!barber.available)         throw new BookingError("Bu berber şu an randevu kabul etmiyor.", "BARBER_UNAVAILABLE", 409);
  if (barberServiceCount > 0 && !barberOffersService) {
    throw new BookingError("Seçilen berber bu hizmeti vermiyor.", "SERVICE_MISMATCH", 409);
  }
  if (existingClient?.blocked) {
    throw new BookingError("Bu numara ile randevu oluşturulamaz.", "CLIENT_BLOCKED", 403);
  }

  // Max 2 active upcoming appointments per phone per shop
  if (existingClient) {
    const upcomingCount = await prisma.appointment.count({
      where: { shopId, clientId: existingClient.id, date: { gte: today }, status: { notIn: ["CANCELLED", "NOSHOW"] } },
    });
    if (upcomingCount >= 2) {
      throw new BookingError(
        "Bu telefon numarasıyla zaten 2 aktif randevunuz bulunmaktadır.",
        "TOO_MANY_APPOINTMENTS",
        429,
      );
    }
  }

  const [h, m]   = time.split(":").map(Number);
  const startMin = h * 60 + m;
  const endMin   = startMin + service.duration;

  // Working hours / break / holiday gate
  const window = await validateBookingWindow({ shopId, barberId, date, startMin, durationMin: service.duration });
  if (!window.ok) throw new BookingError(window.error, "SLOT_UNAVAILABLE", window.status ?? 409);

  // Serializable tx: slot conflict re-check + client upsert + appointment create
  // ponytail: Serializable retries on conflict. Upgrade to advisory locks if throughput matters.
  let appointment;
  try {
    appointment = await prisma.$transaction(async (tx) => {
      const conflicts = await tx.appointment.findMany({
        where:  { shopId, barberId, date, status: { notIn: ["CANCELLED", "NOSHOW"] } },
        select: { time: true, duration: true },
      });
      const taken = conflicts.some(a => {
        const aStart = parseInt(a.time.split(":")[0]) * 60 + parseInt(a.time.split(":")[1]);
        return startMin < aStart + a.duration && endMin > aStart;
      });
      if (taken) throw new Error("SLOT_TAKEN");

      const client = await findOrCreateClient(tx, { shopId, name, phone, email }, existingClient);

      // Link logged-in CUSTOMER to their Client record for future review lookups
      if (bookedByUserId && !existingClient) {
        await tx.user.updateMany({
          where: { id: bookedByUserId, clientId: null },
          data:  { clientId: client.id },
        }).catch(() => {});
      }

      return tx.appointment.create({
        data: {
          shopId,
          clientId:       client.id,
          barberId,
          serviceId,
          date,
          time,
          duration:       service.duration,
          price:          service.price,
          status:         shop.autoConfirmBookings ? "CONFIRMED" : "PENDING",
          source:         normalizeSource(source),
          notes:          notes?.trim().slice(0, 500) ?? null,
          bookedByUserId: bookedByUserId ?? null,
          bookedByName:   bookedByName?.trim().slice(0, 100) ?? null,
        },
        include: { shop: { select: { name: true, address: true, phone: true } } },
      });
    }, { isolationLevel: "Serializable" });
  } catch (e) {
    if (e.message === "SLOT_TAKEN") {
      throw new BookingError("Bu saat dilimi dolu. Lütfen başka bir saat seçin.", "SLOT_TAKEN", 409);
    }
    throw e;
  }

  // Fire event — non-blocking, handlers must not throw
  emit(EVENTS.APPOINTMENT_CREATED, { appointmentId: appointment.id, shopId, barberId, date, time, source });

  return appointment;
}

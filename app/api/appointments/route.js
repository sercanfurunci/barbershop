import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withAuth } from "@/lib/middleware/withRole";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { queueNotifications } from "@/lib/notifications";
import { createBooking, BookingError } from "@/lib/services/BookingService";
import { ok, created, err, tooManyRequests, serverError } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

// ─── Input helpers (HTTP-layer only) ─────────────────────────────────────────

function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0")  && digits.length === 11) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

function isValidPhone(phone) { return /^5[0-9]{9}$/.test(phone); }
function isValidName(name)   { return typeof name === "string" && name.trim().length >= 2 && name.trim().length <= 100; }
function isValidEmail(email) { return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

// GET /api/appointments?date=2026-06-10&barberId=brb-1&status=PENDING
export const GET = withAuth(async (request, _ctx, payload) => {

  const { searchParams } = new URL(request.url);
  const date     = searchParams.get("date");
  const barberId = searchParams.get("barberId");
  const rawStatus = searchParams.get("status");
  const VALID_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NOSHOW"];
  const status = VALID_STATUSES.includes(rawStatus) ? rawStatus : null;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "200") || 200, 1), 500);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0") || 0, 0);

  const shopId =
    payload.role === "SUPER_ADMIN"
      ? (searchParams.get("shopId") ?? null)
      : payload.shopId;

  if (!shopId) return ok([]);

  const effectiveBarberId =
    payload.role === "BARBER" ? payload.barberId : (barberId ?? undefined);

  const where = {
    shopId,
    ...(date               && { date }),
    ...(effectiveBarberId  && { barberId: effectiveBarberId }),
    ...(status             && { status }),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      client:  { select: { id: true, name: true, phone: true, email: true } },
      barber:  { select: { id: true, slug: true, nameTr: true, avatar: true } },
      service: { select: { id: true, nameTr: true, nameEn: true, icon: true } },
    },
    orderBy: [{ date: "desc" }, { time: "desc" }],
    skip: offset,
    take: limit,
  });

  return ok(appointments);
});

// POST /api/appointments — public booking endpoint
export async function POST(request) {
  const log = logger(request);
  try {
    // ── IP rate limit: 5 bookings per IP per 10 min ──────────────────────────
    const ip = getIp(request);
    const rl = await rateLimit(`booking:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rl.ok) {
      return err("Çok fazla istek gönderdiniz. Lütfen 10 dakika bekleyin.", 429);
    }

    // Optional auth — bookedByUserId comes from JWT only, never the body.
    const authPayload  = await requireAuth(request).catch(() => null);
    const bookedByUserId = authPayload?.userId ?? null;

    const body = await request.json();
    const { name, phone: rawPhone, email, serviceId, barberId, date, time, notes, source, shopId, bookedByName } = body;

    // ── Field presence ───────────────────────────────────────────────────────
    if (!shopId || !name || !rawPhone || !serviceId || !barberId || !date || !time) {
      return err("Eksik alanlar var");
    }
    if (!isValidName(name)) {
      return err("İsim en az 2 karakter olmalıdır.");
    }
    const phone = normalizePhone(rawPhone);
    if (!phone || !isValidPhone(phone)) {
      return err("Geçerli bir Türkiye telefon numarası girin (örn: 532 123 45 67).");
    }
    if (!isValidEmail(email)) {
      return err("Geçerli bir e-posta adresi girin.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return err("Geçersiz tarih formatı.");
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return err("Geçersiz saat formatı.");
    }

    const appointment = await createBooking({
      shopId, name, phone, email, serviceId, barberId, date, time,
      notes, source, bookedByUserId, bookedByName,
    });

    log.info("booking created", { appointmentId: appointment.id, shopId, barberId, date, time });

    // Queue notifications (non-blocking)
    queueNotifications(appointment.id, "CREATED").catch(err =>
      log.error("notification queue error", { appointmentId: appointment.id }, err)
    );

    return created(appointment);
  } catch (e) {
    if (e instanceof BookingError) {
      return err(e.message, e.status, e.code);
    }
    log.error("booking error", {}, e);
    return serverError();
  }
}

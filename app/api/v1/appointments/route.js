/**
 * /api/v1/appointments — versioned booking endpoint.
 *
 * Versioning strategy:
 *   - v1 routes are thin HTTP adapters over lib/services/*.
 *   - Business logic lives in services, never in routes.
 *   - When a breaking change is needed, create /api/v2/ and keep /api/v1/ stable.
 *   - Non-breaking additions (new response fields, new optional params) can ship
 *     in-place without a new version.
 *
 * This route mirrors /api/appointments but:
 *   - Returns a versioned envelope: { data, meta: { version, ts } }
 *   - Accepts all BookingSource enum values (including WHATSAPP, AI_CHAT, etc.)
 *   - Is the endpoint AI/channel integrations should call (not /api/appointments)
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { queueNotifications } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import { createBooking, BookingError } from "@/lib/services/BookingService";

export const dynamic = "force-dynamic";

const VERSION = "1";

function ok(data, status = 200) {
  return NextResponse.json({ data, meta: { version: VERSION, ts: new Date().toISOString() } }, { status });
}
function err(message, code, status) {
  return NextResponse.json({ error: message, code, meta: { version: VERSION } }, { status });
}

function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0")  && digits.length === 11) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

function isValidPhone(p) { return /^5[0-9]{9}$/.test(p); }
function isValidName(n)   { return typeof n === "string" && n.trim().length >= 2 && n.trim().length <= 100; }
function isValidEmail(e)  { return !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

export async function POST(request) {
  const log = logger(request);
  try {
    const ip = getIp(request);
    const rl = await rateLimit(`booking:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rl.ok) return err("Too many requests.", "RATE_LIMITED", 429);

    const authPayload    = await requireAuth(request).catch(() => null);
    const bookedByUserId = authPayload?.userId ?? null;

    const body = await request.json();
    const { name, phone: rawPhone, email, serviceId, barberId, date, time, notes, source, shopId, bookedByName } = body;

    if (!shopId || !name || !rawPhone || !serviceId || !barberId || !date || !time)
      return err("Missing required fields.", "MISSING_FIELDS", 400);
    if (!isValidName(name))  return err("Name must be 2-100 characters.", "INVALID_NAME", 400);
    const phone = normalizePhone(rawPhone);
    if (!phone || !isValidPhone(phone)) return err("Invalid Turkish mobile number.", "INVALID_PHONE", 400);
    if (!isValidEmail(email)) return err("Invalid email.", "INVALID_EMAIL", 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return err("Invalid date format (YYYY-MM-DD).", "INVALID_DATE", 400);
    if (!/^\d{2}:\d{2}$/.test(time)) return err("Invalid time format (HH:MM).", "INVALID_TIME", 400);

    const appointment = await createBooking({
      shopId, name, phone, email, serviceId, barberId, date, time,
      notes, source, bookedByUserId, bookedByName,
    });

    log.info("v1 booking created", { appointmentId: appointment.id, shopId, source });

    queueNotifications(appointment.id, "CREATED").catch(e =>
      log.error("v1 notification error", { appointmentId: appointment.id }, e)
    );

    return ok(appointment, 201);
  } catch (e) {
    if (e instanceof BookingError) return err(e.message, e.code, e.status);
    log.error("v1 booking error", {}, e);
    return err("Internal server error.", "SERVER_ERROR", 500);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getDefaultShopId } from "@/lib/shop";
import { queueNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Normalizes Turkish phone to 10-digit format starting with 5 (e.g. "5321234567")
// Accepts: 05321234567 / 5321234567 / +905321234567 / 532 123 45 67 etc.
function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0")  && digits.length === 11) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

function isValidPhone(phone) {
  return /^5[0-9]{9}$/.test(phone);
}

function isValidName(name) {
  return typeof name === "string" && name.trim().length >= 2 && name.trim().length <= 100;
}

function isValidEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Best-effort IP rate limiting (in-memory, per serverless instance).
// Limits public booking to 5 requests per IP per 10 minutes.
const ipBucket = new Map(); // ip → { count, resetAt }
function checkIpRate(ip) {
  const now = Date.now();
  const WINDOW = 10 * 60 * 1000; // 10 min
  const LIMIT  = 5;
  const entry = ipBucket.get(ip);
  if (!entry || now > entry.resetAt) {
    ipBucket.set(ip, { count: 1, resetAt: now + WINDOW });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

// GET /api/appointments?date=2026-06-10&barberId=brb-1&status=PENDING
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const date     = searchParams.get("date");
  const barberId = searchParams.get("barberId");
  const status   = searchParams.get("status");
  const limit    = parseInt(searchParams.get("limit") ?? "200");

  const shopId =
    payload.role === "SUPER_ADMIN"
      ? (searchParams.get("shopId") ?? null)
      : payload.shopId;

  if (!shopId) return NextResponse.json([]);

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
    take: limit,
  });

  return NextResponse.json(appointments);
}

// POST /api/appointments — public booking endpoint
export async function POST(request) {
  try {
    // ── IP rate limit ────────────────────────────────────────────────────────
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkIpRate(ip)) {
      return NextResponse.json(
        { error: "Çok fazla istek gönderdiniz. Lütfen 10 dakika bekleyin." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, phone: rawPhone, email, serviceId, barberId, date, time, notes, source } = body;

    // ── Field presence ───────────────────────────────────────────────────────
    if (!name || !rawPhone || !serviceId || !barberId || !date || !time) {
      return NextResponse.json({ error: "Eksik alanlar var" }, { status: 400 });
    }

    // ── Name ─────────────────────────────────────────────────────────────────
    if (!isValidName(name)) {
      return NextResponse.json({ error: "İsim en az 2 karakter olmalıdır." }, { status: 400 });
    }

    // ── Phone ─────────────────────────────────────────────────────────────────
    const phone = normalizePhone(rawPhone);
    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Geçerli bir Türkiye telefon numarası girin (örn: 532 123 45 67)." },
        { status: 400 }
      );
    }

    // ── Email (optional) ──────────────────────────────────────────────────────
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
    }

    // ── Date format & not in past ─────────────────────────────────────────────
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Geçersiz tarih formatı." }, { status: 400 });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return NextResponse.json({ error: "Geçmiş bir tarihe randevu oluşturulamaz." }, { status: 400 });
    }

    // ── Time format ───────────────────────────────────────────────────────────
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Geçersiz saat formatı." }, { status: 400 });
    }

    const shopId = await getDefaultShopId();

    // Fetch service, barber, existing client, and slot conflicts in parallel.
    const [service, barber, existingClient, slotConflicts] = await Promise.all([
      prisma.service.findFirst({ where: { id: serviceId, shopId } }),
      prisma.barber.findFirst({ where: { id: barberId, shopId } }),
      prisma.client.findUnique({
        where: { shopId_phone: { shopId, phone } },
        select: { id: true, blocked: true },
      }),
      prisma.appointment.findMany({
        where: { shopId, barberId, date, status: { notIn: ["CANCELLED", "NOSHOW"] } },
        select: { time: true, duration: true },
      }),
    ]);

    if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });
    if (!barber)  return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });

    // ── Phone-based spam guard: max 2 active upcoming appointments per phone ──
    if (existingClient?.blocked) {
      return NextResponse.json({ error: "Bu numara ile randevu oluşturulamaz." }, { status: 403 });
    }
    if (existingClient) {
      const upcomingCount = await prisma.appointment.count({
        where: {
          shopId,
          clientId: existingClient.id,
          date:     { gte: today },
          status:   { notIn: ["CANCELLED", "NOSHOW"] },
        },
      });
      if (upcomingCount >= 2) {
        return NextResponse.json(
          { error: "Bu telefon numarasıyla zaten 2 aktif randevunuz bulunmaktadır." },
          { status: 429 }
        );
      }
    }

    // ── Slot conflict check ───────────────────────────────────────────────────
    const [h, m] = time.split(":").map(Number);
    const startMin = h * 60 + m;
    const endMin   = startMin + service.duration;

    const conflict = slotConflicts.some(a => {
      const aStart = parseInt(a.time.split(":")[0]) * 60 + parseInt(a.time.split(":")[1]);
      const aEnd   = aStart + a.duration;
      return startMin < aEnd && endMin > aStart;
    });

    if (conflict) {
      return NextResponse.json({ error: "Bu saat dilimi dolu. Lütfen başka bir saat seçin." }, { status: 409 });
    }

    // ── Find-or-create client ─────────────────────────────────────────────────
    let client = existingClient
      ? await prisma.client.update({
          where: { id: existingClient.id },
          data: { name: name.trim(), ...(email && { email }) },
        })
      : await prisma.client.create({
          data: { shopId, name: name.trim(), phone, email: email || null },
        });

    // ── Create appointment ────────────────────────────────────────────────────
    const appointment = await prisma.appointment.create({
      data: {
        shopId,
        clientId:  client.id,
        barberId,
        serviceId,
        date,
        time,
        duration:  service.duration,
        price:     service.price,
        status:    "PENDING",
        source:    source ?? "ONLINE",
        notes:     notes?.trim() ?? null,
      },
    });

    // Queue notifications (non-blocking — don't let this fail the response)
    queueNotifications(appointment.id, "CREATED").catch(err =>
      console.error("[POST /api/appointments] queue error:", err.message)
    );

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    console.error("[POST /api/appointments]", err);
    return NextResponse.json({ error: "Sunucu hatası", detail: err.message }, { status: 500 });
  }
}

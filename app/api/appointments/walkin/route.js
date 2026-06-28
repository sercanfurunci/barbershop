import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { todayStr, nowMinutes } from "@/lib/utils";
import { createReviewRequest } from "@/lib/reviews";
import { validateBookingWindow } from "@/lib/booking";
import { splitRevenue } from "@/lib/revenue";

export const dynamic = "force-dynamic";

const PAYMENT_METHODS = new Set(["CASH", "CARD", "TRANSFER"]);

// POST /api/appointments/walkin
// Captures a customer who showed up without booking online. Creates the
// appointment as COMPLETED immediately and runs the same revenue/lifecycle
// updates as the COMPLETED branch in /api/appointments/[id]/status.
//
// body: {
//   barberId: string (required),
//   serviceId?: string,                  // pick from catalog
//   customServiceName?: string,           // OR free-form label
//   duration?: number,                    // required when customServiceName is set
//   finalPrice: number (required),
//   paymentMethod?: "CASH"|"CARD"|"TRANSFER",
//   tipAmount?: number,
//   name: string (required),
//   phone?: string                        // optional — anonymous walk-in falls back to a placeholder
// }
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!["ADMIN", "SUPER_ADMIN", "BARBER"].includes(payload.role)) return forbidden();

  const body = await request.json();
  const { barberId, serviceId, customServiceName, duration: rawDuration,
          finalPrice: rawPrice, paymentMethod: rawPm, tipAmount: rawTip,
          name: rawName, phone: rawPhone } = body;

  // ── Validation ─────────────────────────────────────────────────────────────
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "İsim 2-100 karakter olmalı" }, { status: 400 });
  }
  if (!barberId) {
    return NextResponse.json({ error: "Berber seçin" }, { status: 400 });
  }
  if (!serviceId && !customServiceName) {
    return NextResponse.json({ error: "Hizmet seçin veya özel hizmet adı yazın" }, { status: 400 });
  }
  const finalPrice = Number(rawPrice);
  if (!Number.isFinite(finalPrice) || finalPrice < 0 || finalPrice > 100000) {
    return NextResponse.json({ error: "Geçerli bir fiyat girin (0-100000 TL)" }, { status: 400 });
  }
  const tipAmount = rawTip == null || rawTip === "" ? 0 : Number(rawTip);
  if (!Number.isFinite(tipAmount) || tipAmount < 0 || tipAmount > 10000) {
    return NextResponse.json({ error: "Geçersiz bahşiş" }, { status: 400 });
  }
  const paymentMethod = rawPm && PAYMENT_METHODS.has(rawPm) ? rawPm : "CASH";

  // ── Resolve shop + barber ─────────────────────────────────────────────────
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    select: { id: true, shopId: true, available: true, paymentType: true, commissionRate: true },
  });
  if (!barber) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });
  if (!barber.available) return NextResponse.json({ error: "Bu berber şu an randevu kabul etmiyor." }, { status: 409 });

  const shopId = payload.role === "SUPER_ADMIN" ? barber.shopId : payload.shopId;
  if (!shopId || barber.shopId !== shopId) return forbidden();
  if (payload.role === "BARBER" && payload.barberId !== barber.id) return forbidden();

  // ── Resolve service: catalog pick OR custom (hidden placeholder service) ──
  let service;
  let customLabel = null;
  if (serviceId) {
    service = await prisma.service.findFirst({
      where: { id: serviceId, shopId },
      select: { id: true, duration: true, nameTr: true, price: true },
    });
    if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });
  } else {
    // Custom service: log under a hidden per-shop placeholder + remember the
    // free-form label so reports can show "Sakal düzeltme" instead of "Walk-in".
    const trimmed = customServiceName.trim().slice(0, 100);
    if (trimmed.length < 2) {
      return NextResponse.json({ error: "Özel hizmet adı en az 2 karakter olmalı" }, { status: 400 });
    }
    const duration = Number(rawDuration);
    if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
      return NextResponse.json({ error: "Süre 5-480 dakika olmalı" }, { status: 400 });
    }
    customLabel = trimmed;
    service = await prisma.service.findFirst({
      where: { shopId, nameTr: "Walk-in", active: false },
      select: { id: true, duration: true, nameTr: true },
    });
    if (!service) {
      service = await prisma.service.create({
        data: {
          shopId,
          nameTr:   "Walk-in",
          nameEn:   "Walk-in",
          descTr:   "Dahili kayıt — yalnızca walk-in randevular için",
          descEn:   "Internal — used for walk-in only",
          duration,
          category: "CUTS",
          active:   false,
        },
        select: { id: true, duration: true, nameTr: true },
      });
    }
    service = { ...service, duration };
  }

  // ── Resolve / create client ───────────────────────────────────────────────
  // Real Turkish phone: dedup. No phone: use a unique placeholder so the
  // @@unique([shopId, phone]) constraint holds and lifetime metrics for this
  // anonymous visit don't collide with anyone else's.
  const phoneDigits = String(rawPhone ?? "").replace(/\D/g, "");
  let phoneKey;
  if (phoneDigits.length >= 10 && /^5/.test(phoneDigits.slice(-10))) {
    phoneKey = phoneDigits.slice(-10);
  } else {
    phoneKey = `wi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const now  = new Date();
  const date = todayStr();
  const min  = nowMinutes();
  const time = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

  const { barberAmount, shopAmount } = splitRevenue(finalPrice, barber);

  const startMin = min;
  const endMin   = startMin + service.duration;

  const window = await validateBookingWindow({
    shopId, barberId: barber.id, date, startMin, durationMin: service.duration,
  });
  if (!window.ok) return NextResponse.json({ error: window.error }, { status: window.status });

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      // Slot collision check — same logic as public POST. Excludes CANCELLED/NOSHOW.
      const conflicts = await tx.appointment.findMany({
        where: { shopId, barberId: barber.id, date, status: { notIn: ["CANCELLED","NOSHOW"] } },
        select: { time: true, duration: true },
      });
      const overlap = conflicts.some(a => {
        const aStart = parseInt(a.time.split(":")[0]) * 60 + parseInt(a.time.split(":")[1]);
        const aEnd   = aStart + a.duration;
        return startMin < aEnd && endMin > aStart;
      });
      if (overlap) throw new Error("SLOT_TAKEN");

      const existing = await tx.client.findUnique({
        where: { shopId_phone: { shopId, phone: phoneKey } },
        select: { id: true, blocked: true },
      });
      if (existing?.blocked) throw new Error("CLIENT_BLOCKED");

      const client = existing
        ? await tx.client.update({
            where: { id: existing.id },
            data: {
              name,
              totalSpent:  { increment: finalPrice + tipAmount },
              visitCount:  { increment: 1 },
              lastVisitAt: now,
            },
          })
        : await tx.client.create({
            data: {
              shopId, name, phone: phoneKey,
              totalSpent: finalPrice + tipAmount,
              visitCount: 1,
              lastVisitAt: now,
            },
          });

      return tx.appointment.create({
        data: {
          shopId,
          clientId:    client.id,
          barberId:    barber.id,
          serviceId:   service.id,
          date,
          time,
          duration:    service.duration,
          price:       finalPrice,
          status:      "COMPLETED",
          source:      "WALK_IN",
          isWalkIn:    true,
          customServiceName: customLabel,
          grossAmount: finalPrice,
          barberAmount,
          shopAmount,
          tipAmount,
          paymentMethod,
          completedAt: now,
        },
        include: {
          client:  { select: { id: true, name: true, phone: true } },
          barber:  { select: { id: true, nameTr: true, avatar: true } },
          service: { select: { id: true, nameTr: true } },
        },
      });
    });

    // Review funnel parity with normal completion path. Skip for anonymous
    // walk-ins whose phone is a `wi-…` placeholder — Netgsm would reject it.
    if (!phoneKey.startsWith("wi-")) {
      createReviewRequest(appointment.id).catch(() => {});
    }

    // Audit price tampering: catalog services only. Custom services have no
    // reference price so the check is meaningless there.
    if (serviceId && service.price != null && finalPrice !== service.price) {
      prisma.auditLog.create({
        data: {
          shopId,
          entity:        "appointment",
          entityId:      appointment.id,
          appointmentId: appointment.id,
          action:        "walkin_price_mismatch",
          userId:        payload.userId ?? null,
          before:        { catalogPrice: service.price },
          after:         { finalPrice, tipAmount, paymentMethod, barberId: barber.id },
        },
      }).catch(() => {}); // never block response on audit write
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (e) {
    if (e.message === "CLIENT_BLOCKED") {
      return NextResponse.json({ error: "Bu müşteri engellenmiş" }, { status: 403 });
    }
    if (e.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "Bu saatte bu berbere ait başka bir randevu var." }, { status: 409 });
    }
    console.error("[POST /api/appointments/walkin]", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

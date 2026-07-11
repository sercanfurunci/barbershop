import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/customer/reviews — list the logged-in customer's submitted reviews
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = payload.userId;

  // Build OR conditions to find all reviews that belong to this user.
  // The userId field is the primary key (set on all new reviews).
  // Fallbacks cover reviews submitted before this field was added:
  //   • customerId = User.clientId (if the User was already linked to a Client)
  //   • customerId in phone-matched Clients (across all shops the user ever booked at)
  const orConditions = [{ userId }];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { clientId: true, phone: true, email: true },
  });

  if (user?.clientId) {
    orConditions.push({ customerId: user.clientId });
  }

  if (user?.phone) {
    const phone10 = user.phone.replace(/\D/g, "").slice(-10);
    if (phone10.length >= 10) {
      const phoneClients = await prisma.client.findMany({
        where: { phone: { endsWith: phone10 } },
        select: { id: true },
      });
      if (phoneClients.length > 0) {
        orConditions.push({ customerId: { in: phoneClients.map(c => c.id) } });
      }
    }
  }

  // 4th fallback: email-based Client lookup (covers email-only registrations)
  if (user?.email) {
    const emailClients = await prisma.client.findMany({
      where: { email: user.email },
      select: { id: true },
    });
    if (emailClients.length > 0) {
      orConditions.push({ customerId: { in: emailClients.map(c => c.id) } });
    }
  }

  const reviews = await prisma.review.findMany({
    where:   { OR: orConditions, barberRating: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, userId: true, barberRating: true, comment: true, createdAt: true,
      barber: {
        select: {
          id: true, slug: true, nameTr: true, titleTr: true,
          avatar: true, profilePhoto: true,
        },
      },
      shop: { select: { id: true, name: true, slug: true } },
      appointment: {
        select: {
          id: true, date: true,
          service: { select: { nameTr: true } },
        },
      },
    },
  });

  // Deduplicate (in case a review matched multiple OR branches)
  const seen = new Set();
  const unique = reviews.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });

  // Backfill userId on legacy reviews found via fallback — fast path next time
  const toBackfill = unique.filter(r => !r.userId).map(r => r.id);
  if (toBackfill.length > 0) {
    prisma.review.updateMany({
      where: { id: { in: toBackfill } },
      data: { userId },
    }).catch(() => {});
  }

  // eslint-disable-next-line no-unused-vars
  return NextResponse.json(unique.map(({ userId: _uid, ...r }) => r));
}

// POST /api/customer/reviews
// Customers rate the BARBER only. Salon rating removed — shops use Google Reviews.
// If barberRating >= 4 AND shop has googleReviewUrl, response includes it for CTA.
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId, barberRating, comment } = await request.json();

  if (!appointmentId || !barberRating) {
    return NextResponse.json({ error: "appointmentId ve barberRating gerekli" }, { status: 400 });
  }
  if (barberRating < 1 || barberRating > 5) {
    return NextResponse.json({ error: "Puan 1-5 arasında olmalı" }, { status: 400 });
  }
  if (comment && String(comment).length > 1000) {
    return NextResponse.json({ error: "Yorum en fazla 1000 karakter olabilir" }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true, status: true, reviewed: true,
      shopId: true, barberId: true, clientId: true,
      bookedByUserId: true,
      shop:   { select: { googleReviewUrl: true } },
      barber: { select: { id: true, rating: true, reviewCount: true } },
    },
  });

  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (appt.status !== "COMPLETED") return NextResponse.json({ error: "Sadece tamamlanan randevular değerlendirilebilir" }, { status: 422 });
  if (appt.reviewed) return NextResponse.json({ error: "Bu randevu zaten değerlendirildi" }, { status: 409 });

  // Ownership check: must be the booking user, the linked client, or phone-matched client.
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { clientId: true, phone: true },
  });

  const isClientOwner  = user?.clientId && appt.clientId === user.clientId;
  const isBookingOwner = appt.bookedByUserId === payload.userId;

  if (!isClientOwner && !isBookingOwner) {
    // Last resort: phone-based match (legacy guest bookings later registered)
    let phoneMatch = false;
    if (user?.phone) {
      const phone10 = user.phone.replace(/\D/g, "").slice(-10);
      if (phone10.length >= 10) {
        const client = await prisma.client.findUnique({
          where: { id: appt.clientId },
          select: { phone: true },
        });
        const cp10 = client?.phone?.replace(/\D/g, "").slice(-10) ?? "";
        phoneMatch = cp10.length >= 10 && cp10 === phone10;
      }
    }
    if (!phoneMatch) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const newBarberTotal = appt.barber.reviewCount + 1;
  const newBarberAvg   = ((appt.barber.rating * appt.barber.reviewCount) + barberRating) / newBarberTotal;

  await prisma.$transaction([
    prisma.review.create({
      data: {
        shopId:      appt.shopId,
        appointmentId,
        barberId:    appt.barberId,
        customerId:  appt.clientId,
        userId:      payload.userId, // ← the fix: always store the User ID
        shopRating:  0,              // schema compat — no longer collected
        barberRating,
        comment:     comment?.trim() || null,
      },
    }),
    prisma.appointment.update({ where: { id: appointmentId }, data: { reviewed: true } }),
    prisma.barber.update({
      where: { id: appt.barberId },
      data: { rating: newBarberAvg, reviewCount: newBarberTotal },
    }),
  ]);

  const googleReviewUrl = barberRating >= 4 ? (appt.shop.googleReviewUrl ?? null) : null;
  return NextResponse.json({ ok: true, googleReviewUrl }, { status: 201 });
}

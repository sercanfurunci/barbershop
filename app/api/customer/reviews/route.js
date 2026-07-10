import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/customer/reviews — list the logged-in customer's submitted reviews
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { clientId: true },
  });

  if (!user?.clientId) return NextResponse.json([]);

  const reviews = await prisma.review.findMany({
    where:   { customerId: user.clientId, barberRating: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, barberRating: true, comment: true, createdAt: true,
      barber:      { select: { id: true, nameTr: true, avatar: true } },
      shop:        { select: { id: true, name: true, slug: true } },
      appointment: { select: { date: true, service: { select: { nameTr: true } } } },
    },
  });

  return NextResponse.json(reviews);
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

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true, status: true, reviewed: true,
      shopId: true, barberId: true, clientId: true,
      shop:   { select: { googleReviewUrl: true } },
      barber: { select: { id: true, rating: true, reviewCount: true } },
    },
  });

  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (appt.status !== "COMPLETED") return NextResponse.json({ error: "Sadece tamamlanan randevular değerlendirilebilir" }, { status: 422 });
  if (appt.reviewed) return NextResponse.json({ error: "Bu randevu zaten değerlendirildi" }, { status: 409 });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { clientId: true },
  });

  if (user?.clientId && appt.clientId !== user.clientId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
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
        shopRating:  0, // schema compat — no longer collected
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

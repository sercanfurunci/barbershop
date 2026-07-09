import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST /api/customer/reviews
// In-app review submission after a COMPLETED appointment.
// If rating >= 4 AND shop has googleReviewUrl, the response includes it so
// the mobile app can offer "Share on Google" CTA.
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId, shopRating, barberRating, comment } = await request.json();

  if (!appointmentId || !shopRating || !barberRating) {
    return NextResponse.json({ error: "appointmentId, shopRating ve barberRating gerekli" }, { status: 400 });
  }
  if (shopRating < 1 || shopRating > 5 || barberRating < 1 || barberRating > 5) {
    return NextResponse.json({ error: "Puan 1-5 arasında olmalı" }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      reviewed: true,
      shopId: true,
      barberId: true,
      clientId: true,
      shop: { select: { id: true, avgRating: true, totalReviews: true, googleReviewUrl: true } },
      barber: { select: { id: true, rating: true, reviewCount: true } },
    },
  });

  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (appt.status !== "COMPLETED") return NextResponse.json({ error: "Sadece tamamlanan randevular değerlendirilebilir" }, { status: 422 });
  if (appt.reviewed) return NextResponse.json({ error: "Bu randevu zaten değerlendirildi" }, { status: 409 });

  // Verify reviewer owns the appointment
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { clientId: true },
  });

  if (user?.clientId && appt.clientId !== user.clientId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const newShopTotal = appt.shop.totalReviews + 1;
  const newShopAvg = ((appt.shop.avgRating * appt.shop.totalReviews) + shopRating) / newShopTotal;
  const newBarberTotal = appt.barber.reviewCount + 1;
  const newBarberAvg = ((appt.barber.rating * appt.barber.reviewCount) + barberRating) / newBarberTotal;

  await prisma.$transaction([
    prisma.review.create({
      data: {
        shopId: appt.shopId,
        appointmentId,
        barberId: appt.barberId,
        customerId: appt.clientId,
        shopRating,
        barberRating,
        comment: comment?.trim() || null,
      },
    }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { reviewed: true },
    }),
    prisma.shop.update({
      where: { id: appt.shopId },
      data: { avgRating: newShopAvg, totalReviews: newShopTotal },
    }),
    prisma.barber.update({
      where: { id: appt.barberId },
      data: { rating: newBarberAvg, reviewCount: newBarberTotal },
    }),
  ]);

  // If high rating + shop has Google Review URL, include it in response
  const googleReviewUrl =
    shopRating >= 4 && barberRating >= 4 ? (appt.shop.googleReviewUrl ?? null) : null;

  return NextResponse.json({ ok: true, googleReviewUrl }, { status: 201 });
}

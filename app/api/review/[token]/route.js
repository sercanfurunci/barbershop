import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// GET /api/review/:token — fetch review request info (public)
export async function GET(request, { params }) {
  const { token } = await params;

  const rr = await prisma.reviewRequest.findUnique({
    where: { token },
    include: {
      barber: { select: { nameTr: true, nameEn: true, profilePhoto: true, avatar: true, titleTr: true, titleEn: true } },
      appointment: {
        select: {
          date: true,
          status: true,
          reviewed: true,
          service: { select: { nameTr: true, nameEn: true } },
        },
      },
      shop: { select: { name: true, googleReviewUrl: true } },
    },
  });

  if (!rr) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (rr.appointment?.reviewed || rr.status === "REVIEWED") {
    return NextResponse.json({ alreadyReviewed: true });
  }
  if (rr.appointment?.status !== "COMPLETED") {
    return NextResponse.json({ error: "Randevu henüz tamamlanmadı" }, { status: 409 });
  }

  return NextResponse.json({
    customerName: rr.customerName,
    barber:       rr.barber,
    appointment:  rr.appointment,
    shop:         rr.shop,
  });
}

// POST /api/review/:token — submit review (shopRating + barberRating)
export async function POST(request, { params }) {
  // 3 attempts per IP per 5 minutes
  const ip = getIp(request);
  const rl = rateLimit(`review:${ip}`, { limit: 3, windowMs: 5 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const { shopRating, barberRating, comment } = body;

  const shopR   = Math.floor(Number(shopRating));
  const barberR = Math.floor(Number(barberRating));
  if (!shopR   || shopR   < 1 || shopR   > 5) return NextResponse.json({ error: "Geçersiz salon puanı" }, { status: 400 });
  if (!barberR || barberR < 1 || barberR > 5) return NextResponse.json({ error: "Geçersiz berber puanı" }, { status: 400 });

  const rr = await prisma.reviewRequest.findUnique({
    where: { token },
    include: {
      appointment: { select: { id: true, status: true, reviewed: true, clientId: true } },
      shop:        { select: { googleReviewUrl: true } },
    },
  });
  if (!rr) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (rr.appointment.reviewed || rr.status === "REVIEWED") {
    return NextResponse.json({ error: "Zaten değerlendirildi" }, { status: 409 });
  }
  if (rr.appointment.status !== "COMPLETED") {
    return NextResponse.json({ error: "Randevu henüz tamamlanmadı" }, { status: 409 });
  }

  const cleanComment = comment?.trim().slice(0, 1000) || null;

  // Single transaction: insert Review, mark appointment reviewed, bump dispatch
  // tracker, recompute Shop + Barber aggregates via running average.
  try {
    await prisma.$transaction(async (tx) => {
      const shop   = await tx.shop.findUnique({   where: { id: rr.shopId },   select: { avgRating: true, totalReviews: true } });
      const barber = await tx.barber.findUnique({ where: { id: rr.barberId }, select: { rating: true, reviewCount: true } });

      await tx.review.create({
        data: {
          shopId:        rr.shopId,
          appointmentId: rr.appointmentId,
          barberId:      rr.barberId,
          customerId:    rr.appointment.clientId,
          shopRating:    shopR,
          barberRating:  barberR,
          comment:       cleanComment,
        },
      });

      await tx.appointment.update({
        where: { id: rr.appointmentId },
        data:  { reviewed: true },
      });

      await tx.reviewRequest.update({
        where: { id: rr.id },
        data:  {
          rating:     shopR, // legacy column — keep summary copy
          comment:    cleanComment,
          status:     "REVIEWED",
          reviewedAt: new Date(),
        },
      });

      const shopTotal   = shop.totalReviews + 1;
      const shopAvgNew  = ((shop.avgRating * shop.totalReviews) + shopR) / shopTotal;
      await tx.shop.update({
        where: { id: rr.shopId },
        data:  {
          totalReviews: shopTotal,
          avgRating:    Math.round(shopAvgNew * 100) / 100,
        },
      });

      const barberTotal  = barber.reviewCount + 1;
      const barberAvgNew = ((barber.rating * barber.reviewCount) + barberR) / barberTotal;
      await tx.barber.update({
        where: { id: rr.barberId },
        data:  {
          reviewCount: barberTotal,
          rating:      Math.round(barberAvgNew * 10) / 10,
        },
      });
    });
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Zaten değerlendirildi" }, { status: 409 });
    }
    console.error("[review submit]", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }

  // Google CTA only when shop saved a direct review URL AND rating >= 4.
  const googleUrl = shopR >= 4 ? (rr.shop?.googleReviewUrl || null) : null;

  return NextResponse.json({
    ok: true,
    shopRating:      shopR,
    barberRating:    barberR,
    redirectToGoogle: !!googleUrl,
    googleUrl,
  });
}

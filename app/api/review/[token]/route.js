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
      appointment: { select: { date: true, service: { select: { nameTr: true, nameEn: true } } } },
      shop: { select: { name: true } },
    },
  });

  if (!rr) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (rr.status === "REVIEWED") return NextResponse.json({ alreadyReviewed: true, rating: rr.rating });

  return NextResponse.json({
    customerName: rr.customerName,
    barber: rr.barber,
    appointment: rr.appointment,
    shop: rr.shop,
  });
}

// POST /api/review/:token — submit review
export async function POST(request, { params }) {
  // 3 attempts per IP per 5 minutes
  const ip = getIp(request);
  const rl = rateLimit(`review:${ip}`, { limit: 3, windowMs: 5 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const { rating, comment } = body;

  const ratingInt = Math.floor(Number(rating));
  if (!ratingInt || ratingInt < 1 || ratingInt > 5) {
    return NextResponse.json({ error: "Geçersiz puan" }, { status: 400 });
  }

  const rr = await prisma.reviewRequest.findUnique({ where: { token } });
  if (!rr) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (rr.status === "REVIEWED") return NextResponse.json({ error: "Zaten değerlendirildi" }, { status: 409 });

  await prisma.$transaction([
    prisma.reviewRequest.update({
      where: { token },
      data: {
        rating: ratingInt,
        comment: comment?.trim().slice(0, 1000) || null,
        status: "REVIEWED",
        reviewedAt: new Date(),
      },
    }),
    // Update barber aggregate
    prisma.barber.update({
      where: { id: rr.barberId },
      data: { reviewCount: { increment: 1 } },
    }),
  ]);

  // Recalculate barber average rating
  const allRatings = await prisma.reviewRequest.findMany({
    where: { barberId: rr.barberId, status: "REVIEWED" },
    select: { rating: true },
  });
  const avg = allRatings.reduce((s, r) => s + (r.rating ?? 0), 0) / allRatings.length;
  await prisma.barber.update({
    where: { id: rr.barberId },
    data: { rating: Math.round(avg * 10) / 10 },
  });

  const googleMapsUrl = process.env.GOOGLE_REVIEW_URL || null;
  return NextResponse.json({
    ok: true,
    redirectToGoogle: ratingInt >= 5 && !!googleMapsUrl,
    googleUrl: ratingInt >= 5 ? googleMapsUrl : null,
  });
}

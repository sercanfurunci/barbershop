import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Returns the review only if the authenticated user owns it.
// Ownership: userId matches OR (legacy) customerId matches user's clientId.
async function getOwnedReview(reviewId, userId) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true, barberRating: true, comment: true,
      barberId: true, appointmentId: true,
      customerId: true, userId: true,
      barber: { select: { rating: true, reviewCount: true } },
    },
  });
  if (!review) return null;

  // Primary: userId on the review (all reviews created after the fix)
  if (review.userId === userId) return review;

  // Fallback: legacy reviews stored before userId field was added
  if (review.customerId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    });
    if (user?.clientId && review.customerId === user.clientId) return review;
  }

  return null;
}

// PATCH /api/customer/reviews/:id — edit barberRating or comment
export async function PATCH(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const review = await getOwnedReview(id, payload.userId);
  if (!review) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const { barberRating, comment } = await request.json();

  if (barberRating !== undefined) {
    if (barberRating < 1 || barberRating > 5) {
      return NextResponse.json({ error: "Puan 1-5 arasında olmalı" }, { status: 400 });
    }
  }

  const newRating  = barberRating ?? review.barberRating;
  const oldRating  = review.barberRating;
  const { rating: oldAvg, reviewCount } = review.barber;

  const newAvg = reviewCount > 0
    ? (oldAvg * reviewCount - oldRating + newRating) / reviewCount
    : newRating;

  await prisma.$transaction([
    prisma.review.update({
      where: { id },
      data: {
        barberRating: newRating,
        ...(comment !== undefined ? { comment: comment?.trim() || null } : {}),
      },
    }),
    prisma.barber.update({
      where: { id: review.barberId },
      data: { rating: newAvg },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

// DELETE /api/customer/reviews/:id — remove review, recalculate barber avg
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const review = await getOwnedReview(id, payload.userId);
  if (!review) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const { rating: oldAvg, reviewCount } = review.barber;
  const newCount = reviewCount - 1;
  const newAvg   = newCount > 0
    ? (oldAvg * reviewCount - review.barberRating) / newCount
    : 5.0;

  await prisma.$transaction([
    prisma.review.delete({ where: { id } }),
    prisma.appointment.update({
      where: { id: review.appointmentId },
      data:  { reviewed: false },
    }),
    prisma.barber.update({
      where: { id: review.barberId },
      data: { rating: newAvg, reviewCount: newCount },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/public/barbers/[slug]?shopSlug=abc
// Full barber profile for the mobile barber profile screen.
export async function GET(request, { params }) {
  const { slug } = await params;
  const shopSlug = new URL(request.url).searchParams.get("shopSlug");

  const barber = await prisma.barber.findFirst({
    where: {
      slug,
      ...(shopSlug ? { shop: { slug: shopSlug } } : {}),
    },
    select: {
      id: true,
      slug: true,
      nameTr: true,
      titleTr: true,
      bioTr: true,
      avatar: true,
      profilePhoto: true,
      specialties: true,
      yearsExp: true,
      rating: true,
      reviewCount: true,
      available: true,
      shopId: true,
      shop: { select: { id: true, slug: true, name: true, services: { where: { active: true }, select: { id: true, nameTr: true, price: true, duration: true }, orderBy: { sortOrder: "asc" } } } },
      workingHours: {
        select: {
          monStart: true, monEnd: true,
          tueStart: true, tueEnd: true,
          wedStart: true, wedEnd: true,
          thuStart: true, thuEnd: true,
          friStart: true, friEnd: true,
          satStart: true, satEnd: true,
          sunStart: true, sunEnd: true,
        },
      },
    },
  });

  if (!barber) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });

  const [reviews, completedAppointments] = await Promise.all([
    prisma.review.findMany({
      where: { barberId: barber.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        barberRating: true,
        comment: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.appointment.count({
      where: { barberId: barber.id, status: "COMPLETED" },
    }),
  ]);

  return NextResponse.json({ barber: { ...barber, completedAppointments }, reviews });
}

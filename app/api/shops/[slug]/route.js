import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/shops/:slug — public shop detail with barbers + services + working hours
export async function GET(request, { params }) {
  const { slug } = await params;
  try {

  const shop = await prisma.shop.findFirst({
    where: { slug, status: "ACTIVE", deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      address: true,
      addressLine: true,
      phone: true,
      whatsappNumber: true,
      email: true,
      logo: true,
      coverImage: true,
      gallery: true,
      featuredImage: true,
      mobileSettings: true,
      avgRating: true,
      totalReviews: true,
      description: true,
      about: true,
      shopType: true,
      foundedYear: true,
      ownerName: true,
      instagramUrl: true,
      facebookUrl: true,
      tiktokUrl: true,
      website: true,
      googleReviewUrl: true,
      mapsEmbed: true,
      latitude: true,
      longitude: true,
      barbers: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          slug: true,
          nameTr: true,
          avatar: true,
          profilePhoto: true,
          available: true,
          specialties: true,
          rating: true,
          reviewCount: true,
          yearsExp: true,
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
      },
      services: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          nameTr: true,
          nameEn: true,
          price: true,
          duration: true,
          icon: true,
          category: true,
          popular: true,
        },
      },
    },
  });

  if (!shop) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  // Derive shop-level working hours from the union of all barbers' hours.
  // For each day, take the earliest open and latest close across all barbers.
  const DAY_KEYS = [
    { key: "mon", label: "Pzt" },
    { key: "tue", label: "Sal" },
    { key: "wed", label: "Çar" },
    { key: "thu", label: "Per" },
    { key: "fri", label: "Cum" },
    { key: "sat", label: "Cmt" },
    { key: "sun", label: "Paz" },
  ];

  function minsToTime(mins) {
    if (mins == null) return null;
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  const workingHours = DAY_KEYS.map(({ key, label }) => {
    const starts = [];
    const ends = [];
    for (const b of shop.barbers) {
      const s = b.workingHours?.[`${key}Start`];
      const e = b.workingHours?.[`${key}End`];
      if (s != null) starts.push(s);
      if (e != null) ends.push(e);
    }
    if (starts.length === 0) return { day: key, label, open: null, close: null, closed: true };
    return {
      day: key,
      label,
      open: minsToTime(Math.min(...starts)),
      close: minsToTime(Math.max(...ends)),
      closed: false,
    };
  });

  // Strip workingHours from individual barbers before sending (already in shop-level)
  const barbers = shop.barbers.map(({ workingHours: _wh, ...rest }) => rest);

  return NextResponse.json({ ...shop, barbers, workingHours });
  } catch (e) {
    console.error("[shops/slug]", e?.message);
    return NextResponse.json({ error: "Yüklenemedi" }, { status: 500 });
  }
}

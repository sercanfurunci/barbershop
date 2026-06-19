import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function fetchReviews(placeId, apiKey) {
  const fields = "rating,user_ratings_total,reviews";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=tr&key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();
  return data.result || null;
}

// GET /api/reviews?shopId=xxx
export async function GET(request) {
  const shopId = new URL(request.url).searchParams.get("shopId");

  let apiKey  = null;
  let placeId = null;

  if (shopId) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { googlePlaceId: true, googlePlacesKey: true },
    });
    placeId = shop?.googlePlaceId ?? null;
    apiKey  = shop?.googlePlacesKey ?? process.env.GOOGLE_PLACES_API_KEY ?? null;
  } else {
    // No shopId — use global env vars (superadmin/standalone context only)
    placeId = process.env.GOOGLE_PLACE_ID ?? null;
    apiKey  = process.env.GOOGLE_PLACES_API_KEY ?? null;
  }

  if (!placeId) {
    return NextResponse.json({ reviews: [], rating: null, totalRatings: 0 }, { status: 200 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const result = await fetchReviews(placeId, apiKey);
    if (!result) {
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 502 });
    }

    const reviews = (result.reviews || [])
      .filter((r) => r.text && r.text.length > 30)
      .slice(0, 8)
      .map((r) => ({
        name:         r.author_name,
        avatar:       r.author_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        text:         r.text,
        rating:       r.rating,
        relativeTime: r.relative_time_description,
        profilePhoto: r.profile_photo_url,
      }));

    return NextResponse.json({
      placeId,
      rating:       result.rating,
      totalRatings: result.user_ratings_total,
      reviews,
    });
  } catch (err) {
    console.error("[reviews]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Server-side Google Place reviews fetcher. SSR pages call this once and pass
// the result to Hero + Testimonials so the public landing doesn't fire two
// client fetches per visit. Mirrors /api/reviews logic.

import { prisma } from "@/lib/prisma";

export async function getGoogleReviews(shopId) {
  let placeId = null;
  let apiKey  = null;

  if (shopId) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { googlePlaceId: true, googlePlacesKey: true },
    });
    placeId = shop?.googlePlaceId ?? null;
    apiKey  = shop?.googlePlacesKey ?? process.env.GOOGLE_PLACES_API_KEY ?? null;
  } else {
    placeId = process.env.GOOGLE_PLACE_ID ?? null;
    apiKey  = process.env.GOOGLE_PLACES_API_KEY ?? null;
  }

  if (!placeId || !apiKey) return null;

  try {
    const fields = "rating,user_ratings_total,reviews";
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=tr&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    const result = data.result;
    if (!result) return null;

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

    // Cache to DB so list API can show Google ratings without extra fetches.
    if (shopId && (result.rating != null)) {
      prisma.shop.update({
        where: { id: shopId },
        data: { googleRating: result.rating, googleTotalRatings: result.user_ratings_total ?? 0 },
      }).catch(() => {});
    }

    return {
      placeId,
      rating:       result.rating ?? null,
      totalRatings: result.user_ratings_total ?? 0,
      reviews,
    };
  } catch (err) {
    console.error("[getGoogleReviews]", err.message);
    return null;
  }
}

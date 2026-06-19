import { NextResponse } from "next/server";

const API_KEY    = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_NAME = "Abdurrahman Çelik Exclusive Salon Darıca Kocaeli";

// Prefer the GOOGLE_PLACE_ID env var to skip the search API call.
// Falls back to text-search if not configured.
let cachedPlaceId = process.env.GOOGLE_PLACE_ID || null;

async function findPlaceId() {
  if (cachedPlaceId) return cachedPlaceId;

  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(PLACE_NAME)}&inputtype=textquery&fields=place_id&key=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
  const data = await res.json();

  if (data.candidates?.[0]?.place_id) {
    cachedPlaceId = data.candidates[0].place_id;
    return cachedPlaceId;
  }
  return null;
}

async function fetchReviews(placeId) {
  const fields = "rating,user_ratings_total,reviews";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=tr&key=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1h
  const data = await res.json();
  return data.result || null;
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const placeId = await findPlaceId();
    if (!placeId) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const result = await fetchReviews(placeId);
    if (!result) {
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 502 });
    }

    const reviews = (result.reviews || [])
      .filter((r) => r.text && r.text.length > 30)
      .slice(0, 8)
      .map((r) => ({
        name: r.author_name,
        avatar: r.author_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        text: r.text,
        rating: r.rating,
        relativeTime: r.relative_time_description,
        profilePhoto: r.profile_photo_url,
      }));

    return NextResponse.json({
      placeId,
      rating: result.rating,
      totalRatings: result.user_ratings_total,
      reviews,
    });
  } catch (err) {
    console.error("[reviews]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

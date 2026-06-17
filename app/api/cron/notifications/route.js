import { NextResponse } from "next/server";
import { processQueue } from "@/lib/notifications";
import { processReviewQueue } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [notifResults, reviewResults] = await Promise.all([
      processQueue(20),
      processReviewQueue(20),
    ]);
    return NextResponse.json({ ok: true, notifications: notifResults, reviews: reviewResults });
  } catch (err) {
    console.error("[cron/notifications]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

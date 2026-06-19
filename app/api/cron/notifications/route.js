import { NextResponse } from "next/server";
import { processQueue } from "@/lib/notifications";
import { processReviewQueue } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get("authorization");
  const isProd = process.env.NODE_ENV === "production";
  // In production, CRON_SECRET is mandatory — open endpoint is a security hole.
  // In dev, allow if no secret is configured.
  const unauthorized = isProd
    ? !secret || auth !== `Bearer ${secret}`
    : !!secret && auth !== `Bearer ${secret}`;
  if (unauthorized) {
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
    return NextResponse.json({ error: "Cron error" }, { status: 500 });
  }
}

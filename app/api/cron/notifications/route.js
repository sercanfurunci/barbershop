import { NextResponse } from "next/server";
import { processQueue } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request) {
  // Verify Vercel cron secret
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processQueue(20);
    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("[cron/notifications]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

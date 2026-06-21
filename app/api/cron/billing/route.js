// Daily billing cron. Vercel Cron–compatible.
// Idempotent: runs the two state transitions and reports counts.
//
// Schedule (vercel.json):
//   { "path": "/api/cron/billing", "schedule": "0 3 * * *" }
//
// Auth: CRON_SECRET as Bearer (same pattern as cron/notifications).

import { NextResponse } from "next/server";
import { expireTrials, suspendPastDue } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isProd = process.env.NODE_ENV === "production";
  const unauthorized = isProd
    ? !secret || auth !== `Bearer ${secret}`
    : !!secret && auth !== `Bearer ${secret}`;
  if (unauthorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const expired = await expireTrials();
    const suspended = await suspendPastDue();
    return NextResponse.json({ ok: true, expired, suspended });
  } catch (err) {
    console.error("[cron/billing]", err);
    return NextResponse.json({ error: "Cron error" }, { status: 500 });
  }
}

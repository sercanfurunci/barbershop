import { NextResponse }                       from "next/server";
import { AppointmentLifecycleService }         from "@/lib/services/AppointmentLifecycleService";

export const dynamic = "force-dynamic";

// GET /api/cron/appointments
// Runs every minute (Vercel Cron "* * * * *").
// Delegates all logic to AppointmentLifecycleService — keep this file thin.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get("authorization");
  const isProd = process.env.NODE_ENV === "production";
  const unauthorized = isProd
    ? !secret || auth !== `Bearer ${secret}`
    : !!secret && auth !== `Bearer ${secret}`;
  if (unauthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await AppointmentLifecycleService.run();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/appointments]", err);
    return NextResponse.json({ error: "Cron error" }, { status: 500 });
  }
}

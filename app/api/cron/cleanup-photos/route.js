// Weekly Cloudinary orphan cleanup. Lists assets under makas/barbers/ and
// destroys any whose public_id no longer maps to a live Barber row.
//
// Schedule (vercel.json): { "path": "/api/cron/cleanup-photos", "schedule": "0 4 * * 0" }
// Auth: CRON_SECRET as Bearer (same pattern as other crons).

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isProd = process.env.NODE_ENV === "production";
  const unauthorized = isProd
    ? !secret || auth !== `Bearer ${secret}`
    : !!secret && auth !== `Bearer ${secret}`;
  if (unauthorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ ok: true, skipped: "cloudinary not configured" });
  }

  try {
    const liveIds = new Set(
      (await prisma.barber.findMany({ select: { id: true } })).map(b => `makas/barbers/${b.id}`)
    );

    let nextCursor;
    let scanned = 0;
    const orphans = [];
    // ponytail: paginate with admin API. 500/page is plenty for early scale;
    // upgrade to streaming if barber count crosses ~50k.
    do {
      const page = await cloudinary.api.resources({
        type: "upload",
        prefix: "makas/barbers/",
        max_results: 500,
        next_cursor: nextCursor,
      });
      scanned += page.resources.length;
      for (const r of page.resources) {
        if (!liveIds.has(r.public_id)) orphans.push(r.public_id);
      }
      nextCursor = page.next_cursor;
    } while (nextCursor);

    let deleted = 0;
    if (orphans.length) {
      // delete_resources accepts up to 100 ids per call.
      for (let i = 0; i < orphans.length; i += 100) {
        const batch = orphans.slice(i, i + 100);
        await cloudinary.api.delete_resources(batch);
        deleted += batch.length;
      }
    }

    return NextResponse.json({ ok: true, scanned, deleted });
  } catch (err) {
    console.error("[cron/cleanup-photos]", err);
    return NextResponse.json({ error: "Cron error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_SET, normalizeMetadata } from "@/lib/analytics";
import { rateLimit, getIp } from "@/lib/rateLimit";

// Public ingest. Never throws to caller — tracking failures must not break UX.
// sendBeacon clients get a 204 even when body is malformed.
export async function POST(req) {
  try {
    const ip = getIp(req);
    // 120 events/min per IP. Generous: covers SPA route changes + CTAs.
    const { ok } = rateLimit(`events:${ip}`, { limit: 120, windowMs: 60_000 });
    if (!ok) return new NextResponse(null, { status: 204 });

    const body = await req.json().catch(() => null);
    if (!body) return new NextResponse(null, { status: 204 });

    const { shopId, eventType, metadata } = body;
    if (typeof shopId !== "string" || !shopId) return new NextResponse(null, { status: 204 });
    if (!EVENT_TYPE_SET.has(eventType))         return new NextResponse(null, { status: 204 });

    // No shop existence check — FK enforces. If shopId is junk, insert fails silently.
    await prisma.analyticsEvent.create({
      data: { shopId, eventType, metadata: normalizeMetadata(metadata) },
    }).catch(() => {});

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}

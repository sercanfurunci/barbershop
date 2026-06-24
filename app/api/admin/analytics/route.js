import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { EVENT_TYPES } from "@/lib/analytics";

export const dynamic = "force-dynamic";

// GET /api/admin/analytics — last 30d landing-page events for the caller's shop.
// SUPER_ADMIN can scope another shop with ?shopId=...
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!["ADMIN", "SUPER_ADMIN"].includes(payload.role)) return forbidden();

  const shopId = payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId") ?? payload.shopId
    : payload.shopId;
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const since = new Date(Date.now() - 30 * 86_400_000);

  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["eventType"],
    where: { shopId, createdAt: { gte: since } },
    _count: { _all: true },
  });

  // ponytail: zero-fill missing event types so the UI doesn't have to.
  const counts = Object.fromEntries(EVENT_TYPES.map((t) => [t, 0]));
  for (const row of grouped) counts[row.eventType] = row._count._all;

  return NextResponse.json({ since: since.toISOString(), counts });
}

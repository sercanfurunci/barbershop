import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { EVENT_TYPES } from "@/lib/analytics";

export const dynamic = "force-dynamic";

// GET /api/superadmin/analytics — last 30d totals across every shop +
// top 10 shops by total event volume.
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "SUPER_ADMIN") return forbidden();

  const since = new Date(Date.now() - 30 * 86_400_000);

  const [byType, byShop] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["shopId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { shopId: "desc" } },
      take: 10,
    }),
  ]);

  const totals = Object.fromEntries(EVENT_TYPES.map((t) => [t, 0]));
  for (const r of byType) totals[r.eventType] = r._count._all;

  const shopIds = byShop.map((r) => r.shopId);
  const shopRows = shopIds.length
    ? await prisma.shop.findMany({
        where: { id: { in: shopIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const shopMap = new Map(shopRows.map((s) => [s.id, s]));
  const topShops = byShop.map((r) => ({
    shopId: r.shopId,
    name:   shopMap.get(r.shopId)?.name ?? r.shopId,
    slug:   shopMap.get(r.shopId)?.slug ?? null,
    events: r._count._all,
  }));

  return NextResponse.json({ since: since.toISOString(), totals, topShops });
}

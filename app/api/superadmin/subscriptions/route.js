// Super-admin subscriptions overview.
// Lists every shop with its subscription state + a coarse MRR estimate
// (sum of price for shops in ACTIVE — TRIAL and PAST_DUE are excluded).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { PLANS, getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "SUPER_ADMIN") return forbidden();

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      planTier: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
      paymentProvider: true,
      createdAt: true,
    },
  });

  // Status & tier breakdowns + MRR (only ACTIVE counts as recurring revenue).
  let mrrTry = 0;
  const byStatus = { TRIAL: 0, ACTIVE: 0, PAST_DUE: 0, SUSPENDED: 0, CANCELLED: 0 };
  const byTier = { STARTER: 0, PRO: 0, ENTERPRISE: 0 };

  for (const s of shops) {
    byStatus[s.subscriptionStatus] = (byStatus[s.subscriptionStatus] ?? 0) + 1;
    byTier[s.planTier] = (byTier[s.planTier] ?? 0) + 1;
    if (s.subscriptionStatus === "ACTIVE") {
      mrrTry += getPlan(s.planTier).priceMonthlyTry ?? 0;
    }
  }

  return NextResponse.json({
    shops,
    summary: {
      total: shops.length,
      byStatus,
      byTier,
      mrrTry,
      planPrices: Object.fromEntries(
        Object.values(PLANS).map((p) => [p.id, p.priceMonthlyTry])
      ),
    },
  });
}

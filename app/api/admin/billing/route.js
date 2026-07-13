// Admin billing snapshot. Read-only.
// Returns plan/status/trial countdown + current-month usage. The UI shows the
// numbers and a "İletişime Geç" CTA — actual upgrades are sales-led for now.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/apiResponse";
import { getPlan } from "@/lib/plans";
import { daysUntilTrialEnds, getMonthlyUsage } from "@/lib/subscription";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

export const GET = withRole(["ADMIN", "SUPER_ADMIN"], async (request, _ctx, payload) => {
  const shopId = payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
  if (!shopId) return badRequest("shopId gerekli");

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      planTier: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
      paymentProvider: true,
      createdAt: true,
    },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const plan = getPlan(shop.planTier);
  const usage = await getMonthlyUsage(shopId);

  return NextResponse.json({
    plan: {
      id: plan.id,
      label: plan.label,
      priceMonthlyTry: plan.priceMonthlyTry,
      maxBarbers: plan.maxBarbers === Infinity ? null : plan.maxBarbers,
      features: plan.features,
    },
    subscription: {
      status: shop.subscriptionStatus,
      startedAt: shop.createdAt, // ponytail: trial start = signup. Refine when paid lifecycle lands.
      trialEndsAt: shop.trialEndsAt,
      trialDaysLeft: daysUntilTrialEnds(shop),
      currentPeriodEndsAt: shop.currentPeriodEndsAt,
      paymentProvider: shop.paymentProvider,
    },
    usage,
  });
});

// Admin billing snapshot. Read-only.
// Returns plan/status/trial countdown + current-month usage. The UI shows the
// numbers and a "İletişime Geç" CTA — actual upgrades are sales-led for now.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { daysUntilTrialEnds, getMonthlyUsage } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!["ADMIN", "SUPER_ADMIN"].includes(payload.role)) return forbidden();

  const shopId = payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      planTier: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
      paymentProvider: true,
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
      trialEndsAt: shop.trialEndsAt,
      trialDaysLeft: daysUntilTrialEnds(shop),
      currentPeriodEndsAt: shop.currentPeriodEndsAt,
      paymentProvider: shop.paymentProvider,
    },
    usage,
  });
}

// Checkout entrypoint. Returns 503 until a payment provider is wired (iyzico
// stub today). When wired, returns { url, ref } for client redirect.

import { NextResponse } from "next/server";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { createCheckout, PaymentNotConfiguredError } from "@/lib/payments/provider";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!["ADMIN", "SUPER_ADMIN"].includes(payload.role)) return forbidden();

  const body = await request.json().catch(() => ({}));
  const { planTier, returnUrl } = body;
  if (!planTier) return NextResponse.json({ error: "planTier gerekli" }, { status: 400 });

  const shopId = payload.role === "SUPER_ADMIN" ? body.shopId : payload.shopId;
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  try {
    const result = await createCheckout({ shopId, planTier, returnUrl });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PaymentNotConfiguredError) {
      return NextResponse.json(
        { error: "Ödeme sağlayıcı henüz aktif değil. Lütfen bizimle iletişime geçin." },
        { status: 503 }
      );
    }
    console.error("[payments/checkout]", err.message);
    return NextResponse.json({ error: "Ödeme başlatılamadı" }, { status: 500 });
  }
}

// Payment provider webhook receiver. Provider-agnostic — delegates signature
// verification and parsing to lib/payments/provider.js. Once verified, applies
// the state transition to Shop + appends an Invoice row.
//
// Events handled:
//   payment.succeeded     → ACTIVE, bump currentPeriodEndsAt, write invoice
//   payment.failed        → PAST_DUE (grace handled by cron)
//   subscription.cancelled → CANCELLED

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhook, getProvider } from "@/lib/payments/provider";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let verified;
  try {
    verified = await verifyWebhook(request);
  } catch (err) {
    console.error("[payments/webhook] verify failed:", err.message);
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!verified) {
    // Provider not configured OR signature missing — silently 200 so the
    // provider doesn't keep retrying while we're still wiring things up.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { event, shopId, invoiceData, eventId } = verified;
  const provider = getProvider().name;

  // ponytail: dedup INSERT lives inside each event's transaction so it's atomic
  // with the state change — a failed apply can't leave the event "already processed".
  const dedupeId = eventId || invoiceData?.providerInvoiceId;

  async function insertDedup(tx) {
    if (!dedupeId) return;
    await tx.processedWebhookEvent.create({ data: { provider, eventId: dedupeId } });
  }

  try {
    if (event === "payment.succeeded") {
      const periodEnd = invoiceData?.periodEnd ? new Date(invoiceData.periodEnd) : null;
      await prisma.$transaction(async (tx) => {
        await insertDedup(tx);
        await tx.shop.update({
          where: { id: shopId },
          data: {
            subscriptionStatus: "ACTIVE",
            currentPeriodEndsAt: periodEnd,
            paymentProvider: provider,
          },
        });
        if (invoiceData?.providerInvoiceId) {
          await tx.invoice.upsert({
            where: { providerInvoiceId: invoiceData.providerInvoiceId },
            update: {},
            create: {
              shopId,
              provider,
              providerInvoiceId: invoiceData.providerInvoiceId,
              amount: invoiceData.amount ?? 0,
              currency: invoiceData.currency ?? "TRY",
              status: "PAID",
              paidAt: new Date(),
              paymentMethod: invoiceData.paymentMethod ?? null,
              periodStart: invoiceData.periodStart ? new Date(invoiceData.periodStart) : null,
              periodEnd,
              raw: invoiceData.raw ?? null,
            },
          });
        }
      });
    } else if (event === "payment.failed") {
      await prisma.$transaction(async (tx) => {
        await insertDedup(tx);
        await tx.shop.update({ where: { id: shopId }, data: { subscriptionStatus: "PAST_DUE" } });
      });
    } else if (event === "subscription.cancelled") {
      await prisma.$transaction(async (tx) => {
        await insertDedup(tx);
        await tx.shop.update({ where: { id: shopId }, data: { subscriptionStatus: "CANCELLED" } });
      });
    } else {
      console.warn("[payments/webhook] unknown event:", event);
    }
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[payments/webhook] apply failed:", err.message);
    return NextResponse.json({ error: "apply failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

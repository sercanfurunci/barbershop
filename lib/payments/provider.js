// Payment provider abstraction.
//
// Every provider implements the same async interface so callers don't care
// which one is active. The active provider is picked from PAYMENT_PROVIDER env
// (defaults to "iyzico"). Add a new provider by creating a sibling file
// (e.g. stripe.js) that exports the same shape, then add a branch below.
//
// Provider interface:
//   createCheckout({ shopId, planTier, returnUrl }) → { url, ref }
//   verifyWebhook(request)                          → { event, shopId, invoiceData } | null
//   cancelSubscription({ providerRef })             → { ok }
//
// All methods MUST throw `PaymentNotConfiguredError` when credentials are
// missing — callers turn that into a clean 503 instead of a stack trace.

import * as iyzico from "@/lib/payments/iyzico";

export class PaymentNotConfiguredError extends Error {
  constructor(message = "Payment provider not configured") {
    super(message);
    this.name = "PaymentNotConfiguredError";
  }
}

function pick() {
  const name = (process.env.PAYMENT_PROVIDER || "iyzico").toLowerCase();
  switch (name) {
    case "iyzico":
      return { name: "iyzico", ...iyzico };
    // case "stripe":
    //   return { name: "stripe", ...stripe };
    default:
      throw new PaymentNotConfiguredError(`Unknown PAYMENT_PROVIDER: ${name}`);
  }
}

export function getProvider() {
  return pick();
}

export async function createCheckout(opts) {
  return getProvider().createCheckout(opts);
}

export async function verifyWebhook(request) {
  return getProvider().verifyWebhook(request);
}

export async function cancelSubscription(opts) {
  return getProvider().cancelSubscription(opts);
}

// iyzico provider stub.
//
// Wire-up plan (when ready):
//   1. npm i iyzipay
//   2. Set env: IYZICO_API_KEY, IYZICO_SECRET, IYZICO_BASE_URL (sandbox: https://sandbox-api.iyzipay.com, prod: https://api.iyzipay.com)
//   3. Replace the stub bodies below with real SDK calls.
//   4. Configure webhook URL in iyzico dashboard → https://<your-domain>/api/payments/webhook
//
// The contract returned here matches what the abstraction expects, so the rest
// of the codebase (checkout route, webhook handler, admin UI) works once the
// stubs are filled in — no other file needs changes.

import { PaymentNotConfiguredError } from "@/lib/payments/provider";

function configured() {
  return Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET);
}

export async function createCheckout({ shopId, planTier, returnUrl }) {
  if (!configured()) throw new PaymentNotConfiguredError("iyzico credentials missing");
  // TODO: real iyzico checkout form initialization.
  // Reference: https://docs.iyzico.com/en/products/checkout-form
  throw new PaymentNotConfiguredError("iyzico SDK not wired yet — see lib/payments/iyzico.js");
}

export async function verifyWebhook(request) {
  if (!configured()) return null;
  // TODO: validate signature header, parse payload, return:
  //   { event: "payment.succeeded" | "payment.failed" | "subscription.cancelled",
  //     shopId, invoiceData: { providerInvoiceId, amount, currency, paymentMethod, periodEnd, raw } }
  return null;
}

export async function cancelSubscription({ providerRef }) {
  if (!configured()) throw new PaymentNotConfiguredError("iyzico credentials missing");
  // TODO: call iyzico subscription cancel endpoint with providerRef.
  throw new PaymentNotConfiguredError("iyzico SDK not wired yet");
}

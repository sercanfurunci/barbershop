import { prisma } from "@/lib/prisma";
import { createHmac, randomBytes } from "crypto";
import { on, EVENTS } from "@/lib/events";

// ─── Subscription management ──────────────────────────────────────────────────

/** Generate a signing secret for a new webhook subscription. */
export function generateSecret() {
  return randomBytes(32).toString("hex");
}

/**
 * Create a webhook subscription for a shop.
 * @param {{ shopId: string, url: string, events: string[] }} params
 */
export async function subscribe({ shopId, url, events }) {
  return prisma.webhookSubscription.create({
    data: { shopId, url, events, secret: generateSecret() },
  });
}

export async function unsubscribe(subscriptionId) {
  return prisma.webhookSubscription.update({
    where: { id: subscriptionId },
    data:  { active: false },
  });
}

export async function getSubscriptions(shopId) {
  return prisma.webhookSubscription.findMany({
    where:   { shopId, active: true },
    select:  { id: true, url: true, events: true, active: true, createdAt: true },
  });
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

/**
 * Sign a payload using HMAC-SHA256 with the subscription secret.
 * Receivers verify: HMAC-SHA256(secret, JSON.stringify(payload)) === signature.
 */
function sign(secret, payload) {
  return createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

/**
 * Dispatch an event to all active subscriptions that listen for it.
 * Writes a WebhookDelivery row for each; a background worker retries failures.
 * ponytail: delivery is async fire-and-queue, not fire-and-wait. The caller
 * (EventBus listener) never blocks on HTTP responses. A BackgroundJob worker
 * handles actual HTTP POSTs + retries.
 *
 * @param {string} event — EventBus event name
 * @param {object} payload
 */
export async function dispatch(event, payload) {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: { active: true, events: { has: event } },
    select: { id: true, url: true, secret: true, shopId: true },
  });

  if (subscriptions.length === 0) return;

  const now = new Date();
  await prisma.webhookDelivery.createMany({
    data: subscriptions.map(sub => ({
      subscriptionId: sub.id,
      event,
      payload:        { ...payload, _sig: sign(sub.secret, payload), _event: event, _ts: now.toISOString() },
      status:         "PENDING",
      nextRetryAt:    now,
    })),
  });
}

// ─── EventBus wiring ─────────────────────────────────────────────────────────
// Wire every EVENTS constant to the webhook dispatcher.
// Call initWebhookDispatcher() once at app startup (e.g., in lib/startup.js).
export function initWebhookDispatcher() {
  Object.values(EVENTS).forEach(event => {
    on(event, (payload) => dispatch(event, payload).catch(err =>
      console.error("[WebhookService] dispatch error", event, err)
    ));
  });
}

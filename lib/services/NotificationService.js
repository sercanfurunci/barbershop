/**
 * NotificationService — centralized notification abstraction.
 *
 * All notification sends must go through this module.
 * Never import lib/notifications.js directly from business logic.
 *
 * The service routes to the right delivery mechanism:
 *   SMS / WhatsApp → lib/notifications.js (Netgsm queue)
 *   Push           → PushToken table + future FCM/APNS worker
 *   Email          → future email provider (lib/email.js stub exists)
 *   In-app         → NotificationJob with channel=IN_APP
 *
 * Business logic calls: NotificationService.notify(event, context)
 * The service decides which channel(s) to use based on shop settings.
 */

import { queueNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// Notification event types — maps to NotifEvent enum in schema
export const NOTIF_EVENT = Object.freeze({
  APPOINTMENT_CREATED:   "CREATED",
  APPOINTMENT_CONFIRMED: "CONFIRMED",
  APPOINTMENT_CANCELLED: "CANCELLED",
  REMINDER_48H:          "REMINDER_48H",
  REMINDER_3H:           "REMINDER_3H",
  FOLLOWUP:              "FOLLOWUP",
});

/**
 * Queue notifications for an appointment event.
 * This is the single entry point for all appointment notifications.
 * Never call queueNotifications() directly from business logic.
 *
 * @param {string} appointmentId
 * @param {string} event — one of NOTIF_EVENT values
 */
export async function notify(appointmentId, event) {
  return queueNotifications(appointmentId, event);
}

/**
 * Send an in-app notification to a client (stored in NotificationJob).
 * The in-app channel has no phone requirement and no external delivery.
 *
 * @param {{ shopId: string, appointmentId?: string, message: string, event?: string }} params
 */
export async function notifyInApp({ shopId, appointmentId, message, event = "CREATED" }) {
  return prisma.notificationJob.create({
    data: {
      shopId,
      appointmentId:  appointmentId ?? null,
      channel:        "IN_APP",
      event,
      message,
      scheduledFor:   new Date(),
    },
  });
}

/**
 * Send a push notification to all tokens for a user.
 * ponytail: writes PUSH jobs to NotificationJob; a future FCM worker reads them.
 *
 * @param {{ userId: string, shopId: string, message: string, event?: string }} params
 */
export async function notifyPush({ userId, shopId, message, event = "CREATED" }) {
  const tokens = await prisma.pushToken.findMany({
    where:  { userId },
    select: { token: true },
  });
  if (tokens.length === 0) return;

  await prisma.notificationJob.createMany({
    data: tokens.map(t => ({
      shopId,
      channel:      "PUSH",
      event,
      phone:        null,  // PUSH has no phone number
      message,
      scheduledFor: new Date(),
    })),
  });
}

/**
 * Check whether a shop has any notification channel configured and enabled.
 * Used by admin UI to show setup prompts.
 */
export async function hasAnyChannelConfigured(shopId) {
  const settings = await prisma.notificationSettings.findUnique({
    where:  { shopId },
    select: { smsEnabled: true, waEnabled: true },
  });
  return !!(settings?.smsEnabled || settings?.waEnabled);
}

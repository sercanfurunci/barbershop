import { prisma } from "@/lib/prisma";
import { sendSms, sendWhatsapp } from "@/lib/notifications";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://makas.vercel.app";

// ─── Create a ReviewRequest when an appointment is completed ─────────────────
// Called from the COMPLETED transition. processReviewQueue dispatches the
// actual SMS/WhatsApp 2 hours later via cron.
export async function createReviewRequest(appointmentId) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: { select: { name: true, phone: true, email: true } },
    },
  });
  if (!appt || !appt.client.phone) return null;

  const existing = await prisma.reviewRequest.findUnique({
    where: { appointmentId },
  });
  if (existing) return existing;

  return prisma.reviewRequest.create({
    data: {
      shopId:        appt.shopId,
      appointmentId: appt.id,
      barberId:      appt.barberId,
      customerName:  appt.client.name,
      customerPhone: appt.client.phone,
      customerEmail: appt.client.email ?? null,
      status:        "PENDING",
    },
  });
}

// ─── Process pending review requests (called from cron) ──────────────────────
// Sends WhatsApp first when waEnabled (cheaper, higher engagement), falls
// back to SMS. Customer arrives at /review/:token which shows the internal
// rating UI; Google CTA only appears post-submit when shopRating >= 4.
export async function processReviewQueue(limit = 20) {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const pending = await prisma.reviewRequest.findMany({
    where: {
      status:    "PENDING",
      sentAt:    null,
      createdAt: { lte: twoHoursAgo },
    },
    take: limit,
    include: {
      shop:   { include: { notificationSettings: true } },
      barber: { select: { nameTr: true } },
    },
  });

  const results = { sent: 0, skipped: 0, failed: 0 };

  for (const rr of pending) {
    const settings = rr.shop?.notificationSettings;
    // Per-shop opt-out: skip silently if admin turned reminders off.
    if (rr.shop?.reviewReminderEnabled === false) {
      await prisma.reviewRequest.update({
        where: { id: rr.id },
        data:  { status: "SKIPPED", sentAt: new Date() },
      });
      results.skipped++;
      continue;
    }
    if (!settings || (!settings.smsEnabled && !settings.waEnabled)) {
      await prisma.reviewRequest.update({
        where: { id: rr.id },
        data:  { status: "SKIPPED", sentAt: new Date() },
      });
      results.skipped++;
      continue;
    }

    const link    = `${BASE_URL}/review/${rr.token}`;
    const message = `Merhaba ${rr.customerName.split(" ")[0]}, ${rr.barber.nameTr} ile randevunuz nasıldı? Deneyiminizi 1 dakikada paylaşın: ${link}`;

    try {
      if (settings.waEnabled) {
        await sendWhatsapp(rr.customerPhone, message, settings);
      } else if (settings.smsEnabled) {
        await sendSms(rr.customerPhone, message, settings);
      }
      await prisma.reviewRequest.update({
        where: { id: rr.id },
        data:  { status: "SENT", sentAt: new Date() },
      });
      results.sent++;
    } catch (err) {
      console.error("[reviewQueue] failed", rr.id, err.message);
      results.failed++;
    }
  }

  return results;
}

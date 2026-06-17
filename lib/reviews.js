import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://makas.vercel.app";

// ─── Create a ReviewRequest when an appointment is completed ─────────────────
export async function createReviewRequest(appointmentId) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: { select: { name: true, phone: true, email: true } },
    },
  });
  if (!appt || !appt.client.phone) return null;

  // Avoid duplicates
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
// Sends SMS to customers whose appointment completed > 2 hours ago
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
    if (!settings?.smsEnabled && !settings?.waEnabled) {
      // No SMS configured — mark skipped so we don't retry forever
      await prisma.reviewRequest.update({
        where: { id: rr.id },
        data: { status: "SKIPPED", sentAt: new Date() },
      });
      results.skipped++;
      continue;
    }

    const link = `${BASE_URL}/review/${rr.token}`;
    const message = `Merhaba ${rr.customerName.split(" ")[0]}, ${rr.barber.nameTr} ile randevunuz nasıldı? Deneyiminizi 1 dakikada paylaşın: ${link}`;

    try {
      if (settings.smsEnabled && settings.netgsmUser && settings.netgsmPassword) {
        await sendNetgsmSms(rr.customerPhone, message, settings);
      }
      await prisma.reviewRequest.update({
        where: { id: rr.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      results.sent++;
    } catch (err) {
      console.error("[reviewQueue] failed", rr.id, err.message);
      results.failed++;
    }
  }

  return results;
}

async function sendNetgsmSms(phone, message, settings) {
  const params = new URLSearchParams({
    usercode:  settings.netgsmUser,
    password:  settings.netgsmPassword,
    gsmno:     phone,
    message,
    msgheader: settings.netgsmHeader || "MAKAS",
  });
  const res  = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${params}`);
  const text = (await res.text()).trim();
  if (!text.startsWith("00")) throw new Error(`Netgsm error: ${text}`);
}

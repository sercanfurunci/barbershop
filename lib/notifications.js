import { prisma } from "@/lib/prisma";
import { toE164 } from "@/lib/validation";

// ─── Default templates (Turkish) ─────────────────────────────────────────────
const DEFAULTS = {
  CREATED:      "Sayın {{name}}, {{date}} {{time}} tarihinde {{barber}} ile {{service}} randevunuz oluşturuldu. {{shop}}",
  CONFIRMED:    "Sayın {{name}}, randevunuz onaylandı. {{date}} {{time}} - {{barber}}. Sizi bekliyoruz!",
  CANCELLED:    "Sayın {{name}}, {{date}} {{time}} tarihli randevunuz iptal edildi. Başka bir zaman görüşmek üzere.",
  REMINDER_48H: "Hatırlatma: {{name}}, yarın {{time}} saatinde {{barber}} ile {{service}} randevunuz var. {{shop}}",
  REMINDER_3H:  "{{name}}, bugün {{time}} saatinde {{barber}} ile randevunuz var. Sizi bekliyoruz! {{shop}}",
  FOLLOWUP:     "Merhaba {{name}}, randevunuz nasıldı? Geri bildiriminiz bizim için değerli. {{shop}}",
};

// ─── Template interpolation ───────────────────────────────────────────────────
function interpolate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

function formatDateTr(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  return `${d} ${months[m - 1]}`;
}

function buildMessage(event, settings, appt) {
  const tplKey = {
    CREATED:      "tplCreated",
    CONFIRMED:    "tplConfirmed",
    CANCELLED:    "tplCancelled",
    REMINDER_48H: "tplReminder48h",
    REMINDER_3H:  "tplReminder3h",
    FOLLOWUP:     "tplFollowup",
  }[event];

  const tpl = (settings[tplKey] ?? "").trim() || DEFAULTS[event];
  if (!tpl) return null;

  return interpolate(tpl, {
    name:     appt.client.name.split(" ")[0],
    fullName: appt.client.name,
    service:  appt.service.nameTr,
    barber:   appt.barber.nameTr,
    date:     formatDateTr(appt.date),
    time:     appt.time,
    shop:     appt.shop?.name ?? "",
  });
}

// Convert a shop-local wall clock ("YYYY-MM-DD", "HH:MM") into a UTC ms epoch
// using the shop's IANA timezone (defaults to Europe/Istanbul). Survives DST
// transitions in zones that observe them — the previous `h - 3` only worked
// for Turkey, which doesn't observe DST.
function wallClockToUtcMs(date, time, tz) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi]    = time.split(":").map(Number);
  // Naïve UTC interpretation of the wall clock — off by the shop's offset.
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Discover the offset (in ms) that `tz` was at the moment that wall clock
  // is naïvely interpreted as. Then subtract it to get the true UTC instant.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(naiveUtc)).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  const asTzUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second),
  );
  const offsetMs = asTzUtc - naiveUtc;
  return naiveUtc - offsetMs;
}

function getScheduledFor(event, appt, settings) {
  const tz = appt.shop?.timezone || "Europe/Istanbul";
  const apptMs = wallClockToUtcMs(appt.date, appt.time, tz);

  switch (event) {
    case "CREATED":
    case "CONFIRMED":
    case "CANCELLED":
      return new Date(); // immediate

    case "REMINDER_48H": {
      if (!settings.reminder48h) return null;
      const t = new Date(apptMs - 48 * 3600 * 1000);
      return t > new Date() ? t : null; // skip if already past
    }
    case "REMINDER_3H": {
      if (!settings.reminder3h) return null;
      const t = new Date(apptMs - 3 * 3600 * 1000);
      return t > new Date() ? t : null;
    }
    case "FOLLOWUP": {
      if (!settings.followupEnabled) return null;
      return new Date(apptMs + (settings.followupHours ?? 24) * 3600 * 1000);
    }
    default:
      return null;
  }
}

// ─── Queue jobs for an appointment event ─────────────────────────────────────
export async function queueNotifications(appointmentId, event) {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client:  { select: { name: true, phone: true } },
        barber:  { select: { nameTr: true } },
        service: { select: { nameTr: true } },
        shop:    { select: { id: true, name: true, timezone: true } },
      },
    });
    if (!appt) return;

    const settings = await prisma.notificationSettings.findUnique({
      where: { shopId: appt.shopId },
    });
    if (!settings) return;

    const channels = [];
    if (settings.smsEnabled) channels.push("SMS");
    if (settings.waEnabled)  channels.push("WHATSAPP");
    if (!channels.length) return;

    for (const channel of channels) {
      const message      = buildMessage(event, settings, appt);
      const scheduledFor = getScheduledFor(event, appt, settings);
      if (!message || !scheduledFor) continue;

      // Dedup: same (appointment, event, channel) only queues once even if a
      // PATCH replays — keeps customers from getting two "confirmed" SMS.
      const existing = await prisma.notificationJob.findFirst({
        where: { appointmentId, channel, event, status: { in: ["PENDING","PROCESSING","SENT"] } },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.notificationJob.create({
        data: {
          shopId:        appt.shopId,
          appointmentId,
          channel,
          event,
          phone:         appt.client.phone,
          message,
          scheduledFor,
        },
      });
    }
  } catch (err) {
    console.error("[queueNotifications]", event, appointmentId, err.message);
  }
}

// Cancel ALL still-pending jobs for the appointment. Includes CREATED and
// CONFIRMED so a customer who cancels seconds after booking doesn't get a
// "confirmed" SMS that races the cancellation.
export async function cancelPendingJobs(appointmentId) {
  await prisma.notificationJob.updateMany({
    where: { appointmentId, status: "PENDING" },
    data:  { status: "CANCELLED" },
  });
}

// ─── Send via Netgsm ──────────────────────────────────────────────────────────
async function sendSms(phone, message, settings) {
  if (!settings.netgsmUser || !settings.netgsmPassword) {
    throw new Error("Netgsm credentials not configured");
  }
  const params = new URLSearchParams({
    usercode:  settings.netgsmUser,
    password:  settings.netgsmPassword,
    gsmno:     phone,
    message,
    msgheader: settings.netgsmHeader || "MAKAS",
  });
  const res  = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${params}`);
  const text = (await res.text()).trim();
  // Netgsm returns "00 <msgId>" on success; any other prefix is an error
  if (!text.startsWith("00")) throw new Error(`Netgsm SMS error: ${text}`);
}

async function sendWhatsapp(phone, message, settings) {
  if (!settings.netgsmUser || !settings.netgsmPassword) {
    throw new Error("Netgsm credentials not configured");
  }
  const e164 = toE164(phone);
  if (!e164) throw new Error(`Invalid phone for WhatsApp: ${phone}`);
  const res = await fetch("https://api.netgsm.com.tr/whatsapp/send/", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      usercode: settings.netgsmUser,
      password: settings.netgsmPassword,
      gsmno:    e164.slice(1), // Netgsm WA wants 905xxxxxxxxx (no "+")
      message,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.code && data.code !== "00") throw new Error(`Netgsm WA error: ${JSON.stringify(data)}`);
}

// ─── Process a single job ─────────────────────────────────────────────────────
export async function processJob(job) {
  const settings = await prisma.notificationSettings.findUnique({
    where: { shopId: job.shopId },
  });
  if (!settings) throw new Error("Settings not found");

  if (job.channel === "SMS")       await sendSms(job.phone, job.message, settings);
  if (job.channel === "WHATSAPP")  await sendWhatsapp(job.phone, job.message, settings);
}

// ─── Batch processor (called by cron) ────────────────────────────────────────
export async function processQueue(limit = 20) {
  const now = new Date();

  // Fetch pending jobs due for delivery
  const jobs = await prisma.notificationJob.findMany({
    where: {
      status:      "PENDING",
      scheduledFor: { lte: now },
      attempts:    { lt: 3 },
    },
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const job of jobs) {
    // Optimistic lock: only proceed if still PENDING
    const claimed = await prisma.notificationJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data:  { status: "PROCESSING", attempts: { increment: 1 } },
    });
    if (claimed.count === 0) { results.skipped++; continue; }

    try {
      await processJob(job);
      await prisma.notificationJob.update({
        where: { id: job.id },
        data:  { status: "SENT", processedAt: new Date(), lastError: null },
      });
      results.sent++;
    } catch (err) {
      const newAttempts = job.attempts + 1;
      const isFinal = newAttempts >= job.maxAttempts;
      // Exponential back-off: retry after 5min, 15min, give up
      const retryAt = isFinal ? null : new Date(Date.now() + Math.pow(3, newAttempts) * 5 * 60 * 1000);

      await prisma.notificationJob.update({
        where: { id: job.id },
        data:  {
          status:      isFinal ? "FAILED" : "PENDING",
          lastError:   err.message,
          processedAt: isFinal ? new Date() : undefined,
          ...(retryAt && { scheduledFor: retryAt }),
        },
      });
      results.failed++;
      console.error("[processQueue] job failed", job.id, err.message);
    }
  }

  return results;
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

// Istanbul is UTC+3. Convert local appointment time to UTC for calendar files.
function toUtcDate(dateStr, timeStr, offsetHours = 3) {
  const [y, mo, d]   = dateStr.split("-").map(Number);
  const [h, mi]      = timeStr.split(":").map(Number);
  const utcMs        = Date.UTC(y, mo - 1, d, h - offsetHours, mi, 0);
  return new Date(utcMs);
}

function fmtUtc(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// ─── Google Calendar URL ──────────────────────────────────────────────────────

export function googleCalendarUrl({ title, description, location, dateStr, timeStr, durationMin }) {
  const start = toUtcDate(dateStr, timeStr);
  const end   = new Date(start.getTime() + durationMin * 60 * 1000);

  const params = new URLSearchParams({
    action:   "TEMPLATE",
    text:     title,
    dates:    `${fmtUtc(start)}/${fmtUtc(end)}`,
    details:  description,
    location: location ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

// ─── ICS file content ─────────────────────────────────────────────────────────

// Escape ICS text values (RFC 5545)
function escIcs(str) {
  return String(str ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g,  "\\;")
    .replace(/,/g,  "\\,")
    .replace(/\n/g, "\\n");
}

// Fold long lines at 75 octets (RFC 5545 §3.1)
function foldLine(line) {
  const bytes = [];
  let col = 0;
  for (const char of line) {
    const enc = encodeURIComponent(char).length === 1 ? 1 : char.length > 1 ? 3 : 1;
    if (col + enc > 75) { bytes.push("\r\n "); col = 1; }
    bytes.push(char);
    col += enc;
  }
  return bytes.join("");
}

export function generateIcs({ uid, title, description, location, dateStr, timeStr, durationMin, now = new Date() }) {
  const start = toUtcDate(dateStr, timeStr);
  const end   = new Date(start.getTime() + durationMin * 60 * 1000);
  const stamp = fmtUtc(now);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Makas Kuafor//Randevu//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@makas`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${fmtUtc(start)}`,
    `DTEND:${fmtUtc(end)}`,
    foldLine(`SUMMARY:${escIcs(title)}`),
    foldLine(`DESCRIPTION:${escIcs(description)}`),
    foldLine(`LOCATION:${escIcs(location)}`),
    // 48-hour reminder
    "BEGIN:VALARM",
    "TRIGGER:-PT48H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Randevu Hatırlatması (48 saat)",
    "END:VALARM",
    // 3-hour reminder
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Randevu Hatırlatması (3 saat)",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

// ─── Build calendar data from a full appointment record ───────────────────────

export function appointmentCalendarData(appt) {
  const shop        = appt.shop ?? {};
  const serviceName = appt.service?.nameTr ?? appt.service ?? "";
  const barberName  = appt.barber?.nameTr  ?? appt.barber  ?? "";
  const barberPhone = appt.barber?.phone    ?? null;
  const shopName    = shop.name  ?? "Makas Kuaför";
  const shopAddress = shop.address ?? "";
  const shopPhone   = shop.phone   ?? "";

  const title       = `${serviceName} — ${appt.client?.name ?? ""}`.trimEnd().replace(/—\s*$/, "").trim() || `${serviceName} — ${barberName}`;
  const locationStr = [shopName, shopAddress].filter(Boolean).join(", ");

  const descParts = [
    `Berber: ${barberName}`,
    barberPhone && `Berber Tel: +90${barberPhone}`,
    `Hizmet: ${serviceName}`,
    `Tarih: ${appt.date} ${appt.time}`,
    shopAddress && `Adres: ${shopAddress}`,
    shopPhone   && `Salon Tel: ${shopPhone}`,
    appt.notes  && `Not: ${appt.notes}`,
  ].filter(Boolean);

  return {
    title,
    description: descParts.join("\n"),
    location:    locationStr,
    dateStr:     appt.date,
    timeStr:     appt.time,
    durationMin: appt.duration ?? 30,
    uid:         appt.id,
  };
}

/**
 * WhatsApp template message builders.
 *
 * Templates must be pre-approved in Meta Business Manager before use.
 * Each function returns { name, languageCode, components } ready for sender.sendTemplate().
 *
 * Suggested template registrations (register these in Meta Business Manager):
 *
 *   makas_appointment_confirmation (tr)
 *     "Randevunuz onaylandı! 💈\n{{1}} ile {{2}} hizmeti\n📅 {{3}} — ⏰ {{4}}"
 *
 *   makas_appointment_reminder (tr)
 *     "Randevu hatırlatması! 💈\n{{1}} tarihinde saat {{2}} — {{3}} — {{4}}"
 *
 *   makas_appointment_cancelled (tr)
 *     "Randevunuz iptal edildi.\n{{1}} — {{2}} — {{3}}"
 *
 *   makas_welcome (tr)
 *     "Merhaba {{1}}! MAKAS AI'ya hoş geldiniz. Size nasıl yardımcı olabilirim?"
 */

/**
 * Appointment confirmation — sent right after CreateAppointment succeeds.
 *
 * @param {{ barberName, serviceName, date, time }} appt
 * @returns {{ name, languageCode, components }}
 */
export function appointmentConfirmation(appt) {
  return {
    name:         "makas_appointment_confirmation",
    languageCode: "tr",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: appt.barberName },
          { type: "text", text: appt.serviceName },
          { type: "text", text: formatDate(appt.date) },
          { type: "text", text: appt.time },
        ],
      },
    ],
  };
}

/**
 * Appointment reminder — sent 24h or 3h before the appointment.
 *
 * @param {{ barberName, serviceName, date, time }} appt
 */
export function appointmentReminder(appt) {
  return {
    name:         "makas_appointment_reminder",
    languageCode: "tr",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: formatDate(appt.date) },
          { type: "text", text: appt.time },
          { type: "text", text: appt.barberName },
          { type: "text", text: appt.serviceName },
        ],
      },
    ],
  };
}

/**
 * Appointment cancellation notice.
 *
 * @param {{ barberName, date, time }} appt
 */
export function appointmentCancelled(appt) {
  return {
    name:         "makas_appointment_cancelled",
    languageCode: "tr",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: appt.barberName },
          { type: "text", text: formatDate(appt.date) },
          { type: "text", text: appt.time },
        ],
      },
    ],
  };
}

/**
 * Welcome message sent to a first-time customer.
 * Note: 24-hour messaging window rule — use templates outside the window.
 *
 * @param {string} customerName
 */
export function welcome(customerName) {
  return {
    name:         "makas_welcome",
    languageCode: "tr",
    components: [
      {
        type: "body",
        parameters: [{ type: "text", text: customerName }],
      },
    ],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

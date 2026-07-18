/**
 * Deterministic post-generation review. Runs before the reply is sent.
 *
 * Two checks:
 * 1. Internal ID leakage — bracketed cuids/appointment IDs → stripped in place.
 * 2. Hallucinated booking confirmation — reply claims a booking was created
 *    but no successful CreateAppointment tool call happened → caller should
 *    regenerate once with the corrective note.
 *
 * Never exposed to the customer.
 */

const ID_LEAK    = /\s*\[(?:ID:?\s*)?c[a-z0-9]{20,}\]/gi;
const BOOKED_CLAIM =
  /randevunuz\s+(oluşturuldu|onaylandı|alındı|tamam)|randevunu(?:zu)?\s+(aldım|oluşturdum|ayarladım)|appointment\s+is\s+(confirmed|booked|set)|randevunuz\s+hazır/i;

export const REGEN_NOTE =
  "İÇ KONTROL: Önceki taslakta randevu oluşturulduğu iddia edildi ama CreateAppointment başarıyla çağrılmadı. " +
  "Randevu onaylandı DEME. Eksik bilgiyi sor veya gerekli aracı çağırarak randevuyu gerçekten oluştur.";

/**
 * @param {string} text — final AI reply
 * @param {Array<{name: string, ok: boolean}>} toolLog — tools called this request
 * @returns {{ ok: boolean, text: string, reason?: string }}
 */
export function reviewReply(text, toolLog = []) {
  if (!text) return { ok: true, text };

  const cleaned = text.replace(ID_LEAK, "");

  const bookingSucceeded = toolLog.some(t => t.name === "CreateAppointment" && t.ok);
  if (BOOKED_CLAIM.test(cleaned) && !bookingSucceeded) {
    return { ok: false, text: cleaned, reason: "booking claim without successful CreateAppointment" };
  }

  return { ok: true, text: cleaned };
}

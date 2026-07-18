/**
 * Lightweight Turkish/English intent classifier.
 * Keyword/regex based — no AI call, no latency, runs synchronously.
 *
 * Used to:
 * 1. Skip loading customer context for intents that don't need it
 * 2. Trim the dynamic context injected into the system prompt (token savings)
 * 3. Score KB entries for relevance (already in KnowledgeService)
 */

// Ordered: first match wins. More specific patterns first.
const PATTERNS = [
  ["CANCELLATION", /iptal|randevu(m(u|a|yu)?|nun)?\s*(iptal|kaldır|sil)|cancel/i],
  ["BOOKING",      /randevu\w*\s*(al|almak|oluştur|yap|istiyorum)|book(?:ing)?|rezerv|slot\s*(var\s*mı|ayırt)/i],
  // AVAILABILITY before HOURS so "saat var mı" doesn't fall into HOURS
  ["AVAILABILITY", /müsait|(boş|dolu)\s*(saat|gün)|ne\s+zaman\s*(müsait|boş)|(bugün|yarın|bu\s*hafta)\s*(müsait|boş|var\s*mı)|saat\s*var\s*mı|yer\s*var\s*mı/i],
  // \byorum — bare /yorum/ matched inside "istiyorum" and misclassified booking messages
  ["REVIEWS",      /\byorum|\bpuan|değerlendirme|review|rating|kaç\s+yıldız|nasıl\s+(bir\s+)?(berber|yer|salon)/i],
  ["BARBERS",      /berber|usta|stilist|kim\s*(yapıyor|kesiyor|çalışıyor|var\b)|hangi\s+berber|kimler\s*(var|çalışıyor|kesiyor)/i],
  ["SERVICES",     /hizmet|saç\s+kesim|kesim|tıraş|sakal|kaş|cilt\s+bakım|boyama|fiyat|ne\s+kadar|kaç\s*(lira|tl|₺)|ücret|paket|neler\s*(var|yapıyorsunuz)|kaç\s+dakika/i],
  // bare "saat" removed — too broad, causes false positives on availability questions
  ["HOURS",        /çalışma\s*saati|kaçta\b|ne\s+zaman\s*(açık|kapalı|kapanıyor|açılıyor)|bugün\s*(açık|kapalı\b)|hangi\s+gün.*açık|pazar\s*(günü|tatil)?|hafta\s*sonu.*açık|mesai|açılış|kapanış/i],
  ["LOCATION",     /adres|nerede\b|konum|yol\s+tarifi|harita|maps|nereye\s+(gid|ulaş)|sokak|cadde/i],
  ["PAYMENT",      /ödeme|nakit|kart|kredi|banka\s+kart|iyzico|eft|havale/i],
  ["GREETING",     /^(merhaba|selam|iyi\s+\w+|hello|hi\b|hey\b|günaydın|iyi\s+akşam|kolay\s+gelsin)/i],
  ["SMALL_TALK",   /nasıl(sın|sınız)?|ne\s+(haber|var)|naber\b|iyi\s+misin/i],
];

export function detectIntent(message) {
  if (!message) return "GENERAL";
  for (const [intent, pattern] of PATTERNS) {
    if (pattern.test(message)) return intent;
  }
  return "GENERAL";
}

// These intents don't benefit from customer appointment history
export const SKIP_CUSTOMER_CONTEXT = new Set([
  "GREETING", "SMALL_TALK", "LOCATION", "HOURS", "PAYMENT", "REVIEWS",
]);

/**
 * Dynamic context sections needed per intent.
 * null = inject all sections (safe default for booking/complex flows).
 */
const SECTION_FILTER = {
  GREETING:     ["shopInfo"],
  SMALL_TALK:   ["shopInfo"],
  LOCATION:     ["shopInfo"],
  PAYMENT:      ["shopInfo", "payment"],
  HOURS:        ["shopInfo", "workingHours", "holidays"],
  SERVICES:     ["shopInfo", "services", "payment"],
  BARBERS:      ["shopInfo", "barbers", "reviews"],
  REVIEWS:      ["shopInfo", "barbers", "reviews"],
  BOOKING:      null,
  AVAILABILITY: null,
  CANCELLATION: ["shopInfo"],
  GENERAL:      null,
};

/**
 * Filter a dynamic context object to only include sections needed for the intent.
 * Returns the original context unchanged when all sections are needed (null filter).
 */
export function filterDynamicContext(dc, intent) {
  const allowed = SECTION_FILTER[intent] ?? null;
  if (!dc || !allowed) return dc;
  const filteredSections = {};
  for (const key of allowed) {
    if (dc.sections[key]) filteredSections[key] = dc.sections[key];
  }
  return { sections: filteredSections, raw: dc.raw };
}

/**
 * KB sections needed per intent. null = all sections.
 * Keeps policies for booking-ish flows, campaigns for pricing, drops KB
 * entirely for location/greeting-style questions.
 */
const KB_FILTER = {
  GREETING:     [],
  SMALL_TALK:   [],
  LOCATION:     [],
  HOURS:        ["workingHours"],
  PAYMENT:      ["policies"],
  SERVICES:     ["campaigns", "other"],
  BARBERS:      [],
  REVIEWS:      [],
  BOOKING:      null,
  AVAILABILITY: null,
  CANCELLATION: ["policies"],
  GENERAL:      null,
};

export function filterKnowledgeSections(ks, intent) {
  const allowed = KB_FILTER[intent] ?? null;
  if (!ks || !allowed) return ks;
  const out = {};
  for (const key of allowed) {
    if (ks[key]) out[key] = ks[key];
  }
  if (ks.count != null) out.count = ks.count;
  return out;
}

/**
 * Dynamic tool registry: only expose tools relevant to the intent.
 * Info intents get NO tools — services, barbers, hours, reviews, payment
 * are already injected into the prompt context, so tool calls for them are
 * pure waste. Catalog lookup tools are never exposed (context replaces them).
 */
const BOOKING_TOOLS = [
  "FindAvailableSlots", "GetAvailability", "CreateAppointment",
  "RescheduleAppointment", "CancelAppointment", "FindCustomer", "CreateCustomer",
];
const TOOL_FILTER = {
  GREETING:     [],
  SMALL_TALK:   [],
  LOCATION:     [],
  HOURS:        [],
  PAYMENT:      [],
  SERVICES:     [],
  BARBERS:      [],
  REVIEWS:      [],
  BOOKING:      BOOKING_TOOLS,
  AVAILABILITY: BOOKING_TOOLS,
  CANCELLATION: ["FindCustomer", "CancelAppointment", "RescheduleAppointment", "GetAvailability", "FindAvailableSlots"],
  GENERAL:      BOOKING_TOOLS,
};

export function toolsForIntent(allTools, intent) {
  const allowed = TOOL_FILTER[intent];
  if (!allowed) return allTools;
  if (!allowed.length) return [];
  const set = new Set(allowed);
  return allTools.filter(t => set.has(t.name));
}

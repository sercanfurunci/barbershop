/**
 * Dynamic AI context builder.
 *
 * Pulls all "known" salon data (services, barbers, working hours, holidays,
 * shop info, payment methods) directly from the DB and formats it as
 * structured sections for the AI system prompt.
 *
 * The idea: shop owners shouldn't have to re-enter this data as manual KB
 * entries. Everything already in the admin is automatically visible to the AI.
 *
 * Manual KB entries (KnowledgeService.getKnowledgeSections) are for AI-only
 * extras (special campaigns, FAQ, custom policies) that aren't captured in
 * structured schema.
 */

import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/ai/cache";

// ponytail: 60s — scheduling data is operational; stale hours = wrong AI answers
const CACHE_TTL = 60_000;

const DAY_LABELS = {
  mon: "Pazartesi",
  tue: "Salı",
  wed: "Çarşamba",
  thu: "Perşembe",
  fri: "Cuma",
  sat: "Cumartesi",
  sun: "Pazar",
};
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function minToHM(m) {
  if (m == null) return null;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function todayYMD() {
  return new Date().toISOString().slice(0, 10);
}

function plus30YMD() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

/**
 * Build the dynamic context for a shop.
 * Returns { sections: {...}, raw: {...} } — sections are formatted text
 * blocks ready to inject; raw is the underlying data (used for the KB display page).
 */
export async function buildDynamicContext(shopId) {
  const key = `dynctx:${shopId}`;
  const cached = cacheGet(key);
  if (cached !== null) return cached;

  const [shop, services, barbers, holidays, recentReviews] = await Promise.all([
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true, name: true, address: true, phone: true, whatsappNumber: true,
        instagramUrl: true, facebookUrl: true, tiktokUrl: true, website: true,
        wifi: true, parking: true, creditCard: true, airConditioning: true,
        disabledAccess: true, childFriendly: true,
        about: true, description: true, avgRating: true, totalReviews: true,
        timezone: true, currency: true,
      },
    }),
    prisma.service.findMany({
      where: { shopId, active: true },
      select: {
        id: true, nameTr: true, descTr: true,
        duration: true, price: true, category: true, popular: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.barber.findMany({
      where: { shopId, available: true },
      select: {
        id: true, nameTr: true, titleTr: true, bioTr: true, yearsExp: true,
        specialties: true, rating: true, reviewCount: true, phone: true,
        workingHours: true,
        breaks: {
          select: { start: true, end: true, label: true, dayOfWeek: true, date: true },
        },
        services: {
          select: { service: { select: { id: true, nameTr: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.holiday.findMany({
      where: {
        shopId,
        date: { gte: todayYMD(), lte: plus30YMD() },
      },
      select: {
        date: true, label: true, barberId: true,
        barber: { select: { nameTr: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.review.findMany({
      where:   { shopId, comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take:    30,
      select:  { barberId: true, barberRating: true, comment: true },
    }),
  ]);

  if (!shop) {
    const empty = { sections: {}, raw: { shop: null, services: [], barbers: [], holidays: [] } };
    cacheSet(key, empty, CACHE_TTL);
    return empty;
  }

  const sections = {
    shopInfo:     _formatShopInfo(shop),
    services:     _formatServices(services),
    barbers:      _formatBarbers(barbers),
    workingHours: _formatWorkingHours(barbers),
    holidays:     _formatHolidays(holidays),
    payment:      _formatPayment(shop),
    reviews:      _formatReviews(barbers, recentReviews),
  };

  const result = {
    sections,
    raw: { shop, services, barbers, holidays, recentReviews },
  };

  cacheSet(key, result, CACHE_TTL);
  return result;
}

// ── Formatters ──────────────────────────────────────────────────────────────

function _formatShopInfo(shop) {
  const lines = ["SALON BİLGİSİ:"];
  lines.push(`- Salon adı: ${shop.name}`);
  if (shop.address)         lines.push(`- Adres: ${shop.address}`);
  if (shop.phone)           lines.push(`- Telefon: ${shop.phone}`);
  if (shop.whatsappNumber)  lines.push(`- WhatsApp: ${shop.whatsappNumber}`);
  if (shop.instagramUrl)    lines.push(`- Instagram: ${shop.instagramUrl}`);
  if (shop.facebookUrl)     lines.push(`- Facebook: ${shop.facebookUrl}`);
  if (shop.tiktokUrl)       lines.push(`- TikTok: ${shop.tiktokUrl}`);
  if (shop.website)         lines.push(`- Web sitesi: ${shop.website}`);

  const amenities = [];
  if (shop.wifi)            amenities.push("Wi-Fi");
  if (shop.parking)         amenities.push("Otopark");
  if (shop.airConditioning) amenities.push("Klima");
  if (shop.disabledAccess)  amenities.push("Engelli erişimi");
  if (shop.childFriendly)   amenities.push("Çocuk dostu");
  if (amenities.length)     lines.push(`- Olanaklar: ${amenities.join(", ")}`);

  return lines.join("\n");
}

function _formatServices(services) {
  if (!services.length) return "";
  const lines = ["HİZMETLER VE FİYATLAR:"];
  for (const s of services) {
    const price = s.price != null ? `₺${s.price}` : "Fiyat sorulur";
    lines.push(`- [${s.id}] ${s.nameTr} — ${s.duration} dk — ${price}${s.descTr ? ` (${s.descTr})` : ""}`);
  }
  return lines.join("\n");
}

function _formatBarbers(barbers) {
  if (!barbers.length) return "";
  const lines = ["BERBERLER:"];
  for (const b of barbers) {
    const specs = b.specialties?.length ? ` — Uzmanlık: ${b.specialties.join(", ")}` : "";
    const exp   = b.yearsExp ? ` — ${b.yearsExp} yıl deneyim` : "";
    lines.push(`- [${b.id}] ${b.nameTr} (${b.titleTr})${specs}${exp}`);
    if (b.bioTr)  lines.push(`  Hakkında: ${b.bioTr}`);
    // Phone: only included if admin explicitly configured it; AI must not volunteer this unprompted
    if (b.phone)  lines.push(`  Doğrudan iletişim: +90${b.phone}`);
  }
  return lines.join("\n");
}

function _formatWorkingHours(barbers) {
  if (!barbers.length) return "";
  const lines = ["ÇALIŞMA SAATLERİ:"];
  for (const b of barbers) {
    const wh = b.workingHours;
    if (!wh) { lines.push(`- ${b.nameTr}: Çalışma saati tanımlanmamış`); continue; }
    lines.push(`- ${b.nameTr}:`);
    for (const dk of DAY_ORDER) {
      const start = minToHM(wh[`${dk}Start`]);
      const end   = minToHM(wh[`${dk}End`]);
      const label = DAY_LABELS[dk];
      if (start && end) lines.push(`  ${label}: ${start}-${end}`);
      else              lines.push(`  ${label}: Kapalı`);
    }
    // Recurring breaks (dayOfWeek set) — one-off/date-scoped are ignored here
    const recurring = (b.breaks ?? []).filter(br => br.dayOfWeek != null && !br.date);
    if (recurring.length) {
      lines.push(`  Molalar:`);
      for (const br of recurring) {
        const dayName = DAY_LABELS[DAY_ORDER[(br.dayOfWeek + 6) % 7]] ?? "Her gün";
        lines.push(`  - ${dayName} ${br.start}-${br.end} (${br.label})`);
      }
    }
  }
  return lines.join("\n");
}

function _formatHolidays(holidays) {
  if (!holidays.length) return "";
  const lines = ["YAKLAŞAN TATİLLER (30 gün içinde):"];
  for (const h of holidays) {
    const scope = h.barberId ? `${h.barber?.nameTr ?? "Bir berber"} — ` : "TÜM SALON — ";
    lines.push(`- ${h.date}: ${scope}${h.label}`);
  }
  return lines.join("\n");
}

function _formatPayment(shop) {
  const lines = ["ÖDEME YÖNTEMLERİ:"];
  lines.push("- Nakit (her zaman kabul edilir)");
  if (shop.creditCard) lines.push("- Kredi/Banka kartı");
  return lines.join("\n");
}

function _formatReviews(barbers, reviews) {
  const withReviews = barbers.filter(b => b.reviewCount > 0);
  if (!withReviews.length) return "";

  // Group recent comments by barberId
  const commentsByBarber = {};
  for (const r of reviews) {
    if (!commentsByBarber[r.barberId]) commentsByBarber[r.barberId] = [];
    commentsByBarber[r.barberId].push(r);
  }

  const lines = ["MÜŞTERİ DEĞERLENDİRMELERİ:"];
  for (const b of withReviews) {
    const rating = b.rating != null ? b.rating.toFixed(1) : "?";
    const stars  = "★".repeat(Math.round(b.rating ?? 0)) + "☆".repeat(5 - Math.round(b.rating ?? 0));
    lines.push(`- ${b.nameTr}: ${stars} ${rating}/5 (${b.reviewCount} değerlendirme)`);
    const comments = commentsByBarber[b.id] ?? [];
    for (const r of comments.slice(0, 3)) {
      const snippet = r.comment.length > 120 ? r.comment.slice(0, 120) + "…" : r.comment;
      lines.push(`  • "${snippet}"`);
    }
  }
  lines.push('Müşteri yorumları sormak isterse: "Tüm değerlendirmeleri Değerlendirmeler sayfasında görebilirsiniz."');
  return lines.join("\n");
}

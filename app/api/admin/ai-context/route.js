import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { buildDynamicContext } from "@/lib/ai/dynamicContext";
import { cacheGet } from "@/lib/ai/cache";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function getShopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/ai-context
// Returns the full dynamic AI context for the shop: sections, raw data, warnings, summary counts.
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = getShopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  try {
    const cached = cacheGet(`dynctx:${sid}`) !== null;
    const [ctx, kbEntries, rulesCount, settings] = await Promise.all([
      buildDynamicContext(sid),
      // Same cap as the prompt injection path (getKnowledgeSections take: 60)
      prisma.knowledgeEntry.findMany({
        where:  { shopId: sid, enabled: true },
        select: { category: true, title: true, content: true },
        take:   60,
      }),
      prisma.aiRule.count({ where: { shopId: sid, enabled: true } }),
      prisma.shopAISettings.findUnique({ where: { shopId: sid } }),
    ]);

    const raw = ctx.raw;
    const warnings = _buildWarnings(raw, settings, kbEntries);

    return ok({
      sections: ctx.sections,
      raw,
      warnings,
      cached, // true → served from the same 60s cache the AI reads
      counts: {
        services:  raw.services?.length  ?? 0,
        barbers:   raw.barbers?.length   ?? 0,
        holidays:  raw.holidays?.length  ?? 0,
        knowledge: kbEntries.length,
        rules:     rulesCount,
      },
      estimatedTokens: _estimateTokens(ctx.sections, kbEntries),
    });
  } catch (e) {
    return err(e.message, 500);
  }
});

function _buildWarnings(raw, settings, kbEntries = []) {
  const warnings = [];
  const shop = raw.shop;

  if (!shop?.phone)           warnings.push({ key: "phone",       message: "Salon telefon numarası eksik.", tab: "settings", stab: "profile" });
  if (!shop?.address)         warnings.push({ key: "address",     message: "Salon adresi eksik.", tab: "settings", stab: "profile" });
  if (!shop?.about)           warnings.push({ key: "about",       message: "Salon hakkında bölümü boş.", tab: "settings", stab: "profile" });
  if (!shop?.instagramUrl)    warnings.push({ key: "instagram",   message: "Instagram hesabı tanımlanmamış.", tab: "settings", stab: "profile" });
  if (!shop?.creditCard)      warnings.push({ key: "payment",     message: "Ödeme yöntemleri tanımlanmamış. Sadece nakit kabul ediliyor olarak görünüyor.", tab: "settings", stab: "profile" });

  if (!raw.services?.length)  warnings.push({ key: "services",   message: "Hizmet tanımlanmamış. AI müşterilere hizmet listesi sunamaz.", tab: "services-mgmt", stab: null });
  if (!raw.barbers?.length)   warnings.push({ key: "barbers",    message: "Berber tanımlanmamış. AI berber yönlendirmesi yapamaz.", tab: "barbers", stab: null });

  const unpriced = (raw.services ?? []).filter(s => s.price == null || s.price === 0);
  if (unpriced.length) {
    warnings.push({ key: "prices", message: `${unpriced.length} hizmetin fiyatı tanımlanmamış. AI bu hizmetler için fiyat veremez.`, tab: "services-mgmt", stab: null });
  }

  const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  for (const b of raw.barbers ?? []) {
    if (!b.bioTr) warnings.push({ key: `bio_${b.id}`, message: `"${b.nameTr}" adlı bağlayıcının biyografisi boş.`, tab: "barbers", stab: null });
    if (!b.workingHours) {
      warnings.push({ key: `hours_${b.id}`, message: `"${b.nameTr}" adlı berberin çalışma saatleri tanımlanmamış.`, tab: "settings", stab: "hours" });
    } else if (DAYS.every(d => b.workingHours[`${d}Start`] == null)) {
      warnings.push({ key: `hours_closed_${b.id}`, message: `"${b.nameTr}" adlı berberin tüm günleri kapalı görünüyor — AI hiçbir gün randevu veremez.`, tab: "settings", stab: "hours" });
    }
  }

  if (!settings?.greeting)    warnings.push({ key: "greeting",   message: "AI karşılama mesajı tanımlanmamış.", tab: "ai-platform", stab: null });

  if (!kbEntries.some(e => e.category === "POLICY")) {
    warnings.push({ key: "policy", message: "İptal/randevu politikası bilgi bankasında tanımlanmamış. AI politika sorularında tahmin yapamaz, salonu aramaya yönlendirir.", tab: "ai-platform", stab: null });
  }

  return warnings;
}

function _estimateTokens(sections, kbEntries) {
  const ctxChars = Object.values(sections).filter(Boolean).join(" ").length;
  const kbChars  = kbEntries.reduce((n, e) => n + e.title.length + e.content.length + 2, 0);
  // ponytail: chars/3.5 approximates Anthropic tokenization of Turkish (multi-byte
  // chars tokenize denser than English); a real tokenizer isn't worth the dependency
  return Math.ceil((ctxChars + kbChars) / 3.5);
}

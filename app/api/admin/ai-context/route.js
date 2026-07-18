import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { buildDynamicContext } from "@/lib/ai/dynamicContext";
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
    const [ctx, kbCount, rulesCount, settings] = await Promise.all([
      buildDynamicContext(sid),
      prisma.knowledgeEntry.count({ where: { shopId: sid, enabled: true } }),
      prisma.aiRule.count({ where: { shopId: sid, enabled: true } }),
      prisma.shopAISettings.findUnique({ where: { shopId: sid } }),
    ]);

    const raw = ctx.raw;
    const warnings = _buildWarnings(raw, settings);

    return ok({
      sections: ctx.sections,
      raw,
      warnings,
      counts: {
        services:  raw.services?.length  ?? 0,
        barbers:   raw.barbers?.length   ?? 0,
        holidays:  raw.holidays?.length  ?? 0,
        knowledge: kbCount,
        rules:     rulesCount,
      },
      estimatedTokens: _estimateTokens(ctx.sections, kbCount),
    });
  } catch (e) {
    return err(e.message, 500);
  }
});

function _buildWarnings(raw, settings) {
  const warnings = [];
  const shop = raw.shop;

  if (!shop?.phone)           warnings.push({ key: "phone",       message: "Salon telefon numarası eksik.", tab: "settings", stab: "profile" });
  if (!shop?.address)         warnings.push({ key: "address",     message: "Salon adresi eksik.", tab: "settings", stab: "profile" });
  if (!shop?.about)           warnings.push({ key: "about",       message: "Salon hakkında bölümü boş.", tab: "settings", stab: "profile" });
  if (!shop?.instagramUrl)    warnings.push({ key: "instagram",   message: "Instagram hesabı tanımlanmamış.", tab: "settings", stab: "profile" });
  if (!shop?.creditCard)      warnings.push({ key: "payment",     message: "Ödeme yöntemleri tanımlanmamış. Sadece nakit kabul ediliyor olarak görünüyor.", tab: "settings", stab: "profile" });

  if (!raw.services?.length)  warnings.push({ key: "services",   message: "Hizmet tanımlanmamış. AI müşterilere hizmet listesi sunamaz.", tab: "services-mgmt", stab: null });
  if (!raw.barbers?.length)   warnings.push({ key: "barbers",    message: "Berber tanımlanmamış. AI berber yönlendirmesi yapamaz.", tab: "barbers", stab: null });

  for (const b of raw.barbers ?? []) {
    if (!b.bioTr) warnings.push({ key: `bio_${b.id}`, message: `"${b.nameTr}" adlı bağlayıcının biyografisi boş.`, tab: "barbers", stab: null });
    if (!b.workingHours) warnings.push({ key: `hours_${b.id}`, message: `"${b.nameTr}" adlı berberin çalışma saatleri tanımlanmamış.`, tab: "settings", stab: "hours" });
  }

  if (!settings?.greeting)    warnings.push({ key: "greeting",   message: "AI karşılama mesajı tanımlanmamış.", tab: "ai-platform", stab: null });

  return warnings;
}

function _estimateTokens(sections, kbCount) {
  const text = Object.values(sections).filter(Boolean).join(" ");
  return Math.ceil(text.length / 4) + kbCount * 60; // rough estimate
}

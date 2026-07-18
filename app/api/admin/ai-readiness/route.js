import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { getShopAISettings } from "@/lib/services/ShopAISettingsService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/ai-readiness — 0-100 readiness score
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  try {
    const [shop, settings, servicesCount, barbers, workingHoursCount, kbCount, rulesCount] = await Promise.all([
      prisma.shop.findUnique({
        where: { id: sid },
        select: { aiChatEnabled: true },
      }),
      getShopAISettings(sid),
      prisma.service.count({ where: { shopId: sid, active: true } }),
      prisma.barber.findMany({
        where: { shopId: sid, available: true },
        select: { id: true, bioTr: true },
      }),
      prisma.workingHours.count({ where: { barber: { shopId: sid } } }),
      prisma.knowledgeEntry.count({ where: { shopId: sid, enabled: true } }),
      prisma.aiRule.count({ where: { shopId: sid, enabled: true } }),
    ]);

    const barbersCount = barbers.length;
    const barbersWithBios = barbers.filter(b => b.bioTr && b.bioTr.trim().length > 20).length;
    const biosOk = barbersCount > 0 && barbersWithBios / barbersCount >= 0.5;

    // KB scoring: max 15 points when >= 10 entries
    const kbPoints = kbCount >= 10 ? 15 : Math.round((kbCount / 10) * 15);

    const checks = [
      { key: "ai_enabled",  label: "AI Chat aktif",             passed: !!shop?.aiChatEnabled,      max: 10, tip: "AI Chat'i AI Ayarları > Kişilik sekmesinden aktifleştirin" },
      { key: "services",    label: "Aktif hizmetler",           passed: servicesCount > 0,          max: 15, tip: "En az bir aktif hizmet ekleyin" },
      { key: "barbers",     label: "Aktif berberler",           passed: barbersCount > 0,           max: 15, tip: "En az bir aktif berber ekleyin" },
      { key: "bios",        label: "Berber biyografileri",      passed: biosOk,                     max: 10, tip: "Berber biyografilerini doldurun (min. 20 karakter)" },
      { key: "hours",       label: "Çalışma saatleri",          passed: workingHoursCount > 0,      max: 10, tip: "Berberler için çalışma saatlerini tanımlayın" },
      { key: "knowledge",   label: "Bilgi bankası girişleri",   passed: kbCount > 0,                max: 15, tip: "Bilgi bankasına ek girişler ekleyin (SSS, politika, vs.)" },
      { key: "rules",       label: "Özel kurallar",             passed: rulesCount > 0,             max: 10, tip: "AI için özel davranış kuralları tanımlayın" },
      { key: "greeting",    label: "Karşılama mesajı",          passed: !!settings.greeting,        max: 5,  tip: "AI Ayarları'nda bir karşılama mesajı yazın" },
      { key: "closing",     label: "Kapanış mesajı",            passed: !!settings.closing,         max: 5,  tip: "AI Ayarları'nda bir kapanış mesajı yazın" },
      { key: "provider",    label: "Sağlayıcı yapılandırıldı",  passed: !!settings.provider,        max: 5,  tip: "AI sağlayıcısını seçin" },
    ];

    let score = 0;
    for (const c of checks) {
      if (c.key === "knowledge") {
        c.points = c.passed ? kbPoints : 0;
      } else {
        c.points = c.passed ? c.max : 0;
      }
      score += c.points;
    }

    return ok({ score, checks });
  } catch (e) {
    return err(e.message, 500);
  }
});

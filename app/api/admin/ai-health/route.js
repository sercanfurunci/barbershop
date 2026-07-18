import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { ai as aiConfig } from "@/lib/config";
import { getShopAISettings, resolveModel } from "@/lib/services/ShopAISettingsService";
import { countEnabledEntries } from "@/lib/services/KnowledgeService";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/ai-health — provider + today's usage + last error
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  try {
    const settings = await getShopAISettings(sid);
    const model    = resolveModel(settings);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [todayLogs, monthLogs, lastError, kbCount, rulesCount] = await Promise.all([
      prisma.aiUsageLog.findMany({
        where:  { shopId: sid, createdAt: { gte: startOfToday } },
        select: {
          totalTokens: true, estimatedCostUsd: true,
          latencyMs: true, success: true,
          inputTokens: true, cacheReadTokens: true,
        },
        orderBy: { createdAt: "desc" },
        take: 2000,
      }),
      prisma.aiUsageLog.aggregate({
        where: { shopId: sid, createdAt: { gte: startOfMonth } },
        _sum: { estimatedCostUsd: true, totalTokens: true },
      }),
      prisma.aiUsageLog.findFirst({
        where: { shopId: sid, success: false, error: { not: null } },
        select: { error: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      countEnabledEntries(sid),
      prisma.aiRule.count({ where: { shopId: sid, enabled: true } }),
    ]);

    let todayLatency = 0, todayTokens = 0, todayCost = 0, todayErrors = 0;
    let todayInput = 0, todayCacheRead = 0;
    for (const l of todayLogs) {
      todayLatency   += l.latencyMs ?? 0;
      todayTokens    += l.totalTokens ?? 0;
      todayCost      += l.estimatedCostUsd ?? 0;
      todayInput     += l.inputTokens ?? 0;
      todayCacheRead += l.cacheReadTokens ?? 0;
      if (!l.success) todayErrors += 1;
    }
    const requests = todayLogs.length;
    const promptable   = todayInput + todayCacheRead;
    const cacheHitRate = promptable ? +(todayCacheRead / promptable).toFixed(4) : null;

    // Simple status heuristic: has an error in the last hour → degraded
    let status = "ok";
    if (lastError && (Date.now() - lastError.createdAt.getTime()) < 60 * 60_000) {
      status = "degraded";
    }
    if (todayErrors > 0 && requests > 0 && todayErrors / requests > 0.5) {
      status = "error";
    }

    return ok({
      provider: settings.provider,
      model,
      status,
      apiKeyConfigured: Boolean(aiConfig.anthropicKey),
      lastError: lastError ? { message: lastError.error, createdAt: lastError.createdAt } : null,
      today: {
        requests,
        tokens:       todayTokens,
        costUsd:      +todayCost.toFixed(6),
        avgLatencyMs: requests > 0 ? Math.round(todayLatency / requests) : 0,
        errorRate:    requests > 0 ? +(todayErrors / requests).toFixed(4) : 0,
      },
      monthlyEstimate: {
        costUsd: +(monthLogs._sum.estimatedCostUsd ?? 0).toFixed(6),
        tokens:  monthLogs._sum.totalTokens ?? 0,
      },
      // Derived from real usage: no traffic → idle, otherwise hit rate decides
      cacheStatus: cacheHitRate === null ? "idle" : cacheHitRate >= 0.3 ? "ok" : "cold",
      cacheHitRate,
      knowledgeCount: kbCount,
      rulesCount,
    });
  } catch (e) {
    return err(e.message, 500);
  }
});

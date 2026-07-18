import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

function periodDays(period) {
  if (period === "daily")   return 1;
  if (period === "weekly")  return 7;
  if (period === "monthly") return 30;
  return 30;
}

// GET /api/admin/ai-analytics?period=daily|weekly|monthly
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "monthly";
  const days   = periodDays(period);

  const from = new Date();
  from.setDate(from.getDate() - days);

  try {
    const logs = await prisma.aiUsageLog.findMany({
      where: { shopId: sid, createdAt: { gte: from } },
      select: {
        conversationId: true, channel: true, latencyMs: true, totalTokens: true,
        estimatedCostUsd: true, success: true, createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const totalCount = logs.length;
    const uniqueConvIds = new Set();
    let totalLatency = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let successCount = 0;

    for (const l of logs) {
      if (l.conversationId) uniqueConvIds.add(l.conversationId);
      totalLatency += l.latencyMs ?? 0;
      totalTokens  += l.totalTokens ?? 0;
      totalCost    += l.estimatedCostUsd ?? 0;
      if (l.success) successCount += 1;
    }

    const totals = {
      conversations: uniqueConvIds.size,
      avgLatencyMs:  totalCount > 0 ? Math.round(totalLatency / totalCount) : 0,
      avgTokens:     totalCount > 0 ? Math.round(totalTokens  / totalCount) : 0,
      avgCostUsd:    totalCount > 0 ? +(totalCost / totalCount).toFixed(6) : 0,
      successRate:   totalCount > 0 ? +(successCount / totalCount).toFixed(4) : 1,
      totalCostUsd:  +totalCost.toFixed(6),
      totalRequests: totalCount,
    };

    // Daily aggregation (last N days)
    const byDay = new Map();
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      byDay.set(k, { date: k, conversations: new Set(), tokens: 0, costUsd: 0, latencyMs: 0, count: 0, errors: 0 });
    }
    for (const l of logs) {
      const k = l.createdAt.toISOString().slice(0, 10);
      if (!byDay.has(k)) {
        byDay.set(k, { date: k, conversations: new Set(), tokens: 0, costUsd: 0, latencyMs: 0, count: 0, errors: 0 });
      }
      const b = byDay.get(k);
      if (l.conversationId) b.conversations.add(l.conversationId);
      b.tokens    += l.totalTokens ?? 0;
      b.costUsd   += l.estimatedCostUsd ?? 0;
      b.latencyMs += l.latencyMs ?? 0;
      b.count     += 1;
      if (!l.success) b.errors += 1;
    }

    const daily = [...byDay.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        date: d.date,
        conversations: d.conversations.size,
        tokens: d.tokens,
        costUsd: +d.costUsd.toFixed(6),
        avgLatencyMs: d.count > 0 ? Math.round(d.latencyMs / d.count) : 0,
      }));

    const errors = [...byDay.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ date: d.date, count: d.errors }));

    // Channels breakdown
    const channelMap = new Map();
    for (const l of logs) {
      const c = l.channel ?? "UNKNOWN";
      channelMap.set(c, (channelMap.get(c) ?? 0) + 1);
    }
    const channels = [...channelMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => ({
        channel,
        count,
        pct: totalCount > 0 ? +((count / totalCount) * 100).toFixed(1) : 0,
      }));

    return ok({ totals, daily, channels, errors, period });
  } catch (e) {
    return err(e.message, 500);
  }
});

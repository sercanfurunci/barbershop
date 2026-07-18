import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { cacheSavings } from "@/lib/ai/usageLogger";

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

function p95(sorted) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
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
    // ponytail: debug Json fetched only for the 200 most recent logs — tool/quality
    // analytics sample recent traffic instead of scanning a month of blobs
    const [logs, debugLogs, churnCandidates] = await Promise.all([
      prisma.aiUsageLog.findMany({
        where: { shopId: sid, createdAt: { gte: from } },
        select: {
          conversationId: true, channel: true, latencyMs: true, totalTokens: true,
          inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true,
          estimatedCostUsd: true, success: true, createdAt: true,
          provider: true, model: true, toolCallCount: true, rounds: true,
          intent: true, qualityScore: true,
        },
        // ponytail: newest 2000 rows cap memory; aggregates don't need order
        orderBy: { createdAt: "desc" },
        take: 2000,
      }),
      prisma.aiUsageLog.findMany({
        where: { shopId: sid, createdAt: { gte: from }, debug: { not: null } },
        select: { id: true, createdAt: true, channel: true, intent: true, qualityScore: true, latencyMs: true, debug: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.client.findMany({
        where: {
          shopId: sid, blocked: false, visitCount: { gte: 3 },
          lastVisitAt: { lt: new Date(Date.now() - 60 * 86_400_000) },
        },
        select: { name: true, phone: true, visitCount: true, lastVisitAt: true },
        orderBy: { lastVisitAt: "asc" },
        take: 10,
      }),
    ]);

    const totalCount = logs.length;
    const uniqueConvIds = new Set();
    let totalLatency = 0, totalTokens = 0, totalCost = 0, successCount = 0;
    let totalInput = 0, totalCacheRead = 0, totalCacheWrite = 0, totalToolCalls = 0;
    let totalSavings = 0, qualitySum = 0, qualityCount = 0;
    const latencies = [];
    const byModel = new Map();
    const byIntent = new Map();

    for (const l of logs) {
      if (l.conversationId) uniqueConvIds.add(l.conversationId);
      totalLatency   += l.latencyMs ?? 0;
      totalTokens    += l.totalTokens ?? 0;
      totalCost      += l.estimatedCostUsd ?? 0;
      totalInput     += l.inputTokens ?? 0;
      totalCacheRead += l.cacheReadTokens ?? 0;
      totalCacheWrite+= l.cacheWriteTokens ?? 0;
      totalToolCalls += l.toolCallCount ?? 0;
      totalSavings   += cacheSavings(l.provider, l.model, l.cacheReadTokens ?? 0);
      if (l.success) successCount += 1;
      if (l.latencyMs != null) latencies.push(l.latencyMs);
      if (l.qualityScore != null) { qualitySum += l.qualityScore; qualityCount += 1; }

      const mk = `${l.provider}/${l.model}`;
      const m = byModel.get(mk) ?? { model: mk, count: 0, costUsd: 0, tokens: 0 };
      m.count += 1; m.costUsd += l.estimatedCostUsd ?? 0; m.tokens += l.totalTokens ?? 0;
      byModel.set(mk, m);

      if (l.intent) byIntent.set(l.intent, (byIntent.get(l.intent) ?? 0) + 1);
    }
    latencies.sort((a, b) => a - b);

    const promptable = totalInput + totalCacheRead;
    const totals = {
      conversations: uniqueConvIds.size,
      avgLatencyMs:  totalCount ? Math.round(totalLatency / totalCount) : 0,
      p95LatencyMs:  p95(latencies),
      avgTokens:     totalCount ? Math.round(totalTokens / totalCount) : 0,
      avgToolCalls:  totalCount ? +(totalToolCalls / totalCount).toFixed(1) : 0,
      avgCostUsd:    totalCount ? +(totalCost / totalCount).toFixed(6) : 0,
      successRate:   totalCount ? +(successCount / totalCount).toFixed(4) : 1,
      totalCostUsd:  +totalCost.toFixed(6),
      totalRequests: totalCount,
      cacheHitRate:  promptable ? +(totalCacheRead / promptable).toFixed(4) : 0,
      cacheReadTokens:  totalCacheRead,
      cacheWriteTokens: totalCacheWrite,
      cacheSavingsUsd:  +totalSavings.toFixed(6),
      costPerConversation: uniqueConvIds.size ? +(totalCost / uniqueConvIds.size).toFixed(6) : 0,
      avgQualityScore: qualityCount ? Math.round(qualitySum / qualityCount) : null,
    };

    // ── Debug-derived analytics (recent sample) ──────────────────────────────
    const toolStats = new Map();
    let hallucinationCount = 0, bookings = 0, bookingCost = 0;
    const promptSums = {}; let promptN = 0;
    const replays = [];

    for (const d of debugLogs) {
      const dbg = d.debug ?? {};
      for (const t of dbg.toolLog ?? []) {
        const s = toolStats.get(t.name) ?? { name: t.name, calls: 0, failures: 0, totalMs: 0 };
        s.calls += 1; if (!t.ok) s.failures += 1; s.totalMs += t.ms ?? 0;
        toolStats.set(t.name, s);
        if (t.name === "CreateAppointment" && t.ok) bookings += 1;
      }
      if (dbg.review?.ok === false) hallucinationCount += 1;
      if (dbg.promptSizes) {
        promptN += 1;
        for (const [k, v] of Object.entries(dbg.promptSizes)) {
          if (typeof v === "number") promptSums[k] = (promptSums[k] ?? 0) + v;
        }
      }
      if (replays.length < 30) {
        replays.push({
          id: d.id, createdAt: d.createdAt, channel: d.channel, intent: d.intent,
          qualityScore: d.qualityScore, latencyMs: d.latencyMs,
          message: dbg.message ?? null, plan: dbg.plan ?? null,
          toolLog: dbg.toolLog ?? [], review: dbg.review ?? null, reply: dbg.reply ?? null,
        });
      }
    }

    const tools = [...toolStats.values()]
      .sort((a, b) => b.calls - a.calls)
      .map(t => ({
        name: t.name, calls: t.calls, failures: t.failures,
        failureRate: +(t.failures / t.calls).toFixed(3),
        avgMs: Math.round(t.totalMs / t.calls),
      }));

    const promptSizes = promptN
      ? Object.fromEntries(Object.entries(promptSums).map(([k, v]) => [k, Math.round(v / promptN)]))
      : null;

    // Bookings in sample → approximate cost per booking from sample share
    const sampleCost = debugLogs.length && totalCount
      ? totalCost * (debugLogs.length / totalCount) : 0;
    bookingCost = bookings ? +(sampleCost / bookings).toFixed(6) : null;

    // ── Optimizer recommendations (rule-based) ───────────────────────────────
    const recommendations = [];
    if (totals.cacheHitRate < 0.5 && totalCount >= 20) {
      recommendations.push("Cache hit oranı düşük (<%50). Sistem prompt'unun kararlı kısmının konuşmalar arasında değişmediğini doğrulayın.");
    }
    if (promptSizes?.kb > 4000) {
      recommendations.push("Bilgi bankası prompt'a ortalama 4000+ karakter ekliyor. Kullanılmayan bölümleri kaldırmayı düşünün.");
    }
    for (const t of tools) {
      if (t.calls >= 5 && t.failureRate > 0.3) {
        recommendations.push(`${t.name} aracı %${Math.round(t.failureRate * 100)} oranında başarısız — girdi doğrulamasını kontrol edin.`);
      }
    }
    if (hallucinationCount > 0) {
      recommendations.push(`${hallucinationCount} yanıt self-review tarafından düzeltildi (halüsinasyon riski). Replay kayıtlarını inceleyin.`);
    }
    if (totals.p95LatencyMs > 15000) {
      recommendations.push("P95 gecikme 15sn üzeri. Araç zincirlerini ve yavaş araçları inceleyin.");
    }

    // ── Manager insights ─────────────────────────────────────────────────────
    const insights = [];
    if (churnCandidates.length) {
      insights.push({
        type: "churn",
        title: `${churnCandidates.length} sadık müşteri 60+ gündür gelmiyor`,
        detail: "Geri kazanım kampanyası (SMS/WhatsApp indirimi) düşünün.",
        customers: churnCandidates.map(c => ({
          name: c.name, phone: c.phone, visitCount: c.visitCount,
          daysSince: Math.floor((Date.now() - new Date(c.lastVisitAt)) / 86_400_000),
        })),
      });
    }
    const topIntents = [...byIntent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topIntents.length) {
      insights.push({
        type: "intents",
        title: "En sık AI konuları",
        detail: topIntents.map(([i, c]) => `${i}: ${c}`).join(", "),
      });
    }

    // ── Daily aggregation ────────────────────────────────────────────────────
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

    const models = [...byModel.values()]
      .sort((a, b) => b.costUsd - a.costUsd)
      .map(m => ({ ...m, costUsd: +m.costUsd.toFixed(6) }));

    return ok({
      totals, daily, channels, errors, period,
      tools, models, promptSizes,
      hallucinationCount, bookingsInSample: bookings, costPerBookingUsd: bookingCost,
      recommendations, insights, replays,
    });
  } catch (e) {
    return err(e.message, 500);
  }
});

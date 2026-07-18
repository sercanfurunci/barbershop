"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Zap, Coins, Clock, BarChart2, Database, Gauge, Wrench, AlertTriangle, Lightbulb, ChevronDown, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";
import { AdminPageHeader } from "@/components/ds";

const PERIODS = [
  { value: "daily",   label: "Son 24 Saat" },
  { value: "weekly",  label: "Son 7 Gün"   },
  { value: "monthly", label: "Son 30 Gün"  },
];

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px", boxShadow: SHADOW.card }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.muted, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
        <Icon size={12} /> {label}
      </div>
      <div style={{ fontSize: "22px", fontWeight: 600, color: C.primary }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: C.muted, marginTop: "3px" }}>{sub}</div>}
    </div>
  );
}

function Card({ title, icon: Icon, children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px", boxShadow: SHADOW.card, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.muted, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>
        {Icon && <Icon size={12} />} {title}
      </div>
      {children}
    </div>
  );
}

function ReplayRow({ r }) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 4px", cursor: "pointer", fontSize: "12px" }}>
        <Chevron size={12} style={{ color: C.muted, flexShrink: 0 }} />
        <span style={{ color: C.muted, flexShrink: 0 }}>{new Date(r.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
        <span style={{ color: C.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{r.message ?? "—"}</span>
        {r.intent && <span style={{ color: C.muted, fontSize: "10px", flexShrink: 0 }}>{r.intent}</span>}
        {r.qualityScore != null && (
          <span style={{ fontSize: "10px", fontWeight: 600, flexShrink: 0, color: r.qualityScore >= 80 ? C.green : r.qualityScore >= 50 ? C.yellow : "#DC2626" }}>
            {r.qualityScore}
          </span>
        )}
      </div>
      {open && (
        <div style={{ padding: "4px 4px 12px 24px", fontSize: "11px", color: C.secondary, display: "flex", flexDirection: "column", gap: "8px" }}>
          {r.plan && <pre style={{ margin: 0, whiteSpace: "pre-wrap", background: C.surface, padding: "8px", borderRadius: "6px", fontSize: "10px" }}>{r.plan}</pre>}
          {r.toolLog?.length > 0 && (
            <div>
              {r.toolLog.map((t, i) => (
                <div key={i} style={{ color: t.ok ? C.green : "#DC2626" }}>
                  {t.ok ? "✓" : "✗"} {t.name} · {t.ms}ms
                </div>
              ))}
            </div>
          )}
          {r.review && r.review.ok === false && (
            <div style={{ color: "#DC2626" }}>Self-review düzeltti: {r.review.reason}</div>
          )}
          {r.reply && <div style={{ background: C.surface, padding: "8px", borderRadius: "6px" }}>{r.reply}</div>}
        </div>
      )}
    </div>
  );
}

export default function AIAnalyticsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [period,  setPeriod]  = useState("monthly");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiFetch(`/api/admin/ai-analytics?period=${period}`);
      setData(d);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const maxDaily = data?.daily?.length
    ? Math.max(1, ...data.daily.map(d => d.conversations))
    : 1;

  return (
    <div>
      <AdminPageHeader
        title="AI Analitik"
        sub="Konuşma sayısı, gecikme, token ve maliyet"
        actions={
          <div style={{ display: "flex", gap: "4px" }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: "6px 12px", borderRadius: "8px", fontSize: "12px",
                  border: `1px solid ${period === p.value ? C.primary : C.border}`,
                  background: period === p.value ? C.primary : "transparent",
                  color: period === p.value ? "var(--makas-bg)" : C.secondary,
                  cursor: "pointer",
                }}
              >{p.label}</button>
            ))}
          </div>
        }
      />

      {loading && <div style={{ color: C.muted, fontSize: "13px", padding: "20px 0" }}>Yükleniyor…</div>}
      {error && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px" }}>{error}</div>}

      {data && !loading && (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "20px" }}>
            <Stat icon={MessageSquare} label="Konuşma" value={data.totals.conversations} sub={`${data.totals.totalRequests} istek`} />
            <Stat icon={Clock}         label="Ort. Gecikme"   value={`${data.totals.avgLatencyMs} ms`} />
            <Stat icon={Zap}           label="Ort. Token"     value={data.totals.avgTokens} />
            <Stat icon={Coins}         label="Toplam Maliyet" value={`$${(data.totals.totalCostUsd ?? 0).toFixed(4)}`} sub={`~$${(data.totals.avgCostUsd ?? 0).toFixed(5)}/istek`} />
            <Stat icon={Clock}    label="P95 Gecikme" value={`${data.totals.p95LatencyMs ?? 0} ms`} />
            <Stat icon={Database} label="Cache Hit"   value={`%${((data.totals.cacheHitRate ?? 0) * 100).toFixed(1)}`} sub={`~$${(data.totals.cacheSavingsUsd ?? 0).toFixed(4)} tasarruf`} />
            <Stat icon={Wrench}   label="Ort. Araç"   value={data.totals.avgToolCalls ?? 0} sub={data.costPerBookingUsd != null ? `~$${data.costPerBookingUsd.toFixed(5)}/randevu` : undefined} />
            <Stat icon={Gauge}    label="Kalite Skoru" value={data.totals.avgQualityScore ?? "—"} sub={data.hallucinationCount > 0 ? `${data.hallucinationCount} düzeltme` : "halüsinasyon yok"} />
          </div>

          {/* Recommendations + insights */}
          {(data.recommendations?.length > 0 || data.insights?.length > 0) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {data.recommendations?.map((r, i) => (
                <div key={`rec-${i}`} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "10px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "8px", fontSize: "12px", color: "#92400E" }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "1px" }} /> {r}
                </div>
              ))}
              {data.insights?.map((ins, i) => (
                <div key={`ins-${i}`} style={{ padding: "10px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", fontWeight: 600, color: C.primary }}>
                    <Lightbulb size={14} /> {ins.title}
                  </div>
                  <div style={{ color: C.muted, marginTop: "4px" }}>{ins.detail}</div>
                  {ins.customers?.length > 0 && (
                    <div style={{ marginTop: "6px", color: C.secondary }}>
                      {ins.customers.slice(0, 5).map(c => `${c.name} (${c.daysSince} gün)`).join(" · ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Daily conversations chart (div-based bars) */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px", boxShadow: SHADOW.card, marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.muted, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>
              <BarChart2 size={12} /> Günlük Konuşma
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "140px", overflowX: "auto" }}>
              {data.daily.map(d => {
                const h = Math.max(2, Math.round((d.conversations / maxDaily) * 130));
                return (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.conversations} konuşma · ${d.tokens} tk · $${d.costUsd.toFixed(5)}`}
                    style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}
                  >
                    <div style={{ width: "16px", height: `${h}px`, background: C.primary, borderRadius: "3px 3px 0 0", transition: "background 0.15s" }} />
                    <div style={{ fontSize: "8px", color: C.muted, whiteSpace: "nowrap" }}>{d.date.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Channels + success rate */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "16px" }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px", boxShadow: SHADOW.card }}>
              <div style={{ color: C.muted, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>Kanal Dağılımı</div>
              {data.channels.length === 0 ? (
                <div style={{ color: C.muted, fontSize: "12px" }}>Veri yok</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {data.channels.map(ch => (
                    <div key={ch.channel}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                        <span style={{ color: C.primary }}>{ch.channel}</span>
                        <span style={{ color: C.muted }}>{ch.count} · %{ch.pct}</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: C.surface, borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${ch.pct}%`, height: "100%", background: C.primary, borderRadius: "3px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px", boxShadow: SHADOW.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: C.muted, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>Başarı Oranı</div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: data.totals.successRate >= 0.95 ? C.green : data.totals.successRate >= 0.8 ? C.yellow : "#DC2626" }}>
                %{(data.totals.successRate * 100).toFixed(1)}
              </div>
              <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px" }}>
                {data.totals.totalRequests} istek
              </div>
            </div>
          </div>

          {/* Tool analytics */}
          {data.tools?.length > 0 && (
            <Card title="Araç Analitiği" icon={Wrench} style={{ marginTop: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ color: C.muted, textAlign: "left" }}>
                    <th style={{ padding: "4px" }}>Araç</th>
                    <th style={{ padding: "4px", textAlign: "right" }}>Çağrı</th>
                    <th style={{ padding: "4px", textAlign: "right" }}>Hata</th>
                    <th style={{ padding: "4px", textAlign: "right" }}>Ort. Süre</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tools.map(t => (
                    <tr key={t.name} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "6px 4px", color: C.primary }}>{t.name}</td>
                      <td style={{ padding: "6px 4px", textAlign: "right", color: C.secondary }}>{t.calls}</td>
                      <td style={{ padding: "6px 4px", textAlign: "right", color: t.failureRate > 0.3 ? "#DC2626" : C.muted }}>%{(t.failureRate * 100).toFixed(0)}</td>
                      <td style={{ padding: "6px 4px", textAlign: "right", color: C.muted }}>{t.avgMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Conversation replay */}
          {data.replays?.length > 0 && (
            <Card title="Konuşma İzleme (Replay)" icon={MessageSquare} style={{ marginTop: "16px" }}>
              {data.replays.map(r => <ReplayRow key={r.id} r={r} />)}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

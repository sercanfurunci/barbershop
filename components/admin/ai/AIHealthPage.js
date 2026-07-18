"use client";

import { useState, useEffect } from "react";
import { Activity, AlertCircle, BookOpen, Shield } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";
import { AdminPageHeader } from "@/components/ds";

const STATUS_COLOR = {
  ok:       { color: "#15803D", bg: "#DCFCE7", label: "Sağlıklı" },
  degraded: { color: "#CA8A04", bg: "#FEF9C3", label: "Bozulmuş" },
  error:    { color: "#DC2626", bg: "#FEF2F2", label: "Hata" },
};

export default function AIHealthPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/ai-health")
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const status = STATUS_COLOR[data?.status] ?? STATUS_COLOR.ok;

  return (
    <div>
      <AdminPageHeader title="AI Sağlık" sub="Sağlayıcı durumu, günlük kullanım ve hata takibi" />

      {loading && <div style={{ color: C.muted, fontSize: "13px", padding: "20px 0" }}>Yükleniyor…</div>}
      {error && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px" }}>{error}</div>}

      {data && !loading && (
        <>
          {/* API key banner */}
          {!data.apiKeyConfigured && (
            <div style={{ padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "10px", marginBottom: "12px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <AlertCircle size={16} color="#D97706" style={{ marginTop: "1px", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#92400E", marginBottom: "2px" }}>ANTHROPIC_API_KEY eksik</div>
                <div style={{ fontSize: "12px", color: "#B45309" }}>API anahtarı tanımlanmamış. AI, Mock sağlayıcıda çalışıyor. Gerçek yanıtlar için <code>.env</code> dosyasına <code>ANTHROPIC_API_KEY</code> ekleyin.</div>
              </div>
            </div>
          )}

          {/* Provider status */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px", boxShadow: SHADOW.card, marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: status.color }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: C.primary }}>{data.provider} · {data.model}</span>
              </div>
              <div style={{ fontSize: "12px", color: C.muted }}>
                Önbellek: {data.cacheStatus === "idle" ? "Bugün trafik yok"
                  : data.cacheHitRate != null ? `%${(data.cacheHitRate * 100).toFixed(1)} isabet${data.cacheStatus === "cold" ? " (düşük)" : ""}`
                  : "—"}
              </div>
            </div>
            <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>

          {/* Today's usage */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "12px" }}>
            {[
              { label: "İstek (bugün)",  value: data.today.requests },
              { label: "Token (bugün)",  value: data.today.tokens },
              { label: "Maliyet (bugün)", value: `$${data.today.costUsd.toFixed(5)}` },
              { label: "Ort. Gecikme",   value: `${data.today.avgLatencyMs} ms` },
              { label: "Hata Oranı",     value: `%${(data.today.errorRate * 100).toFixed(1)}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px", boxShadow: SHADOW.card }}>
                <div style={{ fontSize: "11px", color: C.muted, marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "17px", fontWeight: 600, color: C.primary }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Monthly */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px", boxShadow: SHADOW.card, marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
              <Activity size={12} /> Bu Ay
            </div>
            <div style={{ display: "flex", gap: "24px", alignItems: "baseline" }}>
              <div>
                <span style={{ fontSize: "20px", fontWeight: 600, color: C.primary }}>${data.monthlyEstimate.costUsd.toFixed(4)}</span>
                <span style={{ fontSize: "11px", color: C.muted, marginLeft: "4px" }}>tahmini maliyet</span>
              </div>
              <div>
                <span style={{ fontSize: "20px", fontWeight: 600, color: C.primary }}>{data.monthlyEstimate.tokens.toLocaleString("tr-TR")}</span>
                <span style={{ fontSize: "11px", color: C.muted, marginLeft: "4px" }}>token</span>
              </div>
            </div>
          </div>

          {/* Knowledge + rules counts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px", boxShadow: SHADOW.card, display: "flex", alignItems: "center", gap: "10px" }}>
              <BookOpen size={16} color={C.secondary} />
              <div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: C.primary }}>{data.knowledgeCount}</div>
                <div style={{ fontSize: "11px", color: C.muted }}>bilgi girişi</div>
              </div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px", boxShadow: SHADOW.card, display: "flex", alignItems: "center", gap: "10px" }}>
              <Shield size={16} color={C.secondary} />
              <div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: C.primary }}>{data.rulesCount}</div>
                <div style={{ fontSize: "11px", color: C.muted }}>aktif kural</div>
              </div>
            </div>
          </div>

          {/* Last error */}
          {data.lastError && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#DC2626", marginBottom: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                <AlertCircle size={12} /> Son Hata
              </div>
              <div style={{ fontSize: "12px", color: "#7F1D1D", lineHeight: 1.5, marginBottom: "4px" }}>{data.lastError.message}</div>
              <div style={{ fontSize: "10px", color: "#B91C1C" }}>{new Date(data.lastError.createdAt).toLocaleString("tr-TR")}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Play, Plus, X, GitCompare } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";
import { AdminPageHeader } from "@/components/ds";

const MODEL_OPTIONS = [
  { provider: "anthropic", model: "claude-haiku-4-5",  label: "Haiku 4.5"  },
  { provider: "anthropic", model: "claude-sonnet-4-5", label: "Sonnet 4.5" },
  { provider: "anthropic", model: "claude-opus-4-5",   label: "Opus 4.5"   },
  { provider: "openai",    model: "gpt-4o-mini",       label: "GPT-4o mini" },
  { provider: "openai",    model: "gpt-4o",            label: "GPT-4o"      },
];

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: "7px",
  border: `1px solid ${C.border}`, background: C.surface,
  color: C.primary, fontSize: "13px", boxSizing: "border-box",
};

export default function AIEvaluatePage() {
  const [prompt,  setPrompt]  = useState("Merhaba, yarın için saç kesimi randevusu almak istiyorum.");
  const [models,  setModels]  = useState([MODEL_OPTIONS[0], MODEL_OPTIONS[1]]);
  const [temp,    setTemp]    = useState(0.7);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [error,   setError]   = useState(null);

  function addModel() {
    const remaining = MODEL_OPTIONS.filter(o => !models.some(m => m.model === o.model));
    if (remaining[0]) setModels([...models, remaining[0]]);
  }
  function removeModel(idx) {
    setModels(models.filter((_, i) => i !== idx));
  }
  function updateModel(idx, model) {
    const opt = MODEL_OPTIONS.find(o => o.model === model);
    if (!opt) return;
    const copy = [...models];
    copy[idx] = opt;
    setModels(copy);
  }

  async function runAll() {
    if (!prompt.trim() || models.length === 0) return;
    setRunning(true); setError(null); setResults({});

    const calls = models.map(async m => {
      const started = performance.now();
      try {
        const params = new URLSearchParams({
          model: m.model, provider: m.provider, temperature: String(temp),
        });
        const data = await apiFetch(`/api/admin/ai-playground?${params}`, {
          method: "POST",
          body: JSON.stringify({ message: prompt }),
        });
        return [m.model, { ok: true, ...data, wallMs: Math.round(performance.now() - started) }];
      } catch (e) {
        return [m.model, { ok: false, error: e.message, wallMs: Math.round(performance.now() - started) }];
      }
    });

    const settled = await Promise.all(calls);
    setResults(Object.fromEntries(settled));
    setRunning(false);
  }

  return (
    <div>
      <AdminPageHeader
        title="AI Karşılaştırma"
        sub="Aynı prompt'u birden çok modelde paralel çalıştır ve sonuçları yan yana gör"
      />

      {/* Prompt input */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px", boxShadow: SHADOW.card, marginBottom: "12px" }}>
        <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "6px" }}>Test mesajı</label>
        <textarea
          rows={3}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <label style={{ fontSize: "11px", color: C.muted }}>Sıcaklık:</label>
            <input
              type="range" min={0} max={1} step={0.1}
              value={temp}
              onChange={e => setTemp(Number(e.target.value))}
              style={{ flex: 1, maxWidth: "180px" }}
            />
            <span style={{ fontSize: "11px", color: C.primary, minWidth: "24px" }}>{temp.toFixed(1)}</span>
          </div>
          <button
            onClick={runAll}
            disabled={running || !prompt.trim() || models.length === 0}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "8px", border: "none",
              background: running ? C.muted : C.primary,
              color: "var(--makas-bg)", fontSize: "13px", fontWeight: 500,
              cursor: running ? "not-allowed" : "pointer",
            }}
          >
            <Play size={13} /> {running ? "Çalışıyor…" : "Tümünü Çalıştır"}
          </button>
        </div>
      </div>

      {error && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

      {/* Model columns */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, models.length)}, minmax(260px, 1fr))`, gap: "10px", marginBottom: "10px" }}>
        {models.map((m, idx) => {
          const r = results[m.model];
          return (
            <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", boxShadow: SHADOW.card, display: "flex", flexDirection: "column", minHeight: "280px" }}>
              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "6px" }}>
                <select
                  value={m.model}
                  onChange={e => updateModel(idx, e.target.value)}
                  style={{ ...inputStyle, padding: "5px 8px", fontSize: "12px", flex: 1 }}
                >
                  {MODEL_OPTIONS.map(o => (
                    <option key={o.model} value={o.model}>{o.label}</option>
                  ))}
                </select>
                {models.length > 1 && (
                  <button
                    onClick={() => removeModel(idx)}
                    style={{ padding: "4px", border: "none", background: "transparent", cursor: "pointer", color: C.muted, borderRadius: "4px" }}
                  ><X size={14} /></button>
                )}
              </div>

              <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
                {running && !r && <div style={{ color: C.muted, fontSize: "12px" }}>Bekleniyor…</div>}
                {r && !r.ok && (
                  <div style={{ color: "#DC2626", fontSize: "12px", padding: "8px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "6px" }}>
                    {r.error}
                  </div>
                )}
                {r && r.ok && (
                  <>
                    <div style={{ fontSize: "12px", color: C.primary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.reply}</div>
                    <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "10px", color: C.muted }}>
                      <div>Gecikme: <strong style={{ color: C.primary }}>{r.trace?.latencyMs ?? r.wallMs} ms</strong></div>
                      <div>Token: <strong style={{ color: C.primary }}>{r.trace?.totalTokens ?? 0}</strong></div>
                      <div>Maliyet: <strong style={{ color: C.primary }}>${(r.trace?.estimatedCostUsd ?? 0).toFixed(5)}</strong></div>
                      <div>Bağlam: <strong style={{ color: C.primary }}>~{r.trace?.contextSize ?? 0}</strong></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {models.length < MODEL_OPTIONS.length && (
        <button
          onClick={addModel}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "6px 12px", borderRadius: "8px",
            border: `1px dashed ${C.border}`, background: "transparent",
            color: C.secondary, fontSize: "12px", cursor: "pointer",
          }}
        ><Plus size={12} /> Model ekle</button>
      )}

      {Object.keys(results).length === 0 && !running && (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
          <GitCompare size={28} style={{ marginBottom: "10px", opacity: 0.3 }} />
          <div style={{ fontSize: "13px" }}>Sonuçları görmek için "Tümünü Çalıştır"a basın.</div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X, Copy, Download, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";

export default function PromptPreviewModal({ onClose }) {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/admin/ai-preview", { method: "POST", body: JSON.stringify({ preview: true }) })
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function copyToClipboard() {
    if (!data?.systemPrompt) return;
    navigator.clipboard.writeText(data.systemPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function download() {
    if (!data?.systemPrompt) return;
    const blob = new Blob([data.systemPrompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `makas-system-prompt-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: "12px", boxShadow: SHADOW.pop,
          width: "100%", maxWidth: "820px", maxHeight: "90vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: C.primary }}>Sistem Komutu Önizleme</div>
            {data && (
              <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>
                {data.systemPrompt?.length ?? 0} karakter · ~{data.estimatedTokens ?? 0} token
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={copyToClipboard}
              disabled={!data}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "7px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, fontSize: "12px", cursor: data ? "pointer" : "not-allowed", opacity: data ? 1 : 0.5 }}
            >
              {copied ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
            </button>
            <button
              onClick={download}
              disabled={!data}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "7px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, fontSize: "12px", cursor: data ? "pointer" : "not-allowed", opacity: data ? 1 : 0.5 }}
            >
              <Download size={12} /> İndir
            </button>
            <button
              onClick={onClose}
              style={{ padding: "6px", border: "none", background: "transparent", cursor: "pointer", color: C.muted, borderRadius: "6px" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
          {loading && <div style={{ color: C.muted, fontSize: "13px" }}>Yükleniyor…</div>}
          {error && (
            <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "12px" }}>
              {error}
            </div>
          )}
          {data && (
            <pre style={{ fontSize: "11px", color: C.primary, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'JetBrains Mono', 'Courier New', monospace", margin: 0 }}>
              {data.systemPrompt}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

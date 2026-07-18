"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap, ChevronDown, ChevronUp, RefreshCw, Terminal, Bug, Eye, Copy, Repeat, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";
import { AdminPageHeader } from "@/components/ds";
import PromptPreviewModal from "./PromptPreviewModal";

const MODEL_OPTIONS = [
  { provider: "",          model: "",                   label: "Salon Ayarı" },
  { provider: "anthropic", model: "claude-haiku-4-5",   label: "Haiku 4.5"   },
  { provider: "anthropic", model: "claude-sonnet-4-5",  label: "Sonnet 4.5"  },
  { provider: "anthropic", model: "claude-opus-4-5",    label: "Opus 4.5"    },
  { provider: "openai",    model: "gpt-4o-mini",        label: "GPT-4o mini" },
  { provider: "openai",    model: "gpt-4o",             label: "GPT-4o"      },
];

// Minimal markdown: **bold**, `code`, and preserve newlines.
function renderMd(text) {
  if (!text) return null;
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const s = m[0];
    if (s.startsWith("**")) parts.push(<strong key={m.index}>{s.slice(2, -2)}</strong>);
    else parts.push(<code key={m.index} style={{ background: "rgba(0,0,0,0.06)", padding: "1px 4px", borderRadius: "3px", fontSize: "0.9em" }}>{s.slice(1, -1)}</code>);
    last = m.index + s.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span style={{ whiteSpace: "pre-wrap" }}>{parts}</span>;
}

export default function AIPlaygroundPage() {
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [lastTrace,  setLastTrace]  = useState(null);
  const [showTrace,  setShowTrace]  = useState(false);
  const [debugMode,  setDebugMode]  = useState(false);
  const [error,      setError]      = useState(null);
  const [modelIdx,   setModelIdx]   = useState(0);
  const [temp,       setTemp]       = useState(0.7);
  const [preview,    setPreview]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function reset() {
    setMessages([]);
    setLastTrace(null);
    setShowTrace(false);
    setError(null);
    setDebugMode(false);
  }

  async function send(overrideMsg) {
    const raw = overrideMsg ?? input;
    if (!raw.trim() || loading) return;
    const userMsg = raw.trim();
    if (!overrideMsg) setInput("");
    setError(null);
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setLastTrace(null);

    try {
      const opt = MODEL_OPTIONS[modelIdx];
      const qs = new URLSearchParams();
      if (opt.model)    qs.set("model", opt.model);
      if (opt.provider) qs.set("provider", opt.provider);
      qs.set("temperature", String(temp));
      const suffix = qs.toString() ? `?${qs}` : "";
      const res = await apiFetch(`/api/admin/ai-playground${suffix}`, {
        method: "POST",
        body: JSON.stringify({ message: userMsg }),
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
      setLastTrace(res.trace);
    } catch (e) {
      setError(e.message);
      setMessages(prev => [...prev, { role: "error", content: `Hata: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function resendLast() {
    const last = [...messages].reverse().find(m => m.role === "user");
    if (last) {
      // Drop the last user + any following assistant
      const idx = messages.lastIndexOf(last);
      setMessages(messages.slice(0, idx));
      send(last.content);
    }
  }

  function copyConversation() {
    const text = messages.map(m => `${m.role === "user" ? "Sen" : m.role === "assistant" ? "AI" : "Hata"}: ${m.content}`).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <AdminPageHeader
        title="AI Playground"
        sub="Asistanı gerçek ortamda test edin — araç çağrıları ve token kullanımı görünür"
        actions={
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <select
              value={modelIdx}
              onChange={e => setModelIdx(Number(e.target.value))}
              style={{ padding: "7px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.surface, color: C.primary, fontSize: "12px", cursor: "pointer" }}
            >
              {MODEL_OPTIONS.map((o, i) => (
                <option key={i} value={i}>{o.label}</option>
              ))}
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "11px", color: C.muted }}>
              T:
              <input type="range" min={0} max={1} step={0.1} value={temp} onChange={e => setTemp(Number(e.target.value))} style={{ width: "70px" }} />
              <span style={{ color: C.primary, minWidth: "20px" }}>{temp.toFixed(1)}</span>
            </div>
            <button
              onClick={() => setPreview(true)}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", background: "transparent", color: C.secondary, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: "12px" }}
            >
              <Eye size={12} /> Prompt
            </button>
            <button
              onClick={resendLast}
              disabled={!messages.some(m => m.role === "user")}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", background: "transparent", color: C.secondary, border: `1px solid ${C.border}`, cursor: messages.some(m => m.role === "user") ? "pointer" : "not-allowed", opacity: messages.some(m => m.role === "user") ? 1 : 0.5, fontSize: "12px" }}
            >
              <Repeat size={12} /> Tekrar
            </button>
            <button
              onClick={copyConversation}
              disabled={messages.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", background: "transparent", color: C.secondary, border: `1px solid ${C.border}`, cursor: messages.length ? "pointer" : "not-allowed", opacity: messages.length ? 1 : 0.5, fontSize: "12px" }}
            >
              {copied ? <><Check size={12} /> OK</> : <><Copy size={12} /> Kopyala</>}
            </button>
            <button
              onClick={() => setDebugMode(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", background: debugMode ? C.primary : "transparent", color: debugMode ? "var(--makas-bg)" : C.secondary, border: `1px solid ${debugMode ? C.primary : C.border}`, cursor: "pointer", fontSize: "12px" }}
            >
              <Bug size={12} /> Debug
            </button>
            <button
              onClick={reset}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", background: "transparent", color: C.secondary, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: "12px" }}
            >
              <RefreshCw size={12} /> Sıfırla
            </button>
          </div>
        }
      />
      {preview && <PromptPreviewModal onClose={() => setPreview(false)} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", maxHeight: "calc(100vh - 200px)" }}>

        {/* Chat panel */}
        <div style={{ display: "flex", flexDirection: "column", background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", boxShadow: SHADOW.card, overflow: "hidden" }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: "13px", textAlign: "center", padding: "40px" }}>
                <div>
                  <Zap size={28} style={{ marginBottom: "12px", opacity: 0.3 }} />
                  <div>Asistana bir mesaj gönderin.</div>
                  <div style={{ marginTop: "6px", fontSize: "12px" }}>Araç çağrıları ve token kullanımı sağ panelde görünecek.</div>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%", padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: msg.role === "user" ? C.primary : msg.role === "error" ? "#FEF2F2" : C.surface,
                  color: msg.role === "user" ? "var(--makas-bg)" : msg.role === "error" ? "#DC2626" : C.primary,
                  fontSize: "13px", lineHeight: 1.6,
                }}>
                  {msg.role === "assistant" ? renderMd(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.dim, animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <span style={{ fontSize: "12px", color: C.muted }}>Yanıt oluşturuluyor…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              disabled={loading}
              placeholder="Mesajınızı yazın…"
              style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, fontSize: "13px", outline: "none", background: "var(--makas-surface)" }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", background: C.primary, color: "var(--makas-bg)", border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500, opacity: loading || !input.trim() ? 0.5 : 1 }}
            >
              <Send size={13} /> Gönder
            </button>
          </div>
        </div>

        {/* Trace panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>

          {/* Metrics */}
          {lastTrace && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", boxShadow: SHADOW.card }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: "12px" }}>PERFORMANS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { label: "Gecikme",      value: `${lastTrace.latencyMs}ms`               },
                  { label: "Model",        value: lastTrace.model?.split("-").slice(1, 3).join("-") ?? "—" },
                  { label: "Girdi",        value: `${lastTrace.usage?.inputTokens ?? 0} tk` },
                  { label: "Çıktı",        value: `${lastTrace.usage?.outputTokens ?? 0} tk` },
                  { label: "Toplam",       value: `${lastTrace.totalTokens ?? 0} tk`        },
                  { label: "Maliyet",      value: lastTrace.estimatedCostUsd != null ? `$${lastTrace.estimatedCostUsd.toFixed(5)}` : "—" },
                  { label: "Araç",         value: `${lastTrace.toolCallCount ?? lastTrace.toolCalls?.length ?? 0} çağrı` },
                  { label: "Tur",          value: `${lastTrace.rounds ?? 1}`                },
                  { label: "KB Giriş",     value: `${lastTrace.kbEntriesUsed ?? lastTrace.kbCount ?? 0}` },
                  { label: "Bağlam",       value: `~${lastTrace.contextSize ?? 0} tk`       },
                  { label: "Bellek",       value: lastTrace.memoryUsed ? "Aktif" : "Yok"    },
                  { label: "Kişilik",      value: lastTrace.personalityUsed ?? "—"          },
                  { label: "Sıcaklık",     value: lastTrace.temperature != null ? String(lastTrace.temperature) : "—" },
                  { label: "Sağlayıcı",    value: lastTrace.provider ?? "—"                },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: C.bg, borderRadius: "8px", padding: "8px 10px" }}>
                    <div style={{ fontSize: "10px", color: C.muted, marginBottom: "2px" }}>{label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool calls */}
          {lastTrace?.toolCalls?.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", boxShadow: SHADOW.card }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: "12px" }}>ARAÇ ÇAĞRILARI ({lastTrace.toolCalls.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {lastTrace.toolCalls.map((tc, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: "8px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Terminal size={11} /> {tc.name}
                    </div>
                    <pre style={{ fontSize: "10px", color: C.secondary, overflow: "auto", maxHeight: "120px", margin: 0, lineHeight: 1.5, fontFamily: "monospace" }}>
                      {JSON.stringify(tc.input, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System prompt */}
          {lastTrace?.systemPrompt && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", boxShadow: SHADOW.card }}>
              <button
                onClick={() => setShowTrace(v => !v)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: 0, fontSize: "11px", fontWeight: 700, color: C.muted, letterSpacing: "0.06em" }}
              >
                SİSTEM KOMUTU
                {showTrace ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {showTrace && (
                <pre style={{ marginTop: "10px", fontSize: "10px", color: C.secondary, overflow: "auto", maxHeight: "280px", lineHeight: 1.6, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {lastTrace.systemPrompt}
                </pre>
              )}
            </div>
          )}

          {/* Debug: raw trace JSON */}
          {debugMode && lastTrace && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", boxShadow: SHADOW.card }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: "10px" }}>RAW TRACE (DEBUG)</div>
              <pre style={{ fontSize: "10px", color: C.secondary, overflow: "auto", maxHeight: "320px", margin: 0, lineHeight: 1.5, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {JSON.stringify({ ...lastTrace, systemPrompt: lastTrace.systemPrompt ? `[${lastTrace.systemPrompt.length} chars]` : null }, null, 2)}
              </pre>
            </div>
          )}

          {!lastTrace && !loading && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px 16px", textAlign: "center", color: C.muted, fontSize: "12px" }}>
              Bir mesaj gönderin — araç çağrıları ve performans metrikleri burada görünecek.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

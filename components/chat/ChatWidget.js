"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { MessageCircle, X, Send, Square, Wrench, Trash2, Scissors, Sparkles } from "lucide-react";
import { useVisitorId } from "@/hooks/useVisitorId";
import { useChat }      from "@/hooks/useChat";

// ── Styles — all colors via site CSS vars (auto light/dark via .dark on <html>) ─
const STYLES = `
.mw {
  font-family: var(--font-outfit, -apple-system, "Segoe UI", system-ui, sans-serif);
  box-sizing: border-box;
  line-height: 1;
}
.mw *, .mw *::before, .mw *::after { box-sizing: inherit; }

/* ── Panel ── */
.mw-panel {
  position: fixed;
  bottom: 24px; right: 24px;
  width: 384px; height: 588px;
  z-index: 9999;
  display: flex; flex-direction: column;
  background: var(--card);
  border: 1px solid var(--makas-border);
  border-radius: 20px;
  box-shadow: var(--shadow-pop);
  overflow: hidden;
  animation: mw-open 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: bottom right;
}
.mw-panel--left {
  right: auto; left: 24px;
  transform-origin: bottom left;
}

/* ── Mobile bottom sheet ── */
@media (max-width: 639px) {
  .mw-panel, .mw-panel--left {
    bottom: 0; left: 0; right: 0;
    width: 100%; height: 75dvh; max-height: 75dvh;
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -4px 40px rgba(0,0,0,0.14);
    animation: mw-sheet 0.32s cubic-bezier(0.22, 1, 0.36, 1);
    transform-origin: bottom center;
  }
}
/* ── FAB above sticky bottom nav on mobile (md:hidden = <768px) ── */
@media (max-width: 767px) {
  .mw-launcher-wrap {
    bottom: calc(64px + env(safe-area-inset-bottom) + 16px) !important;
    right: 16px !important;
  }
  .mw-launcher-wrap--left {
    bottom: calc(64px + env(safe-area-inset-bottom) + 16px) !important;
    left: 16px !important; right: auto !important;
  }
  .mw-proactive { max-width: 320px; }
}

@keyframes mw-open {
  from { opacity: 0; transform: scale(0.90) translateY(16px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}
@keyframes mw-sheet {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .mw-panel, .mw-launcher { animation: none !important; transition: none !important; }
}

/* ── Scrollbar ── */
.mw-msgs::-webkit-scrollbar { width: 4px; }
.mw-msgs::-webkit-scrollbar-track { background: transparent; }
.mw-msgs::-webkit-scrollbar-thumb { background: var(--makas-thumb); border-radius: 999px; }
.mw-msgs::-webkit-scrollbar-thumb:hover { background: var(--makas-thumb-hover); }
.mw-msgs { scrollbar-width: thin; scrollbar-color: var(--makas-thumb) transparent; }

/* ── Textarea ── */
.mw-input {
  flex: 1; resize: none; outline: none; border: none;
  background: transparent;
  color: var(--foreground);
  font-size: 14px; line-height: 1.55; font-family: inherit;
  max-height: 120px; overflow-y: auto;
  padding: 0;
}
.mw-input::placeholder { color: var(--muted-foreground); }
.mw-input:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Send button ── */
.mw-btn-send {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s;
}
.mw-btn-send:disabled { opacity: 0.28; cursor: not-allowed; }
.mw-btn-send:not(:disabled):hover { transform: scale(1.08); }
.mw-btn-send:not(:disabled):active { transform: scale(0.88); transition-duration: 0.08s; }

/* ── Header icon buttons ── */
.mw-btn-icon {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  border: none; cursor: pointer;
  background: rgba(255,255,255,0.10);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.mw-btn-icon:hover { background: rgba(255,255,255,0.20); }

/* ── Launcher ── */
.mw-launcher-wrap {
  display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
}
/* ── Premium Welcome Card ── */
.mw-proactive {
  position: relative;
  background: var(--card);
  border: 1px solid var(--makas-border);
  border-radius: 22px;
  width: 340px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
  overflow: hidden;
  animation: mw-card-in 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  transition: box-shadow 0.22s, transform 0.22s;
}
.mw-proactive:hover {
  box-shadow: 0 14px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.07);
  transform: translateY(-2px);
}
/* Arrow caret below card */
.mw-proactive-arrow {
  width: 0; height: 0;
  align-self: flex-end;
  margin-right: 18px;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 9px solid var(--makas-border);
  position: relative;
}
.mw-proactive-arrow::after {
  content: "";
  position: absolute;
  top: -10px; left: -8px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid var(--card);
}
@keyframes mw-card-in {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.mw-proactive-header {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 16px 14px;
  border-bottom: 1px solid var(--makas-border);
}
.mw-proactive-avatar {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  background: var(--sidebar);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}
.mw-proactive-meta { flex: 1; min-width: 0; }
.mw-proactive-name {
  font-weight: 600; font-size: 13px; color: var(--foreground);
  line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mw-proactive-status { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
.mw-proactive-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  background: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.25);
}
.mw-proactive-status-text { font-size: 11px; color: var(--muted-foreground); }
.mw-proactive-badge {
  font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 99px;
  background: var(--makas-surface2); border: 1px solid var(--makas-border);
  color: var(--muted-foreground); letter-spacing: 0.02em; white-space: nowrap; flex-shrink: 0;
}
.mw-proactive-close {
  width: 26px; height: 26px; border-radius: 8px; border: none; background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--muted-foreground); font-size: 12px; flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.mw-proactive-close:hover { background: var(--secondary); color: var(--foreground); }
.mw-proactive-body {
  padding: 14px 16px; font-size: 13.5px; line-height: 1.65; color: var(--foreground);
}
.mw-proactive-footer { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; }
.mw-proactive-cta {
  width: 100%; padding: 11px 16px; border-radius: 12px; border: none; cursor: pointer;
  background: var(--foreground); color: var(--background);
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: opacity 0.2s, transform 0.2s;
}
.mw-proactive-cta:hover { opacity: 0.88; transform: translateY(-1px); }
.mw-proactive-cta:active { transform: scale(0.97); transition-duration: 0.08s; }
.mw-proactive-secondary {
  background: none; border: none; cursor: pointer;
  font-size: 12.5px; color: var(--muted-foreground); font-family: inherit;
  text-align: center; padding: 4px;
  text-decoration: underline; text-underline-offset: 2px;
  text-decoration-color: transparent;
  transition: color 0.15s, text-decoration-color 0.15s;
}
.mw-proactive-secondary:hover { color: var(--foreground); text-decoration-color: var(--makas-border); }
@media (max-width: 639px) {
  .mw-proactive { width: calc(100vw - 32px); }
}
.mw-launcher {
  width: 54px; height: 54px; border-radius: 50%; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
}
.mw-launcher:hover  { transform: scale(1.10); }
.mw-launcher:active { transform: scale(0.92); }

/* ── Typing dots ── */
.mw-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--muted-foreground);
  animation: mw-bounce 1.4s ease-in-out infinite;
}
.mw-dot:nth-child(2) { animation-delay: 0.17s; }
.mw-dot:nth-child(3) { animation-delay: 0.34s; }
@keyframes mw-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%            { transform: translateY(-5px); opacity: 1; }
}

/* ── Streaming cursor ── */
.mw-cursor {
  display: inline-block; width: 2px; height: 0.85em;
  background: var(--muted-foreground); margin-left: 1px;
  vertical-align: text-bottom;
  animation: mw-blink 0.9s step-end infinite;
}
@keyframes mw-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

/* ── Message enter ── */
.mw-msg { animation: mw-msg-in 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes mw-msg-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Code blocks ── */
.mw-pre {
  background: var(--makas-surface2);
  border: 1px solid var(--makas-border);
  border-radius: 8px; padding: 10px 12px; margin: 4px 0;
  font-size: 12px; line-height: 1.5;
  font-family: var(--font-dm-mono, ui-monospace, monospace);
  overflow-x: auto; white-space: pre;
  color: var(--foreground);
}
.mw-code {
  background: var(--makas-surface2);
  border: 1px solid var(--makas-border);
  border-radius: 4px; padding: 1px 5px; font-size: 12px;
  font-family: var(--font-dm-mono, ui-monospace, monospace);
  color: var(--foreground);
}

/* ── Misc ── */
.mw-badge {
  position: absolute; top: -5px; right: -5px;
  min-width: 18px; height: 18px; border-radius: 9px; padding: 0 4px;
  background: var(--destructive); color: #fff;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--card);
}
.mw-list { margin: 4px 0 4px 18px; padding: 0; }
.mw-list li { margin: 3px 0; line-height: 1.55; }
.mw-link {
  color: var(--foreground);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: var(--makas-border);
  transition: text-decoration-color 0.15s;
}
.mw-link:hover { text-decoration-color: var(--foreground); }
.mw-hr { border: none; border-top: 1px solid var(--makas-border); margin: 8px 0; }
`;

// ── Tool labels ───────────────────────────────────────────────────────────────

const TOOL_LABELS = {
  "availability.getSlots":    "Müsait saatler kontrol ediliyor…",
  "booking.create":           "Randevu oluşturuluyor…",
  "appointment.cancel":       "İptal işleniyor…",
  "appointment.reschedule":   "Yeniden planlanıyor…",
  "customer.lookup":          "Müşteri bilgileri alınıyor…",
};

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(max-width: 639px)");
    setM(mq.matches);
    mq.addEventListener("change", e => setM(e.matches));
  }, []);
  return m;
}

const DEFAULTS = {
  primaryColor:   "var(--sidebar)",
  accentColor:    "var(--sidebar-foreground)",
  avatarUrl:      null,
  aiName:         "MAKAS AI",
  welcomeMessage: "Merhaba! Size nasıl yardımcı olabilirim?",
  position:       "bottom-right",
  hours:          null,
  isHoliday:      false,
};

const DAY_KEYS = ["sun","mon","tue","wed","thu","fri","sat"];

function computeStatus(hours, isHoliday) {
  if (isHoliday) return { dot: "#ef4444", label: "Bugün kapalı" };
  if (!hours)    return { dot: "#22c55e", label: "Çevrimiçi" };
  const tr   = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const day  = DAY_KEYS[tr.getUTCDay()];
  const mins = tr.getUTCHours() * 60 + tr.getUTCMinutes();
  const h    = hours.find(x => x.day === day);
  if (!h || h.start == null || h.end == null) return { dot: "#ef4444", label: "Bugün kapalı" };
  if (mins < h.start || mins >= h.end)        return { dot: "#ef4444", label: "Şu anda kapalı" };
  return { dot: "#22c55e", label: "Çevrimiçi" };
}

// ── Widget ────────────────────────────────────────────────────────────────────

export default function ChatWidget({ shopSlug, widgetConfig = {}, embedded = false, sdk = false }) {
  const config       = { ...DEFAULTS, ...widgetConfig };
  const isLeft       = config.position === "bottom-left";
  const isMobile     = useIsMobile();
  const onlineStatus = useMemo(() => computeStatus(config.hours, config.isHoliday), [config.hours, config.isHoliday]);

  const [open,       setOpen]       = useState(embedded);
  const [input,      setInput]      = useState("");
  const [unread,     setUnread]     = useState(0);
  const [proactive,  setProactive]  = useState(false);

  const bottomRef      = useRef(null);
  const inputRef       = useRef(null);
  // Track how many messages existed when history finished loading.
  // Only messages arriving AFTER that point count as "unread".
  const historyCountRef = useRef(null);

  const { visitorId } = useVisitorId();
  const { messages, streaming, toolStatus, connected, historyLoaded, sendMessage, abort, clearHistory } = useChat({
    shopSlug, visitorId, enabled: !!visitorId,
  });

  // SDK bridge
  useEffect(() => {
    if (!sdk) return;
    window.parent?.postMessage({ source: "makas-widget", shopSlug, type: open ? "open" : "close" }, "*");
  }, [sdk, open, shopSlug]);

  // Snapshot message count once history finishes loading (so we skip history msgs in unread)
  useEffect(() => {
    if (historyLoaded && historyCountRef.current === null) {
      historyCountRef.current = messages.length;
    }
  }, [historyLoaded, messages.length]);

  // Unread badge — only counts messages that arrived after history loaded
  useEffect(() => {
    if (open) { setUnread(0); return; }
    if (historyCountRef.current === null) return; // history not yet loaded
    const last = messages.at(-1);
    if (last?.role === "assistant" && !last.streaming && messages.length > historyCountRef.current) {
      setUnread(u => u + 1);
    }
  }, [messages, open]);

  // Proactive card: show after 6s; suppress for 7 days after dismiss
  useEffect(() => {
    if (embedded || open) return;
    try {
      const ts = localStorage.getItem("mw-proactive-ts");
      if (ts && Date.now() - parseInt(ts, 10) < 7 * 24 * 60 * 60 * 1000) return;
    } catch {}
    const t = setTimeout(() => setProactive(true), 6000);
    return () => clearTimeout(t);
  }, [embedded, open]);

  // Auto-hide after 9s if user doesn't interact
  useEffect(() => {
    if (!proactive) return;
    const t = setTimeout(() => {
      setProactive(false);
      try { localStorage.setItem("mw-proactive-ts", Date.now().toString()); } catch {}
    }, 9000);
    return () => clearTimeout(t);
  }, [proactive]);

  // Auto-scroll
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 140);
  }, [open]);

  // Refocus after streaming ends
  useEffect(() => {
    if (!streaming && open) inputRef.current?.focus();
  }, [streaming, open]);

  // Escape closes
  useEffect(() => {
    if (!open || embedded) return;
    const fn = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, embedded]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    await sendMessage(text);
  }, [input, streaming, sendMessage]);

  // ── Launcher ──────────────────────────────────────────────────────────────

  const dismissProactive = (e) => {
    e?.stopPropagation();
    setProactive(false);
    try { localStorage.setItem("mw-proactive-ts", Date.now().toString()); } catch {}
  };

  const openChat = () => { setOpen(true); setUnread(0); setProactive(false); };

  if (!open && !embedded) {
    return (
      <>
        <style>{STYLES}</style>
        <div
          className={`mw mw-launcher-wrap${isLeft ? " mw-launcher-wrap--left" : ""}`}
          style={{
            position: "fixed", zIndex: 9999,
            bottom: "24px",
            [isLeft ? "left" : "right"]: "24px",
          }}
        >
          {/* Premium welcome card */}
          {proactive && unread === 0 && (
            isMobile ? (
              /* ── Compact mobile card ── */
              <div className="mw-proactive" onClick={openChat} role="button" aria-label="Sohbeti Aç">
                <div className="mw-proactive-header" style={{ padding: "12px 14px 10px", borderBottom: "none" }}>
                  <div className="mw-proactive-avatar" style={{ width: "34px", height: "34px", borderRadius: "10px" }}>
                    {config.avatarUrl
                      ? <img src={config.avatarUrl} alt={config.aiName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <Sparkles size={14} color="var(--sidebar-foreground)" strokeWidth={2.5} />
                    }
                  </div>
                  <div className="mw-proactive-meta">
                    <div className="mw-proactive-name">{config.aiName}</div>
                    <div className="mw-proactive-status">
                      <span className="mw-proactive-dot" style={{ background: onlineStatus.dot, boxShadow: `0 0 0 2px ${onlineStatus.dot}33` }} />
                      <span className="mw-proactive-status-text">{onlineStatus.label}</span>
                    </div>
                  </div>
                  <button className="mw-proactive-close" onClick={dismissProactive} aria-label="Kapat" style={{ width: "36px", height: "36px" }}>✕</button>
                </div>
                <div style={{ padding: "0 14px 10px", fontSize: "13px", lineHeight: 1.5, color: "var(--foreground)" }}>
                  Randevu almak veya soru sormak için dokunun.
                </div>
                <div style={{ padding: "0 14px 14px" }}>
                  <button className="mw-proactive-cta" onClick={openChat} style={{ padding: "11px 14px", borderRadius: "10px", fontSize: "13px" }}>
                    Sohbet Başlat
                  </button>
                </div>
              </div>
            ) : (
              /* ── Full desktop card ── */
              <div className="mw-proactive" onClick={openChat} role="button" aria-label="Sohbeti Aç">
                <div className="mw-proactive-header">
                  <div className="mw-proactive-avatar">
                    {config.avatarUrl
                      ? <img src={config.avatarUrl} alt={config.aiName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <Sparkles size={16} color="var(--sidebar-foreground)" strokeWidth={2.5} />
                    }
                  </div>
                  <div className="mw-proactive-meta">
                    <div className="mw-proactive-name">{config.aiName}</div>
                    <div className="mw-proactive-status">
                      <span className="mw-proactive-dot" style={{ background: onlineStatus.dot, boxShadow: `0 0 0 2px ${onlineStatus.dot}33` }} />
                      <span className="mw-proactive-status-text">{onlineStatus.label}</span>
                    </div>
                  </div>
                  <span className="mw-proactive-badge">AI Asistan</span>
                  <button className="mw-proactive-close" onClick={dismissProactive} aria-label="Kapat">✕</button>
                </div>
                <div className="mw-proactive-body">
                  <strong style={{ display: "block", marginBottom: "4px" }}>👋 Merhaba!</strong>
                  Randevu almak, fiyat öğrenmek veya uygun saatleri görmek için bana yazabilirsiniz.
                </div>
                <div className="mw-proactive-footer">
                  <button className="mw-proactive-cta" onClick={openChat}>
                    Randevu Planla <span style={{ opacity: 0.7 }}>→</span>
                  </button>
                  <button className="mw-proactive-secondary" onClick={openChat}>
                    Ya da sadece soru sor
                  </button>
                </div>
              </div>
            )
          )}
          {/* Arrow caret connecting card to launcher */}
          {proactive && unread === 0 && <div className="mw-proactive-arrow" />}

          {/* Launcher button */}
          <button
            className="mw-launcher"
            onClick={openChat}
            aria-label="Sohbeti Aç"
            style={{
              background: config.primaryColor,
              boxShadow: "0 4px 24px var(--makas-ink-40)",
            }}
          >
            <MessageCircle size={22} color="var(--sidebar-foreground)" strokeWidth={2} fill="rgba(255,255,255,0.12)" />
            {unread > 0 && <span className="mw-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>
        </div>
      </>
    );
  }

  // ── Panel ─────────────────────────────────────────────────────────────────

  const panelClass = `mw-panel${isLeft && !isMobile ? " mw-panel--left" : ""}`;

  const panelOverride = embedded ? {
    position: "relative",
    bottom: "auto", left: "auto", right: "auto",
    width: "100%", height: "100%",
    borderRadius: 0, boxShadow: "none", border: "none",
    animation: "none",
  } : {};

  return (
    <>
      <style>{STYLES}</style>

      {/* Mobile backdrop */}
      {!embedded && isMobile && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "var(--makas-ink-50)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            animation: "mw-msg-in 0.22s ease",
          }}
        />
      )}

      <div
        className={`mw ${panelClass}`}
        style={panelOverride}
        role="dialog"
        aria-label="Canlı Destek"
        aria-modal="true"
      >
        {/* Drag handle — mobile only */}
        {isMobile && !embedded && (
          <div style={{
            padding: "10px 0 4px",
            display: "flex", justifyContent: "center",
            flexShrink: 0,
            background: "var(--card)",
          }}>
            <div style={{
              width: "36px", height: "4px",
              borderRadius: "2px",
              background: "var(--makas-border)",
            }} />
          </div>
        )}

        {/* Header */}
        <Header
          config={config}
          connected={connected}
          embedded={embedded}
          onClose={() => setOpen(false)}
          onClear={messages.length > 0 ? clearHistory : null}
        />

        {/* Messages */}
        <div
          className="mw-msgs"
          role="log"
          aria-live="polite"
          aria-label="Mesajlar"
          style={{
            flex: 1, overflowY: "auto",
            padding: "16px 14px",
            display: "flex", flexDirection: "column", gap: "2px",
            background: "var(--makas-bg)",
          }}
        >
          {historyLoaded && !messages.some(m => m.role === "assistant") && (
            <AssistantBubble content={config.welcomeMessage} config={config} />
          )}

          {messages.map(msg => (
            msg.role === "user"
              ? <UserBubble key={msg.id} content={msg.content} />
              : <AssistantBubble key={msg.id} content={msg.content} streaming={msg.streaming} error={msg.error} config={config} />
          ))}

          {toolStatus && (
            <div className="mw-msg" style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "5px 10px",
              background: "var(--status-warning-bg)",
              border: "1px solid var(--status-warning-border)",
              borderRadius: "8px", width: "fit-content",
              marginTop: "4px",
            }}>
              <Wrench size={11} style={{ color: "var(--status-warning-text)", flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "var(--status-warning-text)", fontWeight: 500 }}>
                {TOOL_LABELS[toolStatus.name] ?? "İşlem yapılıyor…"}
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: "10px 12px",
          paddingBottom: `calc(10px + env(safe-area-inset-bottom))`,
          borderTop: "1px solid var(--makas-border)",
          display: "flex", alignItems: "flex-end", gap: "8px",
          background: "var(--card)",
          flexShrink: 0,
        }}>
          <div
            style={{
              flex: 1,
              display: "flex", alignItems: "flex-end",
              background: "var(--makas-bg)",
              border: "1px solid var(--makas-border)",
              borderRadius: "14px",
              padding: "9px 13px",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocusCapture={e => {
              e.currentTarget.style.borderColor = "var(--makas-border-hi)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--makas-ink-10)";
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = "var(--makas-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <textarea
              ref={inputRef}
              className="mw-input"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              disabled={streaming}
              placeholder="Mesajınızı yazın…"
              rows={1}
              aria-label="Mesaj"
            />
          </div>

          <button
            className="mw-btn-send"
            onClick={streaming ? abort : handleSend}
            aria-label={streaming ? "Durdur" : "Gönder"}
            disabled={!streaming && !input.trim()}
            style={{
              background: streaming
                ? "var(--destructive)"
                : input.trim()
                  ? "var(--foreground)"
                  : "var(--makas-surface2)",
            }}
          >
            {streaming
              ? <Square size={13} color="#fff" fill="#fff" />
              : <Send size={13} color={input.trim() ? "var(--background)" : "var(--muted-foreground)"} />
            }
          </button>
        </div>

        {/* Powered by */}
        {!embedded && (
          <div style={{
            textAlign: "center",
            padding: "4px 0 6px",
            background: "var(--card)",
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: "10px",
              color: "var(--muted-foreground)",
              letterSpacing: "0.04em",
              fontWeight: 500,
              opacity: 0.6,
            }}>
              Powered by MAKAS AI
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ config, connected, embedded, onClose, onClear }) {
  // Get initials for avatar fallback
  const initials = config.aiName
    ? config.aiName.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "AI";

  return (
    <div style={{
      padding: "14px 16px",
      display: "flex", alignItems: "center", gap: "11px",
      background: config.primaryColor,
      flexShrink: 0,
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}>
      {/* Avatar */}
      <div style={{
        width: "38px", height: "38px",
        borderRadius: "50%",
        flexShrink: 0,
        background: "rgba(255,255,255,0.15)",
        border: "1.5px solid rgba(255,255,255,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}>
        {config.avatarUrl
          ? <img src={config.avatarUrl} alt={config.aiName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "13px", fontWeight: 700, color: config.accentColor, letterSpacing: "-0.02em" }}>
              {initials}
            </span>
        }
      </div>

      {/* Name + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600,
          fontSize: "14px",
          color: config.accentColor,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {config.aiName}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "4px" }}>
          <span style={{
            width: "6px", height: "6px",
            borderRadius: "50%",
            flexShrink: 0,
            background: connected ? "#4ade80" : "rgba(255,255,255,0.35)",
            boxShadow: connected ? "0 0 0 2px rgba(74,222,128,0.30)" : "none",
            transition: "background 0.3s, box-shadow 0.3s",
          }} />
          <span style={{
            fontSize: "11px",
            color: config.accentColor,
            opacity: 0.6,
            fontWeight: 400,
          }}>
            {connected ? "Çevrimiçi" : "Bağlanıyor…"}
          </span>
        </div>
      </div>

      {!embedded && (
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          {onClear && (
            <button
              className="mw-btn-icon"
              onClick={onClear}
              aria-label="Sohbeti Temizle"
              title="Sohbeti temizle"
              style={{ color: config.accentColor }}
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            className="mw-btn-icon"
            onClick={onClose}
            aria-label="Kapat"
            style={{ color: config.accentColor }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Bubbles ───────────────────────────────────────────────────────────────────

const UserBubble = memo(function UserBubble({ content }) {
  return (
    <div className="mw-msg" style={{
      display: "flex", justifyContent: "flex-end",
      marginTop: "8px", paddingLeft: "40px",
    }}>
      <div style={{
        maxWidth: "80%",
        padding: "10px 14px",
        background: "var(--foreground)",
        color: "var(--background)",
        borderRadius: "18px 18px 4px 18px",
        fontSize: "14px", lineHeight: "1.55",
        wordBreak: "break-word",
        fontWeight: 400,
        boxShadow: "0 1px 3px var(--makas-ink-18)",
      }}>
        {content}
      </div>
    </div>
  );
});

const AssistantBubble = memo(function AssistantBubble({ content, streaming, error, config }) {
  const isTyping = streaming && !content;

  return (
    <div className="mw-msg" style={{
      display: "flex", gap: "8px", alignItems: "flex-end",
      marginTop: "8px", paddingRight: "40px",
    }}>
      {/* Mini avatar */}
      <div style={{
        width: "28px", height: "28px",
        borderRadius: "50%",
        flexShrink: 0,
        background: config.primaryColor,
        border: "1.5px solid var(--makas-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "1px",
        boxShadow: "0 1px 4px var(--makas-ink-12)",
        overflow: "hidden",
      }}>
        {config.avatarUrl
          ? <img src={config.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Sparkles size={11} color="var(--sidebar-foreground)" strokeWidth={2.5} />
        }
      </div>

      <div style={{
        maxWidth: "82%",
        padding: error ? "10px 14px" : "10px 14px",
        background: error ? "var(--status-danger-bg)" : "var(--card)",
        color: error ? "var(--status-danger-text)" : "var(--foreground)",
        border: `1px solid ${error ? "var(--status-danger-border)" : "var(--makas-border)"}`,
        borderRadius: "4px 18px 18px 18px",
        fontSize: "14px", lineHeight: "1.6",
        wordBreak: "break-word",
        boxShadow: "0 1px 3px var(--makas-ink-10)",
      }}>
        {isTyping ? (
          <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "3px 2px" }}>
            <span className="mw-dot" />
            <span className="mw-dot" />
            <span className="mw-dot" />
          </div>
        ) : (
          <>
            <RichMarkdown text={content} />
            {streaming && <span className="mw-cursor" />}
          </>
        )}
      </div>
    </div>
  );
});

// ── Markdown renderer ─────────────────────────────────────────────────────────

function RichMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const out   = [];
  let i       = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      out.push(<div key={`cb${i}`} className="mw-pre">{codeLines.join("\n")}</div>);
      i++; continue;
    }

    if (/^---+$/.test(line.trim())) {
      out.push(<hr key={`hr${i}`} className="mw-hr" />);
      i++; continue;
    }

    if (line.startsWith("### ")) { out.push(<div key={i} style={{ fontWeight: 700, fontSize: "13.5px", margin: "6px 0 2px", color: "var(--foreground)" }}><Inline t={line.slice(4)} /></div>); i++; continue; }
    if (line.startsWith("## "))  { out.push(<div key={i} style={{ fontWeight: 700, fontSize: "14.5px", margin: "8px 0 2px", color: "var(--foreground)" }}><Inline t={line.slice(3)} /></div>); i++; continue; }
    if (line.startsWith("# "))   { out.push(<div key={i} style={{ fontWeight: 700, fontSize: "15px",   margin: "8px 0 4px", color: "var(--foreground)" }}><Inline t={line.slice(2)} /></div>); i++; continue; }

    if (/^[-*•] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•] /.test(lines[i])) { items.push(<li key={i}><Inline t={lines[i].slice(2)} /></li>); i++; }
      out.push(<ul key={`ul${i}`} className="mw-list">{items}</ul>);
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(<li key={i}><Inline t={lines[i].replace(/^\d+\. /, "")} /></li>); i++; }
      out.push(<ol key={`ol${i}`} className="mw-list">{items}</ol>);
      continue;
    }

    if (!line.trim()) { out.push(<div key={`sp${i}`} style={{ height: "5px" }} />); i++; continue; }

    out.push(<div key={i} style={{ lineHeight: "1.6" }}><Inline t={line} /></div>);
    i++;
  }

  return <>{out}</>;
}

function Inline({ t }) {
  const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[.+?\]\(.+?\))/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{ fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("*")  && p.endsWith("*"))  return <em key={i}>{p.slice(1, -1)}</em>;
        if (p.startsWith("`")  && p.endsWith("`"))  return <code key={i} className="mw-code">{p.slice(1, -1)}</code>;
        const m = p.match(/^\[(.+?)\]\((.+?)\)$/);
        if (m) return <a key={i} href={m[2]} className="mw-link" target="_blank" rel="noopener noreferrer">{m[1]}</a>;
        return p;
      })}
    </>
  );
}

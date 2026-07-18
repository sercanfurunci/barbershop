"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, User, Bot, ChevronRight, UserCheck, RefreshCw, Send, X, ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";
import { AdminPageHeader } from "@/components/ds";

const CHANNEL_LABEL = { WHATSAPP: "WhatsApp", WEBSITE: "Web", INSTAGRAM: "Instagram", TELEGRAM: "Telegram", AI_CHAT: "AI Chat" };
const STATUS_STYLE  = { OPEN: { bg: "#DCFCE7", color: "#15803D" }, RESOLVED: { bg: "#F3F4F6", color: "#6B7280" }, ABANDONED: { bg: "#FEF2F2", color: "#DC2626" } };
const MODE_STYLE    = { BOT: { bg: "#EFF6FF", color: "#1D4ED8" }, HUMAN: { bg: "#FEF9C3", color: "#854D0E" } };

export default function ConversationsPage() {
  const [view,          setView]          = useState("list"); // "list" | "detail"
  const [selected,      setSelected]      = useState(null);
  const [conversations, setConversations] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [filters,       setFilters]       = useState({ channel: "", status: "OPEN", mode: "" });
  const [search,        setSearch]        = useState("");
  const [error,         setError]         = useState(null);

  const load = useCallback(async (p = 1, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (filters.channel) params.set("channel", filters.channel);
      if (filters.status)  params.set("status",  filters.status);
      if (filters.mode)    params.set("mode",     filters.mode);
      if (s)               params.set("search",   s);
      const data = await apiFetch(`/api/admin/conversations?${params}`);
      setConversations(data.data ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => { load(1); }, [load]);

  function openDetail(conv) { setSelected(conv); setView("detail"); }
  function backToList()     { setSelected(null); setView("list"); load(page); }

  if (view === "detail" && selected) {
    return <ConversationDetail convSummary={selected} onBack={backToList} />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Konuşmalar"
        sub={`${total} konuşma — aktif ve geçmiş kanallar`}
        actions={
          <button onClick={() => load(page)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "transparent", color: C.secondary, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: "13px" }}>
            <RefreshCw size={13} /> Yenile
          </button>
        }
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); load(1, e.target.value); }}
          placeholder="Müşteri veya ID ara…"
          style={{ padding: "7px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "12px", background: "var(--makas-surface)", color: C.primary, minWidth: "200px" }}
        />
        {[
          { key: "channel", options: [["", "Tüm Kanallar"], ["WHATSAPP", "WhatsApp"], ["WEBSITE", "Web"], ["AI_CHAT", "AI Chat"]] },
          { key: "status",  options: [["", "Tüm Durumlar"], ["OPEN", "Açık"], ["RESOLVED", "Çözüldü"], ["ABANDONED", "Terk Edildi"]] },
          { key: "mode",    options: [["", "Tüm Modlar"], ["BOT", "Bot"], ["HUMAN", "İnsan"]] },
        ].map(({ key, options }) => (
          <select
            key={key}
            value={filters[key]}
            onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "12px", background: "var(--makas-surface)", color: C.primary, cursor: "pointer" }}
          >
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {error && <div style={{ padding: "10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

      {loading ? (
        <div style={{ color: C.muted, fontSize: "13px", padding: "20px 0" }}>Yükleniyor…</div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
          <MessageSquare size={32} style={{ marginBottom: "12px", opacity: 0.3 }} />
          <div style={{ fontSize: "14px" }}>Konuşma bulunamadı.</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {conversations.map(conv => {
              const statusStyle = STATUS_STYLE[conv.status] ?? { bg: C.surface, color: C.muted };
              const modeStyle   = MODE_STYLE[conv.mode]     ?? { bg: C.surface, color: C.muted };
              return (
                <div
                  key={conv.id}
                  onClick={() => openDetail(conv)}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px", boxShadow: SHADOW.card, cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.cardHi}
                  onMouseLeave={e => e.currentTarget.style.background = C.card}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {conv.mode === "HUMAN" ? <User size={16} color={C.secondary} /> : <Bot size={16} color={C.secondary} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span style={{ fontWeight: 600, fontSize: "13px", color: C.primary }}>
                          {conv.client?.name ?? conv.externalId?.slice(-8) ?? "Anonim"}
                        </span>
                        <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "999px", background: statusStyle.bg, color: statusStyle.color, fontWeight: 500 }}>{conv.status}</span>
                        <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "999px", background: modeStyle.bg, color: modeStyle.color, fontWeight: 500 }}>{conv.mode}</span>
                        <span style={{ fontSize: "10px", color: C.muted }}>{CHANNEL_LABEL[conv.channel] ?? conv.channel}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.lastMessage?.content ?? "—"}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <span style={{ fontSize: "11px", color: C.muted }}>
                        {conv.messageCount} mesaj
                      </span>
                      <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                        <FeedbackBtns
                          conversationId={conv.id}
                          initial={conv.feedback?.rating ?? null}
                          onChange={rating => setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, feedback: { rating } } : c))}
                        />
                        <ChevronRight size={14} color={C.dim} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
              <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1, fontSize: "12px" }}>‹ Önceki</button>
              <span style={{ fontSize: "12px", color: C.muted, padding: "6px 10px" }}>Sayfa {page} / {Math.ceil(total / 20)}</span>
              <button onClick={() => load(page + 1)} disabled={page * 20 >= total} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, cursor: page * 20 >= total ? "not-allowed" : "pointer", opacity: page * 20 >= total ? 0.5 : 1, fontSize: "12px" }}>Sonraki ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Feedback buttons (row-level) ─────────────────────────────────────────────

function FeedbackBtns({ conversationId, initial, onChange }) {
  const [rating, setRating] = useState(initial);
  const [busy,   setBusy]   = useState(false);

  async function vote(e, r) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch("/api/admin/ai-feedback", {
        method: "POST",
        body: JSON.stringify({ conversationId, rating: r }),
      });
      setRating(r);
      onChange?.(r);
    } catch { /* silent */ }
    finally { setBusy(false); }
  }

  const btn = (r, Icon, tint) => (
    <button
      onClick={e => vote(e, r)}
      disabled={busy}
      title={r === "helpful" ? "Yararlı" : "Yararsız"}
      style={{
        padding: "3px", border: "none", background: "transparent",
        cursor: busy ? "wait" : "pointer",
        color: rating === r ? tint : C.dim, borderRadius: "4px",
      }}
    ><Icon size={12} /></button>
  );

  return (
    <>
      {btn("helpful",     ThumbsUp,   "#15803D")}
      {btn("not_helpful", ThumbsDown, "#DC2626")}
    </>
  );
}

// ── Conversation Detail ───────────────────────────────────────────────────────

function ConversationDetail({ convSummary, onBack }) {
  const [conv,    setConv]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply,   setReply]   = useState("");
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConv(await apiFetch(`/api/admin/conversations/${convSummary.id}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [convSummary.id]);

  useEffect(() => { load(); }, [load]);

  async function handoff(action) {
    try {
      if (action === "reopen") {
        const updated = await apiFetch(`/api/admin/conversations/${conv.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "OPEN" }),
        });
        setConv(c => ({ ...c, ...updated }));
      } else {
        const updated = await apiFetch(`/api/admin/conversations/${conv.id}/handoff`, {
          method: "POST",
          body: JSON.stringify({ action }),
        });
        setConv(c => ({ ...c, ...updated }));
      }
    } catch (e) { setError(e.message); }
  }

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const msg = await apiFetch(`/api/admin/conversations/${conv.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: reply.trim() }),
      });
      setConv(c => ({ ...c, messages: [...(c.messages ?? []), msg] }));
      setReply("");
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  }

  const modeStyle = MODE_STYLE[conv?.mode ?? "BOT"] ?? { bg: C.surface, color: C.muted };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "transparent", color: C.secondary, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: "13px" }}
        >
          <ArrowLeft size={13} /> Geri
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "15px", color: C.primary }}>
            {conv?.client?.name ?? convSummary.externalId?.slice(-8) ?? "Anonim"}
          </div>
          <div style={{ fontSize: "12px", color: C.muted }}>
            {CHANNEL_LABEL[conv?.channel ?? convSummary.channel] ?? conv?.channel} · {conv?.messages?.length ?? 0} mesaj
          </div>
        </div>
        {conv && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "999px", background: modeStyle.bg, color: modeStyle.color, fontWeight: 600 }}>
              {conv.mode === "HUMAN" ? "İnsan Modu" : "Bot Modu"}
            </span>
            {conv.status !== "OPEN" && (
              <button
                onClick={() => handoff("reopen")}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", background: C.primary, color: "var(--makas-bg)", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
              >
                Yeniden Aç
              </button>
            )}
            {conv.status === "OPEN" && conv.mode === "BOT" ? (
              <button
                onClick={() => handoff("takeover")}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", background: C.yellow, color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
              >
                <UserCheck size={13} /> Devral
              </button>
            ) : conv.status === "OPEN" ? (
              <button
                onClick={() => handoff("release")}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", background: C.green, color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
              >
                <Bot size={13} /> Bota Bırak
              </button>
            ) : null}
          </div>
        )}
      </div>

      {error && <div style={{ padding: "10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

      {loading ? (
        <div style={{ color: C.muted, fontSize: "13px", padding: "20px 0" }}>Yükleniyor…</div>
      ) : (
        <>
          {/* Message timeline */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", maxHeight: "480px", overflowY: "auto", boxShadow: SHADOW.card, marginBottom: "12px" }}>
            {conv?.messages?.map(msg => {
              const isBot   = msg.senderType === "BOT";
              const isAgent = msg.senderType === "AGENT";
              const isUser  = msg.senderType === "USER";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex", justifyContent: isUser ? "flex-start" : "flex-end",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{
                    maxWidth: "70%", padding: "10px 13px", borderRadius: isUser ? "12px 12px 12px 2px" : "12px 12px 2px 12px",
                    background: isUser ? C.surface : isAgent ? "#FEF9C3" : "#111",
                    color: isUser ? C.primary : isAgent ? "#854D0E" : "#fff",
                    fontSize: "13px", lineHeight: 1.5,
                  }}>
                    {isAgent && <div style={{ fontSize: "10px", fontWeight: 600, marginBottom: "4px", opacity: 0.7 }}>AGENT</div>}
                    {msg.content}
                    <div style={{ fontSize: "10px", opacity: 0.5, marginTop: "4px", textAlign: "right" }}>
                      {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply input — only in HUMAN mode */}
          {conv?.mode === "HUMAN" && (
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
                placeholder="Müşteriye mesaj yaz…"
                style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, fontSize: "13px", outline: "none" }}
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", background: C.primary, color: "var(--makas-bg)", border: "none", cursor: sending ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500, opacity: sending || !reply.trim() ? 0.5 : 1 }}
              >
                <Send size={13} /> Gönder
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

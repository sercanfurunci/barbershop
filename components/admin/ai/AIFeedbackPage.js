"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Download, ChevronDown, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";
import { AdminPageHeader } from "@/components/ds";

const TABS = [
  { value: "",            label: "Tümü"    },
  { value: "helpful",     label: "Yararlı" },
  { value: "not_helpful", label: "Yararsız" },
];

const CHANNEL_LABEL = {
  WHATSAPP: "WhatsApp", INSTAGRAM: "Instagram", TELEGRAM: "Telegram",
  WEBCHAT: "Web", SMS: "SMS", MANUAL: "Manuel",
};

export default function AIFeedbackPage() {
  const [rows,     setRows]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [rating,   setRating]   = useState("");
  const [expanded, setExpanded] = useState(null);
  const [conv,     setConv]     = useState(null);
  const [convLoad, setConvLoad] = useState(false);

  const LIMIT = 20;

  const load = useCallback(async (p = 1, r = rating) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (r) params.set("rating", r);
      const data = await apiFetch(`/api/admin/ai-feedback?${params}`);
      setRows(data.data ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [rating]);

  useEffect(() => { load(1); }, [load]);

  async function toggleExpand(row) {
    if (expanded === row.id) { setExpanded(null); setConv(null); return; }
    setExpanded(row.id);
    setConv(null);
    if (!row.conversationId) return;
    setConvLoad(true);
    try {
      const d = await apiFetch(`/api/admin/conversations/${row.conversationId}`);
      setConv(d);
    } catch (e) { setError(e.message); }
    finally { setConvLoad(false); }
  }

  function exportBadCsv() {
    const bad = rows.filter(r => r.rating === "not_helpful");
    if (bad.length === 0) return;
    const header = ["conversationId", "channel", "date", "clientName", "comment"];
    const csv = [
      header.join(","),
      ...bad.map(r => [
        r.conversationId,
        r.conversation?.channel ?? "",
        new Date(r.createdAt).toISOString(),
        (r.conversation?.clientName ?? "").replace(/"/g, '""'),
        (r.comment ?? "").replace(/"/g, '""').replace(/\n/g, " "),
      ].map(v => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-feedback-bad-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <AdminPageHeader
        title="AI Geri Bildirim"
        sub="Konuşmalara verilen yararlı/yararsız işaretler"
        actions={
          <button
            onClick={exportBadCsv}
            disabled={rows.filter(r => r.rating === "not_helpful").length === 0}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "6px 12px", borderRadius: "8px", fontSize: "12px",
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.secondary, cursor: "pointer",
            }}
          >
            <Download size={12} /> Yararsızları CSV
          </button>
        }
      />

      <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setRating(t.value); load(1, t.value); }}
            style={{
              padding: "6px 12px", borderRadius: "8px", fontSize: "12px",
              border: `1px solid ${rating === t.value ? C.primary : C.border}`,
              background: rating === t.value ? C.primary : "transparent",
              color: rating === t.value ? "var(--makas-bg)" : C.secondary,
              cursor: "pointer",
            }}
          >{t.label}</button>
        ))}
      </div>

      {error && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

      {loading ? (
        <div style={{ color: C.muted, fontSize: "13px", padding: "20px 0" }}>Yükleniyor…</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
          <MessageSquare size={28} style={{ marginBottom: "10px", opacity: 0.3 }} />
          <div style={{ fontSize: "13px" }}>Geri bildirim yok.</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {rows.map(r => {
              const isOpen = expanded === r.id;
              const pos    = r.rating === "helpful";
              return (
                <div key={r.id} style={{ background: C.card, border: `1px solid ${isOpen ? C.primary : C.border}`, borderRadius: "10px", boxShadow: SHADOW.card, overflow: "hidden" }}>
                  <div
                    onClick={() => toggleExpand(r)}
                    style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
                  >
                    {isOpen ? <ChevronDown size={14} color={C.muted} /> : <ChevronRight size={14} color={C.muted} />}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "3px 8px", borderRadius: "999px",
                      background: pos ? "#DCFCE7" : "#FEF2F2",
                      color:      pos ? "#15803D" : "#DC2626",
                      fontSize: "11px", fontWeight: 600,
                    }}>
                      {pos ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
                      {pos ? "Yararlı" : "Yararsız"}
                    </span>
                    <span style={{ fontSize: "11px", color: C.muted }}>
                      {CHANNEL_LABEL[r.conversation?.channel] ?? r.conversation?.channel ?? "—"}
                    </span>
                    <span style={{ fontSize: "11px", color: C.muted }}>
                      {r.conversation?.clientName ?? "—"}
                    </span>
                    <span style={{ flex: 1, fontSize: "12px", color: C.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.comment ?? <span style={{ color: C.muted }}>Yorum yok</span>}
                    </span>
                    <span style={{ fontSize: "10px", color: C.muted, flexShrink: 0 }}>
                      {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${C.border}`, background: C.surface, padding: "12px 14px" }}>
                      {convLoad && <div style={{ color: C.muted, fontSize: "12px" }}>Konuşma yükleniyor…</div>}
                      {conv && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" }}>
                          {conv.messages?.map(m => (
                            <div key={m.id} style={{
                              alignSelf: m.direction === "OUTBOUND" ? "flex-end" : "flex-start",
                              maxWidth: "80%",
                              background: m.direction === "OUTBOUND" ? C.primary : C.card,
                              color:      m.direction === "OUTBOUND" ? "var(--makas-bg)" : C.primary,
                              border: `1px solid ${C.border}`,
                              borderRadius: "8px", padding: "6px 10px", fontSize: "11px", lineHeight: 1.5,
                            }}>
                              <div>{m.content}</div>
                              <div style={{ fontSize: "9px", opacity: 0.7, marginTop: "3px" }}>
                                {m.senderType} · {new Date(m.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          ))}
                          {conv.messages?.length === 0 && <div style={{ color: C.muted, fontSize: "12px" }}>Mesaj yok.</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px", alignItems: "center" }}>
              <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1, fontSize: "12px" }}>‹ Önceki</button>
              <span style={{ fontSize: "12px", color: C.muted, padding: "6px 10px" }}>Sayfa {page} / {totalPages}</span>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1, fontSize: "12px" }}>Sonraki ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

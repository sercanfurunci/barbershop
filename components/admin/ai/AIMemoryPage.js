"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Save, X, Brain, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";
import { AdminPageHeader } from "@/components/ds";

const inputStyle = {
  width: "100%", padding: "7px 10px", borderRadius: "7px",
  border: `1px solid ${C.border}`, background: C.surface,
  color: C.primary, fontSize: "12px", boxSizing: "border-box",
};

export default function AIMemoryPage() {
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [editing, setEditing] = useState(null); // id
  const [form,    setForm]    = useState(null);
  const [error,   setError]   = useState(null);

  const LIMIT = 20;

  const load = useCallback(async (p = 1, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (s) params.set("search", s);
      const data = await apiFetch(`/api/admin/ai-memory?${params}`);
      setRows(data.data ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);

  function openEdit(row) {
    setForm({
      id: row.id,
      hairNotes:      row.hairNotes ?? "",
      allergies:      row.allergies ?? "",
      preferredDays:  (row.preferredDays  ?? []).join(", "),
      preferredTimes: (row.preferredTimes ?? []).join(", "),
      communication:  row.communication ?? "standard",
      language:       row.language ?? "tr",
    });
    setEditing(row.id);
  }

  async function save() {
    try {
      const body = {
        hairNotes: form.hairNotes,
        allergies: form.allergies,
        preferredDays:  form.preferredDays.split(",").map(s => s.trim()).filter(Boolean),
        preferredTimes: form.preferredTimes.split(",").map(s => s.trim()).filter(Boolean),
        communication:  form.communication,
        language:       form.language,
      };
      await apiFetch(`/api/admin/ai-memory/${form.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setEditing(null);
      load(page);
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm("Bu hafıza kaydını silmek istediğinizden emin misiniz?")) return;
    try {
      await apiFetch(`/api/admin/ai-memory/${id}`, { method: "DELETE" });
      setRows(prev => prev.filter(r => r.id !== id));
      setTotal(t => t - 1);
    } catch (e) { setError(e.message); }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <AdminPageHeader title="AI Müşteri Hafızası" sub="Tekrar eden müşterilere ait AI tarafından toplanan bilgiler" />

      <div style={{ position: "relative", marginBottom: "16px", maxWidth: "300px" }}>
        <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); load(1, e.target.value); }}
          placeholder="Telefonda ara…"
          style={{ ...inputStyle, paddingLeft: "30px" }}
        />
      </div>

      {error && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

      {loading ? (
        <div style={{ color: C.muted, fontSize: "13px", padding: "20px 0" }}>Yükleniyor…</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
          <Brain size={28} style={{ marginBottom: "10px", opacity: 0.3 }} />
          <div style={{ fontSize: "13px" }}>Kayıt bulunamadı.</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {rows.map(r => (
              <div key={r.id} style={{ background: C.card, border: `1px solid ${editing === r.id ? C.primary : C.border}`, borderRadius: "10px", padding: "12px 14px", boxShadow: SHADOW.card }}>
                {editing === r.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <label style={{ fontSize: "10px", color: C.muted }}>Tercih Edilen Günler (virgülle)</label>
                        <input value={form.preferredDays} onChange={e => setForm(f => ({ ...f, preferredDays: e.target.value }))} placeholder="monday, wednesday" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontSize: "10px", color: C.muted }}>Tercih Edilen Saatler</label>
                        <input value={form.preferredTimes} onChange={e => setForm(f => ({ ...f, preferredTimes: e.target.value }))} placeholder="morning, afternoon" style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", color: C.muted }}>Saç Notları</label>
                      <textarea rows={2} value={form.hairNotes} onChange={e => setForm(f => ({ ...f, hairNotes: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", color: C.muted }}>Alerjiler</label>
                      <textarea rows={2} value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <label style={{ fontSize: "10px", color: C.muted }}>İletişim</label>
                        <select value={form.communication} onChange={e => setForm(f => ({ ...f, communication: e.target.value }))} style={inputStyle}>
                          <option value="standard">Standart</option>
                          <option value="brief">Kısa</option>
                          <option value="detailed">Ayrıntılı</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "10px", color: C.muted }}>Dil</label>
                        <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} style={inputStyle}>
                          <option value="tr">Türkçe</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button onClick={() => setEditing(null)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "7px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, fontSize: "12px", cursor: "pointer" }}><X size={12} /> İptal</button>
                      <button onClick={save} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "7px", border: "none", background: C.primary, color: "var(--makas-bg)", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}><Save size={12} /> Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>{r.senderPhone}</span>
                        <span style={{ fontSize: "10px", color: C.muted }}>{r.language?.toUpperCase()}</span>
                        <span style={{ fontSize: "10px", color: C.muted }}>{new Date(r.updatedAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: C.secondary, lineHeight: 1.6 }}>
                        {r.favoriteBarberName && <div>Berber: <strong>{r.favoriteBarberName}</strong></div>}
                        {r.favoriteServiceName && <div>Hizmet: <strong>{r.favoriteServiceName}</strong></div>}
                        {r.preferredDays?.length > 0 && <div>Günler: {r.preferredDays.join(", ")}</div>}
                        {r.preferredTimes?.length > 0 && <div>Saatler: {r.preferredTimes.join(", ")}</div>}
                        {r.hairNotes && <div>Saç: {r.hairNotes}</div>}
                        {r.allergies && <div style={{ color: "#DC2626" }}>⚠ Alerji: {r.allergies}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                      <button onClick={() => openEdit(r)} style={{ padding: "6px 10px", border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.secondary, borderRadius: "6px", fontSize: "11px" }}>Düzenle</button>
                      <button onClick={() => remove(r.id)} style={{ padding: "6px", border: "none", background: "transparent", cursor: "pointer", color: "#DC2626", borderRadius: "6px" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
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

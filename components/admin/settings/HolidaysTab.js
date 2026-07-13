"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { todayStr } from "@/lib/utils";
import { C } from "@/lib/adminTheme";

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: "10px", color: C.dim, marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}

function HolidayRow({ h, onDelete, last }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: last ? "none" : `1px solid ${C.border}` }}>
      <div style={{ width: "44px", height: "44px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ fontSize: "13px", color: C.primary, fontWeight: 600, lineHeight: 1 }}>{h.date.slice(8)}</div>
        <div style={{ fontSize: "8px", color: C.muted, marginTop: "1px" }}>
          {new Date(h.date + "T12:00:00").toLocaleDateString("tr-TR", { month: "short" })}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>{h.label}</div>
        <div style={{ fontSize: "11px", color: C.secondary, marginTop: "1px" }}>
          {h.barber ? h.barber.nameTr : "Tüm Dükkan"} · {new Date(h.date + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long" })}
        </div>
      </div>
      {confirming ? (
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button onClick={() => { onDelete(h.id); setConfirming(false); }}
            style={{ padding: "5px 10px", borderRadius: "6px", background: "rgba(17,17,17,0.15)", border: "1px solid rgba(17,17,17,0.3)", fontSize: "11px", color: C.primary, cursor: "pointer", fontWeight: 600 }}>
            Sil
          </button>
          <button onClick={() => setConfirming(false)}
            style={{ padding: "5px 10px", borderRadius: "6px", background: C.surface, border: `1px solid ${C.border}`, fontSize: "11px", color: C.secondary, cursor: "pointer" }}>
            İptal
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)}
          style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${C.border}`, borderRadius: "6px", cursor: "pointer", color: C.muted, flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(17,17,17,0.3)"; e.currentTarget.style.color = C.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

export default function HolidaysTab() {
  const [holidays, setHolidays]   = useState([]);
  const [barbers, setBarbers]     = useState([]);
  const [date, setDate]           = useState("");
  const [label, setLabel]         = useState("");
  const [barberId, setBarberId]   = useState(""); // "" = shop-wide
  const [adding, setAdding]       = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(() => {
    apiFetch("/api/admin/holidays").then(setHolidays).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    apiFetch("/api/admin/working-hours").then(setBarbers).catch(() => {});
  }, [load]);

  async function addHoliday(e) {
    e.preventDefault();
    if (!date) return;
    setAdding(true); setError(null);
    try {
      await apiFetch("/api/admin/holidays", {
        method: "POST",
        body: JSON.stringify({ date, label: label || "Tatil", barberId: barberId || null }),
      });
      setDate(""); setLabel(""); setBarberId("");
      load();
    } catch (err) {
      setError(err.message);
    } finally { setAdding(false); }
  }

  async function deleteHoliday(id) {
    await apiFetch(`/api/admin/holidays/${id}`, { method: "DELETE" });
    setHolidays(prev => prev.filter(h => h.id !== id));
  }

  const today = todayStr();
  const upcoming = holidays.filter(h => h.date >= today);
  const past     = holidays.filter(h => h.date < today);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
      {/* Holiday list */}
      <div>
        {holidays.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.2 }}>📅</div>
            <div style={{ fontSize: "13px", color: C.secondary }}>Tanımlı tatil günü yok</div>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: "10px", color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Yaklaşan Tatiller · {upcoming.length}
                </div>
                {upcoming.map((h, i) => (
                  <HolidayRow key={h.id} h={h} onDelete={deleteHoliday} last={i === upcoming.length - 1} />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden", opacity: 0.6 }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: "10px", color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Geçmiş Tatiller · {past.length}
                </div>
                {past.map((h, i) => (
                  <HolidayRow key={h.id} h={h} onDelete={deleteHoliday} last={i === past.length - 1} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add holiday form */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "18px" }}>
        <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, marginBottom: "16px" }}>Tatil Ekle</div>

        <form onSubmit={addHoliday} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {error && (
            <div style={{ background: "rgba(17,17,17,0.1)", border: "1px solid rgba(17,17,17,0.3)", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: C.primary }}>
              {error}
            </div>
          )}

          <Field label="Tarih">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              min={today}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "9px 14px", fontSize: "13px", color: C.primary, outline: "none", colorScheme: "dark", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = `${C.primary}60`}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </Field>

          <Field label="Açıklama">
            <input type="text" placeholder="Örn: Kurban Bayramı" value={label} onChange={e => setLabel(e.target.value)}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "9px 14px", fontSize: "13px", color: C.primary, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = `${C.primary}60`}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </Field>

          <Field label="Berber (boş = tüm dükkan)">
            <div style={{ position: "relative" }}>
              <select value={barberId} onChange={e => setBarberId(e.target.value)}
                style={{ width: "100%", appearance: "none", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "9px 32px 9px 14px", fontSize: "13px", color: C.primary, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
              >
                <option value="">Tüm Dükkan</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.nameTr}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
            </div>
          </Field>

          <button type="submit" disabled={adding || !date}
            className="flex items-center justify-center gap-2 w-full"
            style={{ background: adding || !date ? C.dim : C.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: adding || !date ? "not-allowed" : "pointer" }}
          >
            <Plus size={14} />
            {adding ? "Ekleniyor…" : "Tatil Ekle"}
          </button>
        </form>
      </div>
    </div>
  );
}

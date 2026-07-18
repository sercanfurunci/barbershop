"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, CA } from "@/lib/adminTheme";
import { DAYS, TIME_OPTIONS } from "./_constants";

function TimeSelect({ value, onChange }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <select
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: "none", WebkitAppearance: "none",
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: "6px", padding: "6px 28px 6px 10px",
          fontSize: "13px", color: C.primary, cursor: "pointer", outline: "none",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {TIME_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} style={{ position: "absolute", right: "8px", color: C.muted, pointerEvents: "none" }} />
    </div>
  );
}

export default function WorkingHoursTab() {
  const [barbers, setBarbers]         = useState([]);
  const [selectedId, setSelectedId]   = useState(null);
  const [hours, setHours]             = useState({}); // { mon: { start: 540, end: 1080 }, ... }
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null); // "success" | "error"

  useEffect(() => {
    apiFetch("/api/admin/working-hours")
      .then(data => {
        setBarbers(data);
        if (data.length > 0) { setSelectedId(data[0].id); loadHours(data[0]); }
      }).catch(() => {});
  }, []);

  function loadHours(barber) {
    const wh = barber.workingHours || {};
    const h = {};
    for (const d of DAYS) {
      h[d.key] = {
        start: wh[`${d.key}Start`] ?? null,
        end:   wh[`${d.key}End`]   ?? null,
      };
    }
    setHours(h);
  }

  function selectBarber(b) {
    setSelectedId(b.id);
    loadHours(b);
    setToast(null);
  }

  function setDay(dayKey, field, value) {
    setHours(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value === "" ? null : Number(value) },
    }));
  }

  function toggleDayOff(dayKey) {
    const isOff = hours[dayKey]?.start == null;
    setHours(prev => ({
      ...prev,
      [dayKey]: isOff ? { start: 540, end: 1080 } : { start: null, end: null },
    }));
  }

  async function save() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await apiFetch("/api/admin/working-hours", {
        method: "PATCH",
        body: JSON.stringify({ barberId: selectedId, ...hours }),
      });
      setToast("success");
      // Update local barbers list
      setBarbers(prev => prev.map(b => b.id !== selectedId ? b : {
        ...b,
        workingHours: { ...b.workingHours, ...Object.fromEntries(
          DAYS.flatMap(d => [[`${d.key}Start`, hours[d.key]?.start ?? null], [`${d.key}End`, hours[d.key]?.end ?? null]])
        )},
      }));
    } catch {
      setToast("error");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  const selectedBarber = barbers.find(b => b.id === selectedId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-5">
      {/* Barber list */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontSize: "10px", color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Berber Seç
        </div>
        {barbers.map(b => (
          <button key={b.id} onClick={() => selectBarber(b)}
            className="w-full flex items-center gap-3"
            style={{
              padding: "12px 14px", background: b.id === selectedId ? CA.ink12 : "transparent",
              border: "none", cursor: "pointer", transition: "all 0.15s", textAlign: "left",
            }}
            onMouseEnter={e => { if (b.id !== selectedId) e.currentTarget.style.background = C.surface; }}
            onMouseLeave={e => { if (b.id !== selectedId) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ width: "32px", height: "32px", background: C.primary, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "var(--makas-bg)", flexShrink: 0 }}>
              {b.avatar}
            </div>
            <div>
              <div style={{ fontSize: "13px", color: b.id === selectedId ? C.primary : C.secondary, fontWeight: b.id === selectedId ? 500 : 400 }}>{b.nameTr}</div>
              <div style={{ fontSize: "10px", color: C.muted }}>{b.titleTr}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Hours editor */}
      {selectedBarber && (
        <div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", color: C.primary, fontWeight: 500 }}>{selectedBarber.nameTr}</div>
                <div style={{ fontSize: "11px", color: C.secondary, marginTop: "1px" }}>Haftalık çalışma saatleri</div>
              </div>
              {toast === "success" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2" style={{ fontSize: "12px", color: "#15803D" }}>
                  <CheckCircle size={14} /> Kaydedildi
                </motion.div>
              )}
              {toast === "error" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2" style={{ fontSize: "12px", color: "#111111" }}>
                  <AlertCircle size={14} /> Hata
                </motion.div>
              )}
            </div>

            <div style={{ padding: "8px 0" }}>
              {DAYS.map((d, i) => {
                const dayHours = hours[d.key] || { start: null, end: null };
                const isOff = dayHours.start == null;
                return (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 18px", borderBottom: i < DAYS.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    {/* Day name */}
                    <div style={{ width: "90px", flexShrink: 0 }}>
                      <span style={{ fontSize: "13px", color: isOff ? C.muted : C.primary }}>{d.label}</span>
                    </div>

                    {/* Toggle */}
                    <button onClick={() => toggleDayOff(d.key)}
                      style={{ width: "38px", height: "20px", borderRadius: "10px", border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s",
                        background: isOff ? C.dim : C.primary }}
                    >
                      <div style={{ position: "absolute", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: isOff ? "2px" : "20px" }} />
                    </button>

                    {isOff ? (
                      <span style={{ fontSize: "12px", color: C.muted }}>Kapalı</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                        <TimeSelect value={dayHours.start} onChange={v => setDay(d.key, "start", v)} />
                        <span style={{ fontSize: "12px", color: C.muted }}>–</span>
                        <TimeSelect value={dayHours.end} onChange={v => setDay(d.key, "end", v)} />
                        <span style={{ fontSize: "11px", color: C.muted, marginLeft: "4px" }}>
                          {dayHours.start != null && dayHours.end != null
                            ? `${Math.floor((dayHours.end - dayHours.start) / 60)} sa`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2"
            style={{
              background: saving ? C.dim : C.primary, color: "var(--makas-bg)", border: "none",
              borderRadius: "8px", padding: "10px 20px", fontSize: "13px",
              fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            <Save size={14} />
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      )}
    </div>
  );
}

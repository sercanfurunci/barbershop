"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { todayStr } from "@/lib/utils";
import { Clock, Calendar, Plus, Trash2, Save, CheckCircle, AlertCircle, ChevronDown, Store, QrCode, Download, Copy, Upload, X, Image as ImageIcon, MapPin, GripVertical } from "lucide-react";
import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { C, SHADOW } from "@/lib/adminTheme";

const DAYS = [
  { key: "mon", label: "Pazartesi" },
  { key: "tue", label: "Salı"      },
  { key: "wed", label: "Çarşamba"  },
  { key: "thu", label: "Perşembe"  },
  { key: "fri", label: "Cuma"      },
  { key: "sat", label: "Cumartesi" },
  { key: "sun", label: "Pazar"     },
];

// Generate 30-min intervals 06:00–23:30
const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const val = h * 60 + m;
      opts.push({ value: val, label: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}` });
    }
  }
  return opts;
})();

function minToStr(min) {
  if (min == null) return "";
  return `${String(Math.floor(min / 60)).padStart(2,"0")}:${String(min % 60).padStart(2,"0")}`;
}

const TABS = [
  { id: "profile",  label: "Salon Profili",     icon: Store    },
  { id: "hours",    label: "Çalışma Saatleri",  icon: Clock    },
  { id: "holidays", label: "Tatil Günleri",      icon: Calendar },
  { id: "rules",    label: "Randevu Kuralları",  icon: Clock    },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "26px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em" }}>Ayarlar</h1>
        <p style={{ fontSize: "13px", color: C.secondary, marginTop: "3px" }}>Çalışma saatleri, tatil günleri ve randevu kuralları</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "4px" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              padding: "9px 12px", borderRadius: "7px", border: "none", cursor: "pointer",
              background: activeTab === id ? C.surface : "transparent",
              color: activeTab === id ? C.primary : C.secondary,
              fontSize: "13px", fontWeight: activeTab === id ? 500 : 400,
              transition: "all 0.15s",
              boxShadow: activeTab === id ? "0 1px 4px rgba(17,17,17,0.12)" : "none",
            }}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "profile"  && <ShopProfileTab />}
          {activeTab === "hours"    && <WorkingHoursTab />}
          {activeTab === "holidays" && <HolidaysTab />}
          {activeTab === "rules"    && <RulesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Working Hours Tab ──────────────────────────────────────────────────────── */

function WorkingHoursTab() {
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
              padding: "12px 14px", background: b.id === selectedId ? `${C.primary}12` : "transparent",
              border: "none", cursor: "pointer", transition: "all 0.15s", textAlign: "left",
            }}
            onMouseEnter={e => { if (b.id !== selectedId) e.currentTarget.style.background = C.surface; }}
            onMouseLeave={e => { if (b.id !== selectedId) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ width: "32px", height: "32px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
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
              background: saving ? C.dim : C.primary, color: "#fff", border: "none",
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

/* ─── Holidays Tab ────────────────────────────────────────────────────────── */

function HolidaysTab() {
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

  // Group holidays by month
  const grouped = holidays.reduce((acc, h) => {
    const month = h.date.slice(0, 7); // "2026-06"
    if (!acc[month]) acc[month] = [];
    acc[month].push(h);
    return acc;
  }, {});

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
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "8px 12px", fontSize: "13px", color: C.primary, outline: "none", colorScheme: "dark", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = `${C.primary}60`}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </Field>

          <Field label="Açıklama">
            <input type="text" placeholder="Örn: Kurban Bayramı" value={label} onChange={e => setLabel(e.target.value)}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "8px 12px", fontSize: "13px", color: C.primary, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = `${C.primary}60`}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </Field>

          <Field label="Berber (boş = tüm dükkan)">
            <div style={{ position: "relative" }}>
              <select value={barberId} onChange={e => setBarberId(e.target.value)}
                style={{ width: "100%", appearance: "none", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "8px 32px 8px 12px", fontSize: "13px", color: C.primary, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
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

/* ─── Rules Tab ───────────────────────────────────────────────────────────── */

function RulesTab() {
  const [rules, setRules] = useState({
    slotInterval: 30,
    bufferBefore: 60,
    maxDaysAhead: 30,
    minLeadHours: 1,
  });
  const [saved, setSaved] = useState(false);

  function save() {
    // Save to localStorage for now (DB model not yet added)
    localStorage.setItem("makas-rules", JSON.stringify(rules));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem("makas-rules");
      if (stored) setRules(JSON.parse(stored));
    } catch {}
  }, []);

  const RULE_FIELDS = [
    {
      key: "slotInterval", label: "Slot Aralığı",
      desc: "Randevular arasındaki minimum süre",
      unit: "dk", options: [15, 20, 30, 45, 60],
    },
    {
      key: "bufferBefore", label: "Bugün için tampon süresi",
      desc: "Bugün için en erken şu kadar dakika sonrasına rezervasyon",
      unit: "dk", options: [0, 30, 60, 90, 120],
    },
    {
      key: "maxDaysAhead", label: "Maksimum ileri rezervasyon",
      desc: "Müşteriler en fazla bu kadar gün ileriye rezervasyon yapabilir",
      unit: "gün", options: [7, 14, 30, 60, 90],
    },
    {
      key: "minLeadHours", label: "Minimum önceden rezervasyon",
      desc: "Randevu saatinden en az bu kadar saat önce rezervasyon yapılmalı",
      unit: "saat", options: [0, 1, 2, 3, 4, 6, 12, 24],
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "14px", color: C.primary, fontWeight: 500 }}>Randevu Kuralları</div>
          <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>Rezervasyon ve zaman yönetimi ayarları</div>
        </div>
        <div style={{ padding: "8px 0" }}>
          {RULE_FIELDS.map((f, i) => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px", borderBottom: i < RULE_FIELDS.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, marginBottom: "2px" }}>{f.label}</div>
                <div style={{ fontSize: "11px", color: C.secondary }}>{f.desc}</div>
              </div>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <select value={rules[f.key]} onChange={e => setRules(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                  style={{ appearance: "none", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "7px 32px 7px 12px", fontSize: "13px", color: C.primary, cursor: "pointer", outline: "none", fontFamily: "'DM Mono', monospace" }}
                >
                  {f.options.map(o => <option key={o} value={o}>{o} {f.unit}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <button onClick={save}
          className="flex items-center justify-center gap-2 w-full"
          style={{ background: C.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          <Save size={14} />
          Kaydet
        </button>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 justify-center" style={{ fontSize: "12px", color: "#15803D" }}>
            <CheckCircle size={13} /> Kaydedildi
          </motion.div>
        )}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Mevcut Özet</div>
          {RULE_FIELDS.map(f => (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: C.secondary }}>{f.label}</span>
              <span style={{ fontSize: "12px", color: C.primary, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>{rules[f.key]} {f.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Shop Profile Tab ────────────────────────────────────────────────────── */

const SHOP_TYPE_OPTIONS = [
  { value: "",       label: "Seçiniz" },
  { value: "male",   label: "Erkek"   },
  { value: "female", label: "Kadın"   },
  { value: "unisex", label: "Unisex"  },
];

const ABOUT_MAX = 500;

function ShopProfileTab() {
  const empty = {
    name: "", ownerName: "", foundedYear: "", shopType: "",
    phone: "", whatsappNumber: "", email: "",
    addressLine: "", city: "", latitude: "", longitude: "",
    description: "", about: "",
    instagramUrl: "", facebookUrl: "", tiktokUrl: "",
    googlePlaceId: "", googlePlacesKey: "", mapsEmbed: "",
  };
  const [form, setForm]     = useState(empty);
  const [slug, setSlug]     = useState(null);
  const [logo, setLogo]     = useState(null);
  const [cover, setCover]   = useState(null);
  const [gallery, setGallery] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    apiFetch("/api/admin/shop")
      .then(shop => {
        setSlug(shop.slug ?? null);
        setLogo(shop.logo ?? null);
        setCover(shop.coverImage ?? null);
        setGallery(shop.gallery ?? []);
        setForm({
          name:            shop.name            ?? "",
          ownerName:       shop.ownerName       ?? "",
          foundedYear:     shop.foundedYear     ?? "",
          shopType:        shop.shopType        ?? "",
          phone:           shop.phone           ?? "",
          whatsappNumber:  shop.whatsappNumber  ?? "",
          email:           shop.email           ?? "",
          addressLine:     shop.addressLine     ?? shop.address ?? "",
          city:            shop.city            ?? "",
          latitude:        shop.latitude        ?? "",
          longitude:       shop.longitude       ?? "",
          description:     shop.description     ?? "",
          about:           shop.about           ?? "",
          instagramUrl:    shop.instagramUrl    ?? shop.social?.instagram ?? "",
          facebookUrl:     shop.facebookUrl     ?? shop.social?.facebook  ?? "",
          tiktokUrl:       shop.tiktokUrl       ?? shop.social?.tiktok    ?? "",
          googlePlaceId:   shop.googlePlaceId   ?? "",
          googlePlacesKey: shop.googlePlacesKey ?? "",
          mapsEmbed:       shop.mapsEmbed       ?? "",
        });
        setLoaded(true);
      })
      .catch(() => { setLoaded(true); });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true); setToast(null);
    try {
      const body = { ...form };
      // Cast empty strings on numeric fields to null so server doesn't reject.
      body.foundedYear = form.foundedYear === "" ? null : Number(form.foundedYear);
      body.latitude    = form.latitude    === "" ? null : Number(form.latitude);
      body.longitude   = form.longitude   === "" ? null : Number(form.longitude);
      await apiFetch("/api/admin/shop", { method: "PATCH", body: JSON.stringify(body) });
      setToast("success");
    } catch (err) {
      setToast(err.message || "Hata");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  }

  if (!loaded) return <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>Yükleniyor…</div>;

  const fi = { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "8px 12px", fontSize: "13px", color: C.primary, outline: "none", boxSizing: "border-box" };
  const aboutLen = (form.about ?? "").length;

  // Content completeness — % of meaningful profile fields filled. Drives empty-state nudging.
  const checks = [
    { label: "Logo",     done: !!logo },
    { label: "Kapak",    done: !!cover },
    { label: "Hakkımızda", done: !!form.about?.trim() },
    { label: "Galeri",   done: gallery.length > 0 },
    { label: "Telefon",  done: !!form.phone?.trim() },
    { label: "Adres",    done: !!form.addressLine?.trim() || !!form.city?.trim() },
    { label: "WhatsApp", done: !!form.whatsappNumber?.trim() },
    { label: "Sosyal",   done: !!(form.instagramUrl || form.facebookUrl || form.tiktokUrl) },
  ];
  const completeness = Math.round((checks.filter(c => c.done).length / checks.length) * 100);

  return (
    <form onSubmit={save}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>

        {/* Completeness score */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px",
          padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>Profil Tamamlanma</div>
            <div style={{ fontSize: "20px", fontWeight: 300, color: completeness === 100 ? "#16a34a" : C.primary, letterSpacing: "-0.01em" }}>
              {completeness}%
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: C.surface, overflow: "hidden" }}>
            <div style={{
              width: `${completeness}%`, height: "100%",
              background: completeness === 100 ? "#16a34a" : C.primary,
              transition: "width 0.3s ease",
            }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {checks.map(c => (
              <span key={c.label} style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 100,
                background: c.done ? "rgba(22,163,74,0.10)" : C.surface,
                color: c.done ? "#15803d" : C.muted,
                border: `1px solid ${c.done ? "rgba(22,163,74,0.22)" : C.border}`,
                letterSpacing: "0.02em",
              }}>
                {c.done ? "✓ " : ""}{c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Brand assets */}
        <Section title="Logo & Kapak">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(160px, 200px) 1fr", gap: "16px" }}
               className="!grid-cols-1 sm:!grid-cols-[minmax(160px,200px)_1fr]">
            <UploadField
              label="Logo"
              endpoint="/api/admin/shop/logo"
              current={logo}
              aspect="1 / 1"
              onChange={setLogo}
              hint="512×512 önerilir"
            />
            <UploadField
              label="Kapak görseli"
              endpoint="/api/admin/shop/cover"
              current={cover}
              aspect="16 / 9"
              onChange={setCover}
              hint="Hero alanında gözükür (1920×1080)"
            />
          </div>
        </Section>

        {/* Basic info */}
        <Section title="Temel Bilgiler">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <Field label="Salon Adı *">
              <input required value={form.name} onChange={set("name")} style={fi} />
            </Field>
            <Field label="Salon Sahibi">
              <input value={form.ownerName} onChange={set("ownerName")} placeholder="Ad Soyad" style={fi} />
            </Field>
            <Field label="Kuruluş Yılı">
              <input type="number" min="1900" max={new Date().getFullYear() + 1} value={form.foundedYear} onChange={set("foundedYear")} placeholder="2015" style={fi} />
            </Field>
            <Field label="Salon Tipi">
              <select value={form.shopType} onChange={set("shopType")} style={fi}>
                {SHOP_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Telefon">
              <input value={form.phone} onChange={set("phone")} placeholder="0532 123 45 67" style={fi} />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsappNumber} onChange={set("whatsappNumber")} placeholder="+90 532 123 45 67" style={fi} />
            </Field>
            <Field label="E-posta">
              <input type="email" value={form.email} onChange={set("email")} style={fi} />
            </Field>
          </div>
        </Section>

        {/* About */}
        <Section title="Hakkımızda">
          <Field label={`Uzun açıklama (${aboutLen}/${ABOUT_MAX})`} hint="Salon sayfasında 'Hakkımızda' bölümünde gözükür">
            <textarea
              value={form.about}
              onChange={(e) => setForm(f => ({ ...f, about: e.target.value.slice(0, ABOUT_MAX) }))}
              rows={5}
              placeholder="Salonunuzun hikayesi, vizyonu, müşterilere verdiği değerler…"
              style={{ ...fi, resize: "vertical", lineHeight: 1.6 }}
            />
          </Field>
          <Field label="Kısa açıklama" hint="Sayfa metası / OG için kullanılır">
            <textarea value={form.description} onChange={set("description")} rows={2}
              placeholder="Salonunuz hakkında 1-2 cümlelik özet"
              style={{ ...fi, resize: "vertical", lineHeight: 1.6 }} />
          </Field>
        </Section>

        {/* Social */}
        <Section title="Sosyal Medya">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <SocialLinkField label="Instagram" value={form.instagramUrl} onChange={set("instagramUrl")} placeholder="https://instagram.com/…" fi={fi} />
            <SocialLinkField label="Facebook"  value={form.facebookUrl}  onChange={set("facebookUrl")}  placeholder="https://facebook.com/…"  fi={fi} />
            <SocialLinkField label="TikTok"    value={form.tiktokUrl}    onChange={set("tiktokUrl")}    placeholder="https://tiktok.com/@…"   fi={fi} />
          </div>
        </Section>

        {/* Location */}
        <Section title="Konum">
          <Field label="Adres">
            <input value={form.addressLine} onChange={set("addressLine")} placeholder="Mahalle, Cadde, No" style={fi} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field label="Şehir">
              <input value={form.city} onChange={set("city")} placeholder="İstanbul" style={fi} />
            </Field>
            <Field label="Enlem (lat)" hint="Mini harita için">
              <input value={form.latitude} onChange={set("latitude")} placeholder="41.0082" inputMode="decimal" style={fi} />
            </Field>
            <Field label="Boylam (lng)">
              <input value={form.longitude} onChange={set("longitude")} placeholder="28.9784" inputMode="decimal" style={fi} />
            </Field>
          </div>
        </Section>

        {/* Gallery */}
        <Section title={`Galeri (${gallery.length}/12)`}>
          <GalleryGrid items={gallery} onChange={setGallery} />
        </Section>

        {/* Google / Maps */}
        <Section title="Google & Harita">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <Field label="Google Place ID" hint="Google'da işletme sayfanızın Place ID'si">
              <input value={form.googlePlaceId} onChange={set("googlePlaceId")} placeholder="ChIJ…" style={fi} />
            </Field>
            <Field label="Google Places API Key" hint="Boş bırakırsanız platform anahtarı kullanılır">
              <input value={form.googlePlacesKey} onChange={set("googlePlacesKey")} placeholder="AIza…" type="password" style={fi} />
            </Field>
          </div>
          <Field label="Google Maps Embed URL" hint="Google Maps → Haritayı paylaş → Haritayı yerleştir bağlantısı">
            <input value={form.mapsEmbed} onChange={set("mapsEmbed")} placeholder="https://www.google.com/maps/embed?pb=…" style={fi} />
          </Field>
        </Section>

        {/* QR & public link */}
        {slug && <QRSection slug={slug} />}

        {/* Save bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="submit" disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: saving ? C.dim : C.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
            <Save size={14} />
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {toast === "success" && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#15803D" }}>
              <CheckCircle size={14} /> Kaydedildi
            </motion.div>
          )}
          {toast && toast !== "success" && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: C.primary }}>
              <AlertCircle size={14} /> {toast}
            </motion.div>
          )}
        </div>
      </div>
    </form>
  );
}

/* ─── Reusable: UploadField (cover, logo) ─────────────────────────────────── */

function UploadField({ label, endpoint, current, aspect = "1 / 1", onChange, hint }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Sadece görsel yükleyin"); return; }
    if (file.size > 5 * 1024 * 1024)     { setErr("5 MB'dan büyük olamaz");   return; }
    setBusy(true); setErr(null);
    try {
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(file);
      });
      const r = await apiFetch(endpoint, { method: "POST", body: JSON.stringify({ dataUrl }) });
      onChange(Object.values(r)[0]);
    } catch (ex) {
      setErr(ex.message || "Yüklenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Görseli silmek istediğine emin misin?")) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(endpoint, { method: "DELETE" });
      onChange(null);
    } catch (ex) {
      setErr(ex.message || "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div style={{
        position: "relative", aspectRatio: aspect, width: "100%",
        background: C.surface, border: `1px dashed ${C.border}`, borderRadius: "10px",
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button type="button" onClick={remove} disabled={busy}
              style={{
                position: "absolute", top: 6, right: 6, padding: "5px 7px",
                background: "rgba(0,0,0,0.55)", color: "#fff", border: "none",
                borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11,
              }}>
              <Trash2 size={11} /> Sil
            </button>
          </>
        ) : (
          <div style={{ color: C.muted, fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <ImageIcon size={20} />
            Görsel yok
          </div>
        )}
        <label style={{
          position: "absolute", bottom: 6, left: 6,
          padding: "6px 10px", background: "rgba(255,255,255,0.94)",
          border: `1px solid ${C.border}`, borderRadius: 999, fontSize: 11, fontWeight: 600,
          cursor: busy ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, color: C.primary,
        }}>
          <Upload size={11} /> {current ? "Değiştir" : "Yükle"}
          <input type="file" accept="image/*" onChange={pick} disabled={busy} style={{ display: "none" }} />
        </label>
      </div>
      {err && <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 4 }}>{err}</div>}
    </Field>
  );
}

/* ─── Reusable: SocialLinkField ───────────────────────────────────────────── */

function SocialLinkField({ label, value, onChange, placeholder, fi }) {
  return (
    <Field label={label}>
      <input value={value} onChange={onChange} placeholder={placeholder} style={fi} />
    </Field>
  );
}

/* ─── Reusable: GalleryGrid ───────────────────────────────────────────────── */

function SortableTile({ url, busy, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        aspectRatio: "1 / 1",
        borderRadius: 8,
        overflow: "hidden",
        background: C.surface,
        border: `1px solid ${C.border}`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 5 : 1,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} loading="lazy" />

      {/* Drag handle — top-left */}
      <button
        type="button"
        aria-label="Sürükleyerek sırala"
        {...attributes}
        {...listeners}
        style={{
          position: "absolute", top: 4, left: 4, padding: 4,
          background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
          borderRadius: 999, cursor: "grab", display: "flex", alignItems: "center",
          touchAction: "none",
        }}
      >
        <GripVertical size={12} />
      </button>

      {/* Remove — top-right */}
      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        aria-label="Fotoğrafı sil"
        style={{
          position: "absolute", top: 4, right: 4, padding: 4,
          background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
          borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center",
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function GalleryGrid({ items, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function addMany(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true); setErr(null);
    let current = items;
    try {
      for (const file of files) {
        if (current.length >= 12) { setErr("Galeri en fazla 12 fotoğraf alır"); break; }
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) { setErr(`${file.name}: 5 MB'dan büyük`); continue; }
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload  = () => res(r.result);
          r.onerror = () => rej(r.error);
          r.readAsDataURL(file);
        });
        const r = await apiFetch("/api/admin/shop/gallery", { method: "POST", body: JSON.stringify({ dataUrl }) });
        current = r.gallery;
        onChange(current);
      }
    } catch (ex) {
      setErr(ex.message || "Yüklenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function remove(index) {
    if (!confirm("Bu fotoğrafı silmek istediğine emin misin?")) return;
    setBusy(true); setErr(null);
    try {
      const r = await apiFetch("/api/admin/shop/gallery", { method: "DELETE", body: JSON.stringify({ index }) });
      onChange(r.gallery);
    } catch (ex) {
      setErr(ex.message || "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  async function onDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    // Optimistic — revert on server reject.
    onChange(next);
    setErr(null);
    try {
      const r = await apiFetch("/api/admin/shop/gallery", { method: "PUT", body: JSON.stringify({ order: next }) });
      onChange(r.gallery);
    } catch (ex) {
      onChange(items);
      setErr(ex.message || "Sıralanamadı");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 10,
          }}>
            {items.map((url, i) => (
              <SortableTile key={url} url={url} busy={busy} onRemove={() => remove(i)} />
            ))}
            {items.length < 12 && (
              <label style={{
                aspectRatio: "1 / 1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 8,
                color: C.muted, fontSize: 11, cursor: busy ? "wait" : "pointer",
              }}>
                <Plus size={18} />
                {busy ? "Yükleniyor…" : "Ekle"}
                <input type="file" multiple accept="image/*" onChange={addMany} disabled={busy} style={{ display: "none" }} />
              </label>
            )}
          </div>
        </SortableContext>
      </DndContext>
      {items.length > 1 && (
        <div style={{ fontSize: 11, color: C.muted }}>
          İpucu: tutamacı sürükleyerek fotoğraf sırasını değiştirebilirsin. İlk fotoğraf kapak yedeği olarak kullanılır.
        </div>
      )}
      {err && <div style={{ fontSize: 11, color: "#b91c1c" }}>{err}</div>}
    </div>
  );
}

function QRSection({ slug }) {
  // ponytail: external QR API (api.qrserver.com). Swap to `qrcode` npm package
  // if uptime/offline matters. Saves an install + a server route.
  const url = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `/${slug}`;
  const qrPng = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=12&data=${encodeURIComponent(url)}`;
  const qrThumb = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(url)}`;
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <Section title="QR Kod & Bağlantı">
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <img
          src={qrThumb}
          alt="Salon QR"
          width={120}
          height={120}
          style={{ borderRadius: "8px", border: `1px solid ${C.border}`, background: "#fff" }}
        />
        <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "12px", color: C.muted }}>
            Müşterileriniz QR'ı okutarak salon sayfanıza ulaşır.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <code style={{
              fontSize: "12px", padding: "6px 10px", background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: "6px", color: C.primary,
              wordBreak: "break-all",
            }}>{url}</code>
            <button type="button" onClick={copyLink}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", fontSize: "12px", fontWeight: 600, background: "#fff", border: `1px solid ${C.border}`, borderRadius: "6px", cursor: "pointer", color: C.primary }}>
              <Copy size={12} /> {copied ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a href={qrPng} download={`makas-${slug}-qr.png`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: 600, background: C.primary, color: "#fff", borderRadius: "8px", textDecoration: "none" }}>
              <Download size={13} /> QR İndir (PNG)
            </a>
            <a href={`/${slug}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: 600, background: "#fff", color: C.primary, border: `1px solid ${C.border}`, borderRadius: "8px", textDecoration: "none" }}>
              <QrCode size={13} /> Sayfayı Aç
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: "11px", fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</div>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>
    </div>
  );
}

/* ─── Helper ──────────────────────────────────────────────────────────────── */

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

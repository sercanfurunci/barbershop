"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { todayStr } from "@/lib/utils";
import { Clock, Calendar, Plus, Trash2, Save, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";

const C = {
  bg:       "#F8F6F2",
  card:     "#FFFFFF",
  cardHi:   "#FBF7F0",
  border:   "rgba(17,17,17,0.08)",
  borderHi: "rgba(17,17,17,0.18)",
  surface:  "#F1EEE8",
  primary:  "#111111",
  secondary:"#57514B",
  muted:    "#6E6760",
  dim:      "#C9C2B7",
  red:      "#C62828",
};

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
  { id: "hours",    label: "Çalışma Saatleri", icon: Clock    },
  { id: "holidays", label: "Tatil Günleri",     icon: Calendar },
  { id: "rules",    label: "Randevu Kuralları", icon: Clock    },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("hours");

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
              padding: "12px 14px", background: b.id === selectedId ? `${C.red}12` : "transparent",
              border: "none", cursor: "pointer", transition: "all 0.15s", textAlign: "left",
            }}
            onMouseEnter={e => { if (b.id !== selectedId) e.currentTarget.style.background = C.surface; }}
            onMouseLeave={e => { if (b.id !== selectedId) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ width: "32px", height: "32px", background: `linear-gradient(135deg, ${C.red}, #9a1212)`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
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
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2" style={{ fontSize: "12px", color: "#B91C1C" }}>
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
                        background: isOff ? C.dim : C.red }}
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
              background: saving ? C.dim : C.red, color: "#fff", border: "none",
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
            <div style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: C.red }}>
              {error}
            </div>
          )}

          <Field label="Tarih">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              min={today}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "8px 12px", fontSize: "13px", color: C.primary, outline: "none", colorScheme: "dark", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = `${C.red}60`}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </Field>

          <Field label="Açıklama">
            <input type="text" placeholder="Örn: Kurban Bayramı" value={label} onChange={e => setLabel(e.target.value)}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "8px 12px", fontSize: "13px", color: C.primary, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = `${C.red}60`}
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
            style={{ background: adding || !date ? C.dim : C.red, color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: adding || !date ? "not-allowed" : "pointer" }}
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
            style={{ padding: "5px 10px", borderRadius: "6px", background: "rgba(198,40,40,0.15)", border: "1px solid rgba(198,40,40,0.3)", fontSize: "11px", color: C.red, cursor: "pointer", fontWeight: 600 }}>
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
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(198,40,40,0.3)"; e.currentTarget.style.color = C.red; }}
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
          style={{ background: C.red, color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
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

/* ─── Helper ──────────────────────────────────────────────────────────────── */

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

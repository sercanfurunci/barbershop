"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { todayStr, toDateStr } from "@/lib/utils";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { apiFetch } from "@/lib/api";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import ManualBookingModal from "./ManualBookingModal";
import {
  ChevronLeft, ChevronRight, Plus, Clock, X, Check,
  Timer, AlertCircle, CheckCircle2, Ban, Filter,
} from "lucide-react";

import { C, SHADOW } from "@/lib/adminTheme";

const SLOT_H    = 48;
const DAY_START = 9;
const DAY_END   = 22;
const TOTAL_SLOTS = (DAY_END - DAY_START) * 2;
const TOTAL_H     = TOTAL_SLOTS * SLOT_H;
const TIME_COL_W  = 52;
const COL_MIN_W   = 172;

const SC = {
  pending:       { label: "Bekleniyor",  short: "Bkl",  color: "#B45309", bg: "rgba(245,158,11,0.15)",  icon: Timer        },
  confirmed:     { label: "Onaylandı",   short: "Ona",  color: "#15803D", bg: "rgba(34,197,94,0.15)",   icon: CheckCircle2 },
  "in-progress": { label: "Devam Ediyor",short: "Dev",  color: "#2563EB", bg: "rgba(96,165,250,0.15)",  icon: Clock        },
  completed:     { label: "Tamamlandı",  short: "Tam",  color: "#57514B", bg: "rgba(107,104,112,0.15)", icon: Check        },
  noshow:        { label: "Gelmedi",     short: "Gel",  color: "#111111", bg: "rgba(17,17,17,0.15)",   icon: AlertCircle  },
  cancelled:     { label: "İptal",       short: "İpt",  color: "#52525b", bg: "rgba(82,82,91,0.15)",    icon: Ban          },
};

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function isToday(dateStr) {
  return dateStr === todayStr();
}

function fmtHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm ? `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}` : `${String(hh).padStart(2, "0")}:00`;
}

function fmtCurrency(v) {
  if (v == null) return "Sorulur";
  return `₺${v.toLocaleString("tr-TR")}`;
}

// ─── Appointment block ────────────────────────────────────────────────────────
function AppointmentBlock({ appt, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const startMin  = timeToMin(appt.time);
  const topOffset = ((startMin - DAY_START * 60) / 30) * SLOT_H;
  const heightPx  = Math.max((appt.duration / 30) * SLOT_H - 2, SLOT_H - 2);
  const sc        = SC[appt.status] ?? SC.pending;
  const Icon      = sc.icon;

  // Three density tiers
  const isTiny   = heightPx < SLOT_H * 1.2;          // < ~58px  → one line
  const isSmall  = heightPx < SLOT_H * 2;             // < ~96px  → two lines
  // isFull = everything else

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          position: "absolute",
          top:    `${topOffset + 1}px`,
          height: `${heightPx}px`,
          left:   "3px",
          right:  "3px",
          background: C.card,
          border:     `1px solid ${sc.color}45`,
          borderRadius: "6px",
          overflow: "hidden",
          cursor: "pointer",
          zIndex: 10,
          transition: "border-color 0.12s, background 0.12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${sc.color}90`;
          e.currentTarget.style.background  = C.surface;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${sc.color}45`;
          e.currentTarget.style.background  = C.card;
        }}
      >
        <div style={{ padding: isTiny ? "3px 7px" : "6px 8px", height: "100%", display: "flex", flexDirection: "column", gap: "2px" }}>
          {/* Row 1: time + status dot */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
            <span style={{ fontSize: "10px", color: sc.color, fontWeight: 600, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
              {appt.time}
            </span>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
          </div>

          {/* Row 2: client name */}
          <div style={{ fontSize: "11px", color: C.primary, fontWeight: 600, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {appt.client}
          </div>

          {/* Row 3: service (small+) */}
          {!isTiny && (
            <div style={{ fontSize: "10px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {appt.service}
            </div>
          )}

          {/* Row 4: price + duration (full) */}
          {!isSmall && (
            <>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: C.muted }}>{appt.duration}dk</span>
                <span style={{ fontSize: "11px", color: C.primary, fontWeight: 600 }}>{fmtCurrency(appt.price)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail panel (centered modal) */}
      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 70 }} onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.14 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 71,
                background: "#FFFFFF",
                border: `1px solid ${C.border}`,
                borderTop: `2px solid ${sc.color}`,
                borderRadius: "12px",
                padding: "18px 20px",
                width: "300px",
                boxShadow: "0 20px 60px rgba(17,17,17,0.18)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "15px", color: C.primary, fontWeight: 600, marginBottom: "2px" }}>{appt.client}</div>
                  {appt.phone
                    ? <div style={{ fontSize: "11px", color: C.muted }}>{appt.phone}</div>
                    : <div style={{ fontSize: "11px", color: C.muted }}>{appt.time} · {appt.duration}dk</div>
                  }
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Kapat"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.muted,
                    width: 32,
                    height: 32,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    margin: -6,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(17,17,17,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Info rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", padding: "12px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: "12px" }}>
                {[
                  ["Hizmet",  appt.service],
                  ["Saat",    `${appt.time} — ${appt.duration}dk`],
                  ["Ücret",   fmtCurrency(appt.price)],
                  appt.notes && ["Not", appt.notes],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                    <span style={{ fontSize: "11px", color: C.secondary, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: "11px", color: C.primary, textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Status buttons */}
              <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>Durum</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {Object.entries(SC).map(([key, cfg]) => {
                  const SI = cfg.icon;
                  const active = appt.status === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { onStatusChange(appt.id, key); setOpen(false); }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 8px", borderRadius: "5px",
                        background: active ? cfg.bg : C.surface,
                        border: `1px solid ${active ? cfg.color + "60" : C.border}`,
                        fontSize: "10px", color: active ? cfg.color : C.secondary,
                        cursor: "pointer", fontWeight: active ? 600 : 400,
                        transition: "all 0.1s",
                      }}
                    >
                      <SI size={9} />
                      {cfg.short}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Break block ──────────────────────────────────────────────────────────────
function BreakBlock({ brk }) {
  const startMin  = timeToMin(brk.start);
  const endMin    = timeToMin(brk.end);
  const topOffset = ((startMin - DAY_START * 60) / 30) * SLOT_H;
  const heightPx  = ((endMin - startMin) / 30) * SLOT_H - 2;

  return (
    <div
      style={{
        position: "absolute",
        top: `${topOffset}px`, height: `${heightPx}px`,
        left: "3px", right: "3px",
        background: "repeating-linear-gradient(45deg, rgba(17,17,17,0.02) 0, rgba(17,17,17,0.02) 2px, transparent 2px, transparent 8px)",
        border: `1px dashed rgba(17,17,17,0.12)`,
        borderRadius: "5px",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 5, pointerEvents: "none",
      }}
    >
      <span style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.06em" }}>{brk.label}</span>
    </div>
  );
}

// ─── Mobile Agenda View ───────────────────────────────────────────────────────
function MobileAgendaView({ date, setDate, displayAppts, allDayAppts, todayRevenue, totalToday, confirmedCnt, pendingCnt, activeBarber, setActiveBarber, statusFilter, setStatusFilter, onNewAppt, updateStatus, barbers }) {
  const [selectedAppt, setSelectedAppt] = useState(null);
  // Lock background scroll while the detail sheet is open.
  useBodyScrollLock(!!selectedAppt);

  const sorted = [...displayAppts].sort((a, b) => a.time.localeCompare(b.time));

  const nowStr = new Date().toTimeString().slice(0, 5);
  const past   = sorted.filter(a => a.time < nowStr);
  const upcoming = sorted.filter(a => a.time >= nowStr);

  function ApptCard({ appt }) {
    const sc  = SC[appt.status] ?? SC.pending;
    const barberInitials = appt.barber ? appt.barber.split(" ").map(w => w[0]).slice(0, 2).join("") : "?";
    const Icon = sc.icon;
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setSelectedAppt(appt)}
        style={{
          background: C.card, border: `1px solid ${sc.color}40`,
          borderRadius: "10px", padding: "12px 14px",
          cursor: "pointer", marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          {/* Time */}
          <div style={{ flexShrink: 0, width: "38px", paddingTop: "1px" }}>
            <div style={{ fontSize: "13px", color: sc.color, fontWeight: 700, fontFamily: "'DM Mono', monospace", lineHeight: 1.1 }}>
              {appt.time}
            </div>
            <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>{appt.duration}dk</div>
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", color: C.primary, fontWeight: 600, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {appt.client}
            </div>
            <div style={{ fontSize: "11px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {appt.service}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
              <div style={{ width: "16px", height: "16px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {barberInitials}
              </div>
              <span style={{ fontSize: "10px", color: C.muted }}>{appt.barber?.split(" ")[0]}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10px", color: sc.color, padding: "1px 6px", background: sc.bg, borderRadius: "4px" }}>
                <Icon size={8} />
                {sc.short}
              </span>
            </div>
          </div>
          {/* Price */}
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: "14px", color: C.primary, fontWeight: 700 }}>{fmtCurrency(appt.price)}</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, overflow: "hidden" }}>
      {/* Date nav */}
      <div style={{ flexShrink: 0, background: C.card, borderBottom: `1px solid ${C.border}`, padding: "10px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => setDate(d => addDays(d, -1))} style={{ width: "32px", height: "32px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary, flexShrink: 0 }}>
            <ChevronLeft size={15} />
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>
              {new Date(date + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            {isToday(date) && <div style={{ fontSize: "9px", color: C.primary, fontWeight: 700, letterSpacing: "0.1em", marginTop: "1px" }}>BUGÜN</div>}
          </div>
          <button onClick={() => setDate(d => addDays(d, 1))} style={{ width: "32px", height: "32px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary, flexShrink: 0 }}>
            <ChevronRight size={15} />
          </button>
          {!isToday(date) && (
            <button onClick={() => setDate(todayStr())} style={{ height: "32px", padding: "0 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "11px", color: C.secondary, cursor: "pointer", flexShrink: 0 }}>
              Bugün
            </button>
          )}
          <button onClick={() => onNewAppt()} style={{ width: "32px", height: "32px", background: C.primary, border: "none", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}>
            <Plus size={15} />
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
          {[
            { label: "Toplam", val: totalToday, color: C.secondary },
            { label: "Onaylı", val: confirmedCnt, color: "#15803D" },
            { label: "Bekliyor", val: pendingCnt, color: "#B45309" },
            { label: "Kasa", val: `₺${todayRevenue.toLocaleString()}`, color: C.primary },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "6px 8px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
              <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Barber filter chips */}
      <div style={{ flexShrink: 0, background: C.card, borderBottom: `1px solid ${C.border}`, padding: "8px 16px", display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none" }}>
        {[{ id: "all", label: "Tümü" }, ...barbers.map(b => ({ id: b.id, label: (b.nameTr ?? b.name ?? "").split(" ")[0] }))].map(b => (
          <button key={b.id} onClick={() => setActiveBarber(b.id)} style={{ height: "26px", padding: "0 12px", borderRadius: "13px", background: activeBarber === b.id ? "rgba(17,17,17,0.12)" : "none", border: `1px solid ${activeBarber === b.id ? "rgba(17,17,17,0.4)" : C.border}`, fontSize: "11px", color: activeBarber === b.id ? C.primary : C.secondary, cursor: "pointer", fontWeight: activeBarber === b.id ? 600 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>
            {b.label}
          </button>
        ))}
        <div style={{ width: "1px", height: "26px", background: C.border, flexShrink: 0 }} />
        {Object.entries(SC).map(([key, cfg]) => (
          <button key={key} onClick={() => setStatusFilter(key === statusFilter ? "all" : key)} style={{ height: "26px", padding: "0 10px", borderRadius: "13px", background: statusFilter === key ? cfg.bg : "none", border: `1px solid ${statusFilter === key ? cfg.color + "50" : "transparent"}`, fontSize: "11px", color: statusFilter === key ? cfg.color : C.muted, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {cfg.short}
          </button>
        ))}
      </div>

      {/* Agenda list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.2 }}>◎</div>
            <div style={{ fontSize: "13px", color: C.muted }}>Bu gün için randevu yok</div>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                {past.length > 0 && <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Sıradaki</div>}
                {upcoming.map(a => <ApptCard key={a.id} appt={a} />)}
              </>
            )}
            {past.length > 0 && (
              <>
                <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "16px 0 10px" }}>Geçmiş</div>
                {past.map(a => <ApptCard key={a.id} appt={a} />)}
              </>
            )}
          </>
        )}
      </div>

      {/* Detail bottom sheet */}
      <AnimatePresence>
        {selectedAppt && (() => {
          const appt = selectedAppt;
          const sc = SC[appt.status] ?? SC.pending;
          return (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAppt(null)} style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.4)", zIndex: 80 }} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: "#FFFFFF", borderRadius: "16px 16px 0 0", borderTop: `2px solid ${sc.color}`, padding: "20px 20px calc(20px + env(safe-area-inset-bottom))", maxHeight: "90dvh", overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
              >
                {/* Handle */}
                <div style={{ width: "36px", height: "3px", background: C.border, borderRadius: "2px", margin: "0 auto 16px" }} />
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "16px", color: C.primary, fontWeight: 700, marginBottom: "3px" }}>{appt.client}</div>
                    <div style={{ fontSize: "12px", color: C.muted }}>{appt.phone || `${appt.time} · ${appt.duration}dk`}</div>
                  </div>
                  <button onClick={() => setSelectedAppt(null)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}>
                    <X size={14} />
                  </button>
                </div>
                {/* Info rows */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "14px" }}>
                  {[["Hizmet", appt.service], ["Saat", `${appt.time} — ${appt.duration}dk`], ["Ücret", fmtCurrency(appt.price)], appt.notes && ["Not", appt.notes]].filter(Boolean).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: "12px", color: C.secondary }}>{k}</span>
                      <span style={{ fontSize: "12px", color: C.primary, textAlign: "right" }}>{v}</span>
                    </div>
                  ))}
                </div>
                {/* Status */}
                <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>Durum</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {Object.entries(SC).map(([key, cfg]) => {
                    const SI = cfg.icon;
                    const active = appt.status === key;
                    return (
                      <button key={key} onClick={() => { updateStatus(appt.id, key); setSelectedAppt(null); }} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", background: active ? cfg.bg : C.surface, border: `1px solid ${active ? cfg.color + "60" : C.border}`, fontSize: "11px", color: active ? cfg.color : C.secondary, cursor: "pointer", fontWeight: active ? 600 : 400 }}>
                        <SI size={10} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
// WorkingHours is a single 1-1 row with {mon,tue,…}{Start,End} in minutes from
// midnight. `null` on either side of a day means "closed that day". Returns
// null when the barber isn't scheduled that day so the caller can skip.
const DOW_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function getBarberWH(barber, dateStr) {
  const wh = barber?.workingHours;
  if (!wh) return null;
  const dowKey = DOW_KEYS[new Date(dateStr + "T12:00:00").getDay()];
  const s = wh[`${dowKey}Start`];
  const e = wh[`${dowKey}End`];
  if (s == null || e == null) return null;
  return { start: s / 60, end: e / 60 }; // grid uses hours as unit
}

// BarberBreak stores start/end as "HH:MM" strings. A dated break wins over
// recurring; otherwise dayOfWeek match or every-day (null) applies.
function getBarberBreaks(barber, dateStr) {
  if (!barber?.breaks?.length) return [];
  const dow = new Date(dateStr + "T12:00:00").getDay();
  return barber.breaks
    .filter(b => (b.date ? b.date === dateStr : (b.dayOfWeek == null || b.dayOfWeek === dow)))
    .map(b => ({ start: b.start, end: b.end, label: b.label || "Mola" }));
}

export default function CalendarView() {
  const { appointments, updateStatus } = useAppointments();
  const [date, setDate]             = useState(todayStr());
  const [showModal, setShowModal]   = useState(false);
  const [modalBarberId, setModalBarberId] = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [activeBarber, setActiveBarber]   = useState("all");
  const [listOpen, setListOpen]     = useState(false);
  const [barbers, setBarbers]       = useState([]);
  const gridRef = useRef(null);

  useEffect(() => {
    apiFetch("/api/admin/barbers")
      .then(list => setBarbers(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  // Scroll to current time on mount / date change
  useEffect(() => {
    if (!isToday(date) || !gridRef.current) return;
    const now  = new Date();
    const mins = (now.getHours() - DAY_START) * 60 + now.getMinutes();
    if (mins > 0) gridRef.current.scrollTop = Math.max(0, (mins / 30) * SLOT_H - 100);
  }, [date]);

  const allDayAppts = appointments.filter(
    (a) => a.date === date && a.status !== "cancelled"
  );

  const displayAppts = allDayAppts.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (activeBarber !== "all" && a.barberId !== activeBarber) return false;
    return true;
  });

  // Toolbar stats
  const totalToday    = allDayAppts.length;
  const confirmedCnt  = allDayAppts.filter(a => a.status === "confirmed").length;
  const pendingCnt    = allDayAppts.filter(a => a.status === "pending").length;
  const completedCnt  = allDayAppts.filter(a => a.status === "completed").length;
  const todayRevenue  = allDayAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price || 0), 0);

  // Current time
  const now     = new Date();
  const nowMin  = now.getHours() * 60 + now.getMinutes();
  const nowTop  = ((nowMin - DAY_START * 60) / 30) * SLOT_H;
  const showNow = isToday(date) && nowMin >= DAY_START * 60 && nowMin <= DAY_END * 60;
  const nowLabel = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Time labels — only full hours
  const timeLabels = [];
  for (let h = DAY_START; h <= DAY_END; h++) {
    timeLabels.push({ label: `${String(h).padStart(2, "0")}:00`, top: (h - DAY_START) * 2 * SLOT_H });
  }

  const openModal = (barberId = "") => {
    setModalBarberId(barberId);
    setShowModal(true);
  };

  const visibleBarbers = activeBarber === "all" ? barbers : barbers.filter(b => b.id === activeBarber);
  // Normalize barber name field for components that expect .name
  const normalizedBarbers = visibleBarbers.map(b => ({ ...b, name: b.nameTr ?? b.name ?? "" }));

  // Mobile agenda view
  const mobileView = (
    <MobileAgendaView
      date={date} setDate={setDate}
      displayAppts={displayAppts} allDayAppts={allDayAppts}
      todayRevenue={todayRevenue} totalToday={totalToday}
      confirmedCnt={confirmedCnt} pendingCnt={pendingCnt}
      activeBarber={activeBarber} setActiveBarber={setActiveBarber}
      statusFilter={statusFilter} setStatusFilter={setStatusFilter}
      onNewAppt={openModal}
      updateStatus={updateStatus}
      barbers={barbers}
    />
  );

  return (
    <>
      {/* Mobile: agenda view */}
      <div className="flex md:hidden" style={{ height: "100%", flexDirection: "column" }}>
        {mobileView}
      </div>

      {/* Desktop: timeline grid */}
      <div className="hidden md:flex" style={{ flexDirection: "column", height: "100%", background: C.bg, overflow: "hidden" }}>

      {/* ── Toolbar ── */}
      <div style={{ flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.card }}>

        {/* Row 1: date nav + primary actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          {/* Date nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
            <button
              onClick={() => setDate(d => addDays(d, -1))}
              style={{ width: "28px", height: "28px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}
            >
              <ChevronLeft size={14} />
            </button>
            <div style={{ textAlign: "center", minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: "13px", color: C.primary, fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {new Date(date + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              {isToday(date) && (
                <span style={{ marginLeft: "8px", fontSize: "9px", color: C.primary, fontWeight: 600, letterSpacing: "0.08em", verticalAlign: "middle" }}>BUGÜN</span>
              )}
            </div>
            <button
              onClick={() => setDate(d => addDays(d, 1))}
              style={{ width: "28px", height: "28px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}
            >
              <ChevronRight size={14} />
            </button>
            {!isToday(date) && (
              <button
                onClick={() => setDate(todayStr())}
                style={{ height: "28px", padding: "0 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "11px", color: C.secondary, cursor: "pointer" }}
              >
                Bugün
              </button>
            )}
          </div>

          {/* Stats pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "8px" }}>
            {[
              { label: `${totalToday} randevu`,          color: C.secondary },
              { label: `${confirmedCnt} onaylı`,         color: "#15803D"   },
              { label: `${pendingCnt} bekliyor`,         color: "#B45309"   },
              { label: fmtCurrency(todayRevenue) + " kasa", color: C.primary },
            ].map((s, i) => (
              <span
                key={i}
                style={{ fontSize: "11px", color: s.color, padding: "3px 8px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px" }}
              >
                {s.label}
              </span>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* List view toggle */}
          <button
            onClick={() => setListOpen(v => !v)}
            style={{
              height: "28px", padding: "0 10px",
              background: listOpen ? "rgba(17,17,17,0.1)" : C.surface,
              border: `1px solid ${listOpen ? "rgba(17,17,17,0.3)" : C.border}`,
              borderRadius: "6px", fontSize: "11px",
              color: listOpen ? C.primary : C.secondary, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "5px",
            }}
          >
            <Filter size={11} />
            Liste
          </button>

          {/* New appointment */}
          <button
            onClick={() => openModal()}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: C.primary, color: "#fff", border: "none",
              borderRadius: "6px", padding: "0 14px", height: "28px",
              fontSize: "11px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em",
            }}
          >
            <Plus size={13} />
            Yeni Randevu
          </button>
        </div>

        {/* Row 2: filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", overflowX: "auto" }}>
          {/* Barber filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            {[{ id: "all", name: "Tümü", avatar: "T" }, ...barbers.map(b => ({ ...b, name: b.nameTr ?? b.name ?? "" }))].map(b => (
              <button
                key={b.id}
                onClick={() => setActiveBarber(b.id)}
                style={{
                  height: "24px", padding: "0 10px", borderRadius: "20px",
                  background: activeBarber === b.id ? "rgba(17,17,17,0.12)" : "none",
                  border: `1px solid ${activeBarber === b.id ? "rgba(17,17,17,0.35)" : C.border}`,
                  fontSize: "11px", color: activeBarber === b.id ? C.primary : C.secondary,
                  cursor: "pointer", fontWeight: activeBarber === b.id ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {b.avatar ?? b.name}
              </button>
            ))}
          </div>

          <div style={{ width: "1px", height: "16px", background: C.border, flexShrink: 0 }} />

          {/* Status filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            <button
              onClick={() => setStatusFilter("all")}
              style={{ height: "24px", padding: "0 10px", borderRadius: "20px", background: statusFilter === "all" ? C.surface : "none", border: `1px solid ${statusFilter === "all" ? C.border : "transparent"}`, fontSize: "11px", color: statusFilter === "all" ? C.primary : C.secondary, cursor: "pointer" }}
            >
              Tüm Durumlar
            </button>
            {Object.entries(SC).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key === statusFilter ? "all" : key)}
                style={{
                  height: "24px", padding: "0 10px", borderRadius: "20px",
                  background: statusFilter === key ? cfg.bg : "none",
                  border: `1px solid ${statusFilter === key ? cfg.color + "50" : "transparent"}`,
                  fontSize: "11px", color: statusFilter === key ? cfg.color : C.muted,
                  cursor: "pointer",
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body: grid + optional list panel ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Grid */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Column headers */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.card }}>
            <div style={{ width: `${TIME_COL_W}px`, flexShrink: 0, borderRight: `1px solid ${C.border}` }} />
            {normalizedBarbers.map((barber) => {
              const wh        = getBarberWH(barber, date);
              const bAppts    = displayAppts.filter(a => a.barberId === barber.id);
              const bRevenue  = bAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price || 0), 0);
              const bPending  = bAppts.filter(a => a.status === "pending").length;
              const bConfirmed = bAppts.filter(a => a.status === "confirmed").length;

              return (
                <div
                  key={barber.id}
                  style={{
                    flex: 1, minWidth: `${COL_MIN_W}px`,
                    padding: "10px 14px",
                    borderRight: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "30px", height: "30px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {barber.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: C.primary, fontWeight: 500, lineHeight: 1.2 }}>
                        {barber.name.split(" ")[0]}
                        <span style={{ fontSize: "10px", color: C.secondary, fontWeight: 400 }}> {barber.name.split(" ")[1]}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <span style={{ fontSize: "9px", color: wh ? C.muted : "#B45309" }}>
                          {wh ? `${fmtHour(wh.start)}–${fmtHour(wh.end)}` : "Kapalı"}
                        </span>
                        {bAppts.length > 0 && (
                          <>
                            <span style={{ fontSize: "9px", color: C.muted }}>·</span>
                            <span style={{ fontSize: "9px", color: "#15803D" }}>{bConfirmed} ona</span>
                            {bPending > 0 && <span style={{ fontSize: "9px", color: "#B45309" }}>{bPending} bkl</span>}
                            {bRevenue > 0 && <span style={{ fontSize: "9px", color: C.secondary }}>{fmtCurrency(bRevenue)}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(barber.id)}
                    style={{ width: "22px", height: "22px", background: "rgba(17,17,17,0.08)", border: "1px solid rgba(17,17,17,0.18)", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.primary, flexShrink: 0 }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Scrollable grid */}
          <div ref={gridRef} style={{ flex: 1, overflowY: "auto", overflowX: "auto", position: "relative" }}>
            <div style={{ display: "flex", minWidth: `${TIME_COL_W + visibleBarbers.length * COL_MIN_W}px`, height: `${TOTAL_H}px`, position: "relative" }}>

              {/* Time gutter */}
              <div style={{ width: `${TIME_COL_W}px`, flexShrink: 0, borderRight: `1px solid ${C.border}`, position: "relative", background: C.bg }}>
                {timeLabels.map(({ label, top }) => (
                  <div key={label} style={{ position: "absolute", top: `${top - 7}px`, right: "6px", fontSize: "10px", color: C.muted, whiteSpace: "nowrap", lineHeight: 1, userSelect: "none" }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Barber columns */}
              {normalizedBarbers.map((barber) => {
                const wh          = getBarberWH(barber, date);
                const barberBreaks = wh ? getBarberBreaks(barber, date) : [];
                const barberAppts  = displayAppts.filter(a => a.barberId === barber.id);
                // wh=null → barber isn't scheduled that day; shade the entire column.
                const offBeforeH   = wh ? Math.max(0, ((wh.start - DAY_START) * 2) * SLOT_H) : TOTAL_H;
                const offAfterTop  = wh ? ((wh.end - DAY_START) * 2) * SLOT_H : TOTAL_H;
                const offAfterH    = TOTAL_H - offAfterTop;

                return (
                  <div
                    key={barber.id}
                    style={{ flex: 1, minWidth: `${COL_MIN_W}px`, borderRight: `1px solid ${C.border}`, position: "relative" }}
                  >
                    {/* Slot lines */}
                    {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
                      <div key={i} style={{ position: "absolute", top: `${i * SLOT_H}px`, left: 0, right: 0, height: "1px", background: i % 2 === 0 ? C.border : "rgba(17,17,17,0.03)" }} />
                    ))}

                    {/* Off-hours */}
                    {offBeforeH > 0 && (
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${offBeforeH}px`, background: "rgba(17,17,17,0.05)", zIndex: 2, pointerEvents: "none" }} />
                    )}
                    {offAfterH > 0 && (
                      <div style={{ position: "absolute", top: `${offAfterTop}px`, left: 0, right: 0, height: `${offAfterH}px`, background: "rgba(17,17,17,0.05)", zIndex: 2, pointerEvents: "none" }} />
                    )}

                    {barberBreaks.map((brk, i) => <BreakBlock key={i} brk={brk} />)}
                    {barberAppts.map((appt) => (
                      <AppointmentBlock key={appt.id} appt={appt} onStatusChange={updateStatus} />
                    ))}
                  </div>
                );
              })}

              {/* Current time line */}
              {showNow && (
                <div style={{ position: "absolute", top: `${nowTop}px`, left: `${TIME_COL_W}px`, right: 0, height: "1px", background: C.primary, zIndex: 20, pointerEvents: "none" }}>
                  <div style={{ position: "absolute", left: "-22px", top: "-8px", fontSize: "9px", color: C.primary, fontWeight: 600, fontFamily: "'DM Mono', monospace", background: C.bg, padding: "1px 3px", borderRadius: "3px" }}>
                    {nowLabel}
                  </div>
                  <div style={{ position: "absolute", left: "-4px", top: "-3px", width: "7px", height: "7px", background: C.primary, borderRadius: "50%" }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── List panel (slide in from right) ── */}
        <AnimatePresence>
          {listOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ flexShrink: 0, borderLeft: `1px solid ${C.border}`, background: C.card, overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <span style={{ fontSize: "12px", color: C.primary, fontWeight: 500 }}>Gün Listesi</span>
                <span style={{ fontSize: "11px", color: C.secondary }}>{displayAppts.length} randevu</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {displayAppts.length === 0 ? (
                  <div style={{ padding: "32px 14px", textAlign: "center", fontSize: "12px", color: C.muted }}>Randevu yok</div>
                ) : (
                  [...displayAppts]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appt, i, arr) => {
                      const sc  = SC[appt.status] ?? SC.pending;
                      const barberInitials = appt.barber ? appt.barber.split(" ").map(w => w[0]).slice(0, 2).join("") : "?";
                      return (
                        <div
                          key={appt.id}
                          style={{ padding: "10px 14px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <span style={{ fontSize: "11px", color: sc.color, fontWeight: 600, fontFamily: "'DM Mono', monospace", minWidth: "36px", flexShrink: 0 }}>{appt.time}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client}</div>
                              <div style={{ fontSize: "10px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.service}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                                <div style={{ width: "14px", height: "14px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6px", fontWeight: 700, color: "#fff" }}>
                                  {barberInitials}
                                </div>
                                <span style={{ fontSize: "10px", color: C.muted }}>{appt.barber?.split(" ")[0]}</span>
                                <span style={{ fontSize: "10px", color: C.muted }}>·</span>
                                <span style={{ fontSize: "10px", color: sc.color }}>{sc.short}</span>
                              </div>
                            </div>
                            <span style={{ fontSize: "11px", color: C.primary, fontWeight: 600, flexShrink: 0 }}>{fmtCurrency(appt.price)}</span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
              {/* Daily total */}
              <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "11px", color: C.secondary }}>Toplam kasa</span>
                <span style={{ fontSize: "13px", color: C.primary, fontWeight: 600 }}>{fmtCurrency(todayRevenue)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      </div>{/* end desktop flex */}

      {/* Shared modal */}
      {showModal && (
        <ManualBookingModal
          defaultBarberId={modalBarberId}
          initialDate={date}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

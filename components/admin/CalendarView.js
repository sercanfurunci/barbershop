"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { todayStr, toDateStr } from "@/lib/utils";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { apiFetch } from "@/lib/api";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import ManualBookingModal from "./ManualBookingModal";
import AppointmentPopup from "./AppointmentPopup";
import {
  ChevronLeft, ChevronRight, Plus, X, Filter,
  Clock, CheckCircle2, Zap, CheckCheck, UserX, XCircle,
  Check, Pencil, Trash2, Coffee, AlertCircle,
} from "lucide-react";

import { C, SHADOW } from "@/lib/adminTheme";

const SLOT_H    = 48;
const DAY_START = 9;
const DAY_END   = 22;
const TOTAL_SLOTS = (DAY_END - DAY_START) * 2;
const TOTAL_H     = TOTAL_SLOTS * SLOT_H;
const TIME_COL_W  = 56;
const COL_MIN_W   = 180;

// Status config — colors and labels intentionally match spec so the timeline,
// popup, and mobile agenda all agree. `short` stays around for the legacy
// mobile filter chips.
const SC = {
  pending:         { label: "Bekleniyor",       short: "Bkl", color: "#B45309", bg: "rgba(180,83,9,0.15)",    icon: Clock         },
  confirmed:       { label: "Onaylandı",         short: "Ona", color: "#15803D", bg: "rgba(21,128,61,0.15)",   icon: CheckCircle2  },
  "arrival-check": { label: "Varış Bekleniyor",  short: "Var", color: "#7C3AED", bg: "rgba(124,58,237,0.15)", icon: AlertCircle   },
  "in-progress":   { label: "Devam Ediyor",      short: "Dev", color: "#2563EB", bg: "rgba(37,99,235,0.15)",   icon: Zap           },
  completed:       { label: "Tamamlandı",         short: "Tam", color: "#57514B", bg: "rgba(87,81,75,0.15)",   icon: CheckCheck    },
  noshow:          { label: "Gelmedi",            short: "Gel", color: "#111111", bg: "rgba(17,17,17,0.15)",   icon: UserX         },
  cancelled:       { label: "İptal",              short: "İpt", color: "#52525b", bg: "rgba(82,82,91,0.15)",   icon: XCircle       },
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

function initialsOf(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

// ─── Appointment block (desktop timeline) ─────────────────────────────────────
// Redesigned card: subtle gradient + status-colored 2.5px left border, tiny
// hover quick-action buttons (confirm / edit / delete) in the top-right,
// staggered mount animation, and a brief "flash" pulse when its status
// changes so users see feedback. The popup itself is now a separate component
// controlled by CalendarView; this block only reports clicks upward.
function AppointmentBlock({ appt, onOpen, onQuickAction, isRecent }) {
  const startMin  = timeToMin(appt.time);
  const topOffset = ((startMin - DAY_START * 60) / 30) * SLOT_H;
  const heightPx  = Math.max((appt.duration / 30) * SLOT_H - 2, SLOT_H - 2);
  const sc        = SC[appt.status] ?? SC.pending;
  const Icon      = sc.icon;

  const isTiny  = heightPx < SLOT_H * 1.15;
  const isSmall = heightPx < SLOT_H * 1.9;

  const canQuickConfirm = appt.status === "pending";
  const canQuickComplete = appt.status === "confirmed" || appt.status === "in-progress";
  const isTerminal = appt.status === "completed" || appt.status === "cancelled" || appt.status === "noshow";

  // Track hover for quick actions — cheaper than a whole framer prop tree.
  const [hover, setHover] = useState(false);

  // Flash when status changes (isRecent flips true → animate → parent clears).
  const flashRef = useRef(null);

  return (
    <motion.div
      layout
      ref={flashRef}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(appt, { x: e.clientX, y: e.clientY });
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        top:    `${topOffset + 1}px`,
        height: `${heightPx}px`,
        left:   "3px",
        right:  "3px",
        background: `linear-gradient(135deg, ${sc.bg} 0%, rgba(255,255,255,0.02) 100%)`,
        borderLeft: `2.5px solid ${sc.color}`,
        border: `1px solid ${sc.color}25`,
        borderLeftWidth: "2.5px",
        borderRadius: "8px",
        overflow: "hidden",
        cursor: "pointer",
        zIndex: hover ? 12 : 10,
        boxShadow: hover ? SHADOW.elevated : "none",
        transition: "box-shadow 0.14s ease, transform 0.14s ease",
        transform: hover ? "scale(1.015)" : "scale(1)",
      }}
    >
      {/* Flash overlay when status changes */}
      <AnimatePresence>
        {isRecent && (
          <motion.div
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{
              position: "absolute", inset: 0,
              background: sc.color,
              pointerEvents: "none",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </AnimatePresence>

      <div style={{
        padding: isTiny ? "4px 8px" : "6px 9px",
        height: "100%",
        display: "flex", flexDirection: "column", gap: "2px",
        position: "relative",
      }}>
        {/* Row 1: time + status dot */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
          <span style={{
            fontSize: "10px",
            color: sc.color,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
            letterSpacing: "0.02em",
          }}>
            {appt.time}
          </span>
          <div style={{
            width: "6px", height: "6px",
            borderRadius: "50%", background: sc.color,
            flexShrink: 0,
            boxShadow: `0 0 0 2px ${sc.bg}`,
          }} />
        </div>

        {/* Row 2: client name */}
        <div style={{
          fontSize: "11px",
          color: C.primary,
          fontWeight: 600,
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {appt.client}
        </div>

        {/* Row 3: service */}
        {!isTiny && (
          <div style={{
            fontSize: "10px",
            color: C.secondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {appt.service}
          </div>
        )}

        {/* Row 4: duration + price (full only) */}
        {!isSmall && (
          <>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "10px", color: C.muted, fontFamily: "'DM Mono', monospace" }}>
                {appt.duration}dk
              </span>
              <span style={{ fontSize: "11px", color: C.primary, fontWeight: 600 }}>
                {fmtCurrency(appt.price)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Hover quick actions — 22px circles top-right, only for non-terminal */}
      {!isTerminal && (
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -2 }}
              transition={{ duration: 0.12 }}
              style={{
                position: "absolute",
                top: "4px", right: "4px",
                display: "flex", gap: "4px",
                zIndex: 3,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(canQuickConfirm || canQuickComplete) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAction("advance", appt);
                  }}
                  title={canQuickConfirm ? "Onayla" : "Tamamla"}
                  style={quickBtnStyle("#15803D")}
                >
                  <Check size={11} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction("edit", appt);
                }}
                title="Düzenle"
                style={quickBtnStyle(C.primary)}
              >
                <Pencil size={10} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction("delete", appt);
                }}
                title="Sil"
                style={quickBtnStyle("#b91c1c")}
              >
                <Trash2 size={10} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

function quickBtnStyle(fg) {
  return {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "var(--makas-surface)",
    border: `1px solid ${fg}55`,
    color: fg,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 0,
    boxShadow: "0 1px 3px rgba(17,17,17,0.15)",
    transition: "transform 0.1s",
  };
}

// ─── Break block (unchanged behavior, slightly nicer visual) ─────────────────
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
        background: "repeating-linear-gradient(45deg, rgba(17,17,17,0.03) 0, rgba(17,17,17,0.03) 2px, transparent 2px, transparent 8px)",
        border: `1px dashed rgba(17,17,17,0.15)`,
        borderRadius: "6px",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "5px",
        zIndex: 5, pointerEvents: "none",
      }}
    >
      <Coffee size={10} color={C.muted} />
      <span style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.06em" }}>{brk.label}</span>
    </div>
  );
}

// ─── Mobile Agenda View (unchanged) ───────────────────────────────────────────
function MobileAgendaView({ date, setDate, displayAppts, allDayAppts, todayRevenue, totalToday, confirmedCnt, pendingCnt, activeBarber, setActiveBarber, statusFilter, setStatusFilter, onNewAppt, updateStatus, barbers }) {
  const [selectedAppt, setSelectedAppt] = useState(null);
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
          <div style={{ flexShrink: 0, width: "38px", paddingTop: "1px" }}>
            <div style={{ fontSize: "13px", color: sc.color, fontWeight: 700, fontFamily: "'DM Mono', monospace", lineHeight: 1.1 }}>
              {appt.time}
            </div>
            <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>{appt.duration}dk</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", color: C.primary, fontWeight: 600, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {appt.client}
            </div>
            <div style={{ fontSize: "11px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {appt.service}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
              <div style={{ width: "16px", height: "16px", background: C.primary, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", fontWeight: 700, color: "var(--makas-bg)", flexShrink: 0 }}>
                {barberInitials}
              </div>
              <span style={{ fontSize: "10px", color: C.muted }}>{appt.barber?.split(" ")[0]}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10px", color: sc.color, padding: "1px 6px", background: sc.bg, borderRadius: "4px" }}>
                <Icon size={8} />
                {sc.short}
              </span>
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: "14px", color: C.primary, fontWeight: 700 }}>{fmtCurrency(appt.price)}</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, overflow: "hidden" }}>
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
          <button onClick={() => onNewAppt()} style={{ width: "32px", height: "32px", background: C.primary, border: "none", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--makas-bg)", flexShrink: 0 }}>
            <Plus size={15} />
          </button>
        </div>

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
                style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: "var(--makas-surface)", borderRadius: "16px 16px 0 0", borderTop: `2px solid ${sc.color}`, padding: "20px 20px calc(20px + env(safe-area-inset-bottom))", maxHeight: "90dvh", overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
              >
                <div style={{ width: "36px", height: "3px", background: C.border, borderRadius: "2px", margin: "0 auto 16px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "16px", color: C.primary, fontWeight: 700, marginBottom: "3px" }}>{appt.client}</div>
                    <div style={{ fontSize: "12px", color: C.muted }}>{appt.phone || `${appt.time} · ${appt.duration}dk`}</div>
                  </div>
                  <button onClick={() => setSelectedAppt(null)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "14px" }}>
                  {[["Hizmet", appt.service], ["Saat", `${appt.time} — ${appt.duration}dk`], ["Ücret", fmtCurrency(appt.price)], appt.notes && ["Not", appt.notes]].filter(Boolean).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: "12px", color: C.secondary }}>{k}</span>
                      <span style={{ fontSize: "12px", color: C.primary, textAlign: "right" }}>{v}</span>
                    </div>
                  ))}
                </div>
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

// ─── Working hours + breaks resolvers (unchanged) ─────────────────────────────
const DOW_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function getBarberWH(barber, dateStr) {
  const wh = barber?.workingHours;
  if (!wh) return null;
  const dowKey = DOW_KEYS[new Date(dateStr + "T12:00:00").getDay()];
  const s = wh[`${dowKey}Start`];
  const e = wh[`${dowKey}End`];
  if (s == null || e == null) return null;
  return { start: s / 60, end: e / 60 };
}

function getBarberBreaks(barber, dateStr) {
  if (!barber?.breaks?.length) return [];
  const dow = new Date(dateStr + "T12:00:00").getDay();
  return barber.breaks
    .filter(b => (b.date ? b.date === dateStr : (b.dayOfWeek == null || b.dayOfWeek === dow)))
    .map(b => ({ start: b.start, end: b.end, label: b.label || "Mola" }));
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CalendarView() {
  const { appointments, updateStatus, deleteAppointment } = useAppointments();
  const [date, setDate]             = useState(todayStr());
  const [showModal, setShowModal]   = useState(false);
  const [modalBarberId, setModalBarberId] = useState("");
  const [modalEditAppt, setModalEditAppt] = useState(null);
  const [statusFilter, setStatusFilter]   = useState("all");
  const [activeBarber, setActiveBarber]   = useState("all");
  const [listOpen, setListOpen]     = useState(false);
  const [barbers, setBarbers]       = useState([]);
  const [popup, setPopup]           = useState(null); // { appt, anchor }
  const [recentStatusId, setRecentStatusId] = useState(null);
  // Tick every 30s so the "now" line + label stay accurate without a rerender storm.
  const [nowTick, setNowTick] = useState(0);
  const gridRef = useRef(null);

  useEffect(() => {
    apiFetch("/api/admin/barbers")
      .then(list => setBarbers(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  // Re-run every 30s so the "now" line stays live.
  useEffect(() => {
    const id = setInterval(() => setNowTick(n => n + 1), 30_000);
    return () => clearInterval(id);
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
  const todayRevenue  = allDayAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price || 0), 0);

  // Current-time indicator (depends on nowTick so it updates on interval).
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
    setModalEditAppt(null);
    setModalBarberId(barberId);
    setShowModal(true);
  };

  const openEditModal = (appt) => {
    setModalEditAppt(appt);
    setModalBarberId(appt?.barberId ?? "");
    setShowModal(true);
  };

  // Status change routed through provider; provider opens Complete/Cancel
  // modals for those two statuses automatically. Flash the card briefly to
  // acknowledge the change.
  const handleStatusChange = async (id, next) => {
    setRecentStatusId(id);
    setTimeout(() => setRecentStatusId((cur) => (cur === id ? null : cur)), 900);
    try {
      await updateStatus(id, next);
    } catch (e) {
      // Silently ignore — provider polls in the background and will reconcile.
    }
    // Close the popup after non-modal transitions (pending/confirmed/in-progress/noshow).
    // For completed/cancelled, provider opens its own modal; closing our popup here is fine.
    setPopup(null);
  };

  // Quick actions from card hover:
  //  - advance:  pending→confirmed, confirmed/in-progress→completed
  //  - edit:     open ManualBookingModal for editing (booking modal handles both)
  //  - delete:   confirm + delete
  const handleQuickAction = async (kind, appt) => {
    if (kind === "advance") {
      if (appt.status === "pending") {
        await updateStatus(appt.id, "confirmed").catch(() => {});
      } else if (appt.status === "confirmed" || appt.status === "in-progress") {
        // Triggers CompleteAppointmentModal via provider.
        await updateStatus(appt.id, "completed").catch(() => {});
      }
      return;
    }
    if (kind === "edit") {
      openEditModal(appt);
      return;
    }
    if (kind === "delete") {
      if (typeof window !== "undefined" && window.confirm(`"${appt.client}" randevusunu silmek istediğinize emin misiniz?`)) {
        try {
          await deleteAppointment(appt.id);
        } catch (e) {
          // ignore
        }
      }
      return;
    }
  };

  // Popup handlers
  const handleOpenPopup = (appt, anchor) => setPopup({ appt, anchor });
  const handleClosePopup = () => setPopup(null);

  const handleEditFromPopup = (appt) => {
    setPopup(null);
    openEditModal(appt);
  };

  const handleDeleteFromPopup = async (appt) => {
    setPopup(null);
    if (typeof window !== "undefined" && window.confirm(`"${appt.client}" randevusunu silmek istediğinize emin misiniz?`)) {
      try {
        await deleteAppointment(appt.id);
      } catch (e) {
        // ignore
      }
    }
  };

  const visibleBarbers = activeBarber === "all" ? barbers : barbers.filter(b => b.id === activeBarber);
  const normalizedBarbers = visibleBarbers.map(b => ({ ...b, name: b.nameTr ?? b.name ?? "" }));

  // Re-derive the currently-open appointment from state so status changes are
  // reflected in the popup without needing to re-open it.
  const activePopupAppt = popup ? appointments.find((a) => a.id === popup.appt.id) ?? popup.appt : null;

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

  const dateIsToday = isToday(date);

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
              {dateIsToday && (
                <span style={{ marginLeft: "8px", fontSize: "9px", color: C.primary, fontWeight: 600, letterSpacing: "0.08em", verticalAlign: "middle" }}>BUGÜN</span>
              )}
            </div>
            <button
              onClick={() => setDate(d => addDays(d, 1))}
              style={{ width: "28px", height: "28px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}
            >
              <ChevronRight size={14} />
            </button>
            {!dateIsToday && (
              <button
                onClick={() => setDate(todayStr())}
                style={{ height: "28px", padding: "0 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "11px", color: C.secondary, cursor: "pointer" }}
              >
                Bugün
              </button>
            )}
          </div>

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

          <button
            onClick={() => openModal()}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: C.primary, color: "var(--makas-bg)", border: "none",
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

          {/* Scrollable grid with sticky headers inside */}
          <div ref={gridRef} style={{ flex: 1, overflowY: "auto", overflowX: "auto", position: "relative" }}>
            {/* Column headers — sticky at the top of the scrollable region */}
            <div style={{
              display: "flex",
              borderBottom: `1px solid ${C.border}`,
              background: C.card,
              position: "sticky",
              top: 0,
              zIndex: 15,
              minWidth: `${TIME_COL_W + normalizedBarbers.length * COL_MIN_W}px`,
            }}>
              <div style={{ width: `${TIME_COL_W}px`, flexShrink: 0, borderRight: `1px solid ${C.border}` }} />
              {normalizedBarbers.map((barber) => {
                const wh         = getBarberWH(barber, date);
                const bAppts     = displayAppts.filter(a => a.barberId === barber.id);
                const bPending   = bAppts.filter(a => a.status === "pending").length;
                const bBreaks    = wh ? getBarberBreaks(barber, date) : [];
                const hasBreaks  = bBreaks.length > 0;
                const roleLabel  = barber.role === "OWNER"
                  ? "Usta"
                  : (barber.title ?? barber.roleLabel ?? "Kuaför");
                const displayName = barber.name || "Berber";

                return (
                  <div
                    key={barber.id}
                    style={{
                      flex: 1, minWidth: `${COL_MIN_W}px`,
                      padding: "10px 14px",
                      borderRight: `1px solid ${C.border}`,
                      display: "flex", flexDirection: "column", gap: "6px",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {/* Avatar */}
                      <div style={{
                        width: "36px", height: "36px",
                        background: C.primary,
                        borderRadius: "10px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700,
                        color: "var(--makas-bg)",
                        flexShrink: 0,
                        overflow: "hidden",
                      }}>
                        {barber.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={barber.avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          initialsOf(barber.avatar || displayName)
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: "13px", color: C.primary,
                          fontWeight: 600, lineHeight: 1.2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {displayName}
                        </div>
                        <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px" }}>
                          {roleLabel}
                        </div>
                      </div>
                      <button
                        onClick={() => openModal(barber.id)}
                        title={`${displayName} için yeni randevu`}
                        style={{
                          width: "24px", height: "24px",
                          background: "rgba(17,17,17,0.08)",
                          border: "1px solid rgba(17,17,17,0.18)",
                          borderRadius: "6px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: C.primary, flexShrink: 0,
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "10px",
                        color: wh ? C.secondary : "#B45309",
                        fontFamily: "'DM Mono', monospace",
                        background: "var(--makas-surface2)",
                        padding: "1px 6px",
                        borderRadius: "4px",
                      }}>
                        {wh ? `${fmtHour(wh.start)}–${fmtHour(wh.end)}` : "Kapalı"}
                      </span>
                      <span style={{
                        fontSize: "10px",
                        color: bAppts.length > 0 ? C.primary : C.muted,
                        background: "var(--makas-surface2)",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        fontWeight: 600,
                      }}>
                        {bAppts.length} randevu
                      </span>
                      {bPending > 0 && (
                        <span style={{
                          fontSize: "10px",
                          color: "#B45309",
                          background: "rgba(180,83,9,0.12)",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}>
                          {bPending} bkl
                        </span>
                      )}
                      {hasBreaks && (
                        <span
                          title="Mola planlı"
                          style={{
                            fontSize: "10px", color: C.muted,
                            background: "var(--makas-surface2)",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            display: "inline-flex", alignItems: "center", gap: "3px",
                          }}
                        >
                          <Coffee size={9} />
                          Mola
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline body */}
            <div style={{ display: "flex", minWidth: `${TIME_COL_W + normalizedBarbers.length * COL_MIN_W}px`, height: `${TOTAL_H}px`, position: "relative" }}>

              {/* Time gutter */}
              <div style={{
                width: `${TIME_COL_W}px`, flexShrink: 0,
                borderRight: `1px solid ${C.border}`,
                position: "relative", background: C.bg,
              }}>
                {timeLabels.map(({ label, top }) => (
                  <div key={label} style={{
                    position: "absolute",
                    top: `${top - 7}px`, right: "6px",
                    fontSize: "10px", color: C.muted,
                    whiteSpace: "nowrap", lineHeight: 1,
                    userSelect: "none",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Barber columns */}
              {normalizedBarbers.map((barber) => {
                const wh          = getBarberWH(barber, date);
                const barberBreaks = wh ? getBarberBreaks(barber, date) : [];
                const barberAppts  = displayAppts.filter(a => a.barberId === barber.id);
                const offBeforeH   = wh ? Math.max(0, ((wh.start - DAY_START) * 2) * SLOT_H) : TOTAL_H;
                const offAfterTop  = wh ? ((wh.end - DAY_START) * 2) * SLOT_H : TOTAL_H;
                const offAfterH    = TOTAL_H - offAfterTop;
                const isEmpty      = barberAppts.length === 0 && wh; // hide the placeholder for closed days

                return (
                  <div
                    key={barber.id}
                    style={{
                      flex: 1, minWidth: `${COL_MIN_W}px`,
                      borderRight: `1px solid ${C.border}`,
                      position: "relative",
                      background: dateIsToday ? "rgba(37,99,235,0.03)" : "transparent",
                    }}
                  >
                    {/* Hour + half-hour lines (visually distinct) */}
                    {Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
                      const isFullHour = i % 2 === 0;
                      return (
                        <div
                          key={i}
                          style={{
                            position: "absolute",
                            top: `${i * SLOT_H}px`,
                            left: 0, right: 0,
                            height: 0,
                            borderTop: isFullHour
                              ? `1px solid ${C.border}`
                              : `1px dashed rgba(17,17,17,0.08)`,
                            opacity: isFullHour ? 1 : 0.7,
                            pointerEvents: "none",
                          }}
                        />
                      );
                    })}

                    {/* Quarter-hour hairlines when a slot is tall enough */}
                    {SLOT_H >= 48 && Array.from({ length: TOTAL_SLOTS * 2 }).map((_, i) => {
                      if (i % 2 === 0) return null;
                      const top = (i / 2) * SLOT_H;
                      return (
                        <div
                          key={`q-${i}`}
                          style={{
                            position: "absolute",
                            top: `${top}px`,
                            left: 0, right: 0,
                            height: 0,
                            borderTop: `1px solid rgba(17,17,17,0.04)`,
                            pointerEvents: "none",
                          }}
                        />
                      );
                    })}

                    {/* Off-hours shading */}
                    {offBeforeH > 0 && (
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${offBeforeH}px`, background: "rgba(17,17,17,0.05)", zIndex: 2, pointerEvents: "none" }} />
                    )}
                    {offAfterH > 0 && (
                      <div style={{ position: "absolute", top: `${offAfterTop}px`, left: 0, right: 0, height: `${offAfterH}px`, background: "rgba(17,17,17,0.05)", zIndex: 2, pointerEvents: "none" }} />
                    )}

                    {/* Empty-column placeholder (only when the day is open and no appts) */}
                    {isEmpty && (
                      <div style={{
                        position: "absolute",
                        top: `${((wh.start - DAY_START) * 2 * SLOT_H) + 40}px`,
                        left: 0, right: 0,
                        display: "flex", justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 3,
                      }}>
                        <span style={{
                          fontSize: "12px",
                          color: "var(--makas-ink-muted)",
                          opacity: 0.35,
                          userSelect: "none",
                          letterSpacing: "0.02em",
                        }}>
                          Randevu yok
                        </span>
                      </div>
                    )}

                    {barberBreaks.map((brk, i) => <BreakBlock key={i} brk={brk} />)}
                    {barberAppts.map((appt) => (
                      <AppointmentBlock
                        key={appt.id}
                        appt={appt}
                        onOpen={handleOpenPopup}
                        onQuickAction={handleQuickAction}
                        isRecent={recentStatusId === appt.id}
                      />
                    ))}
                  </div>
                );
              })}

              {/* Current time indicator — spans the entire content width */}
              {showNow && (
                <div
                  key={`now-${nowTick}`}
                  style={{
                    position: "absolute",
                    top: `${nowTop}px`,
                    left: 0, right: 0,
                    height: 0,
                    zIndex: 20, pointerEvents: "none",
                  }}
                >
                  {/* Time label in the gutter */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: "-8px",
                    width: `${TIME_COL_W}px`,
                    display: "flex", justifyContent: "flex-end", paddingRight: "6px",
                  }}>
                    <span style={{
                      fontSize: "10px",
                      color: "#dc2626",
                      fontWeight: 700,
                      fontFamily: "'DM Mono', monospace",
                      background: C.bg,
                      padding: "1px 4px",
                      borderRadius: "3px",
                      lineHeight: 1,
                    }}>
                      {nowLabel}
                    </span>
                  </div>

                  {/* Red line across all barber columns */}
                  <div style={{
                    position: "absolute",
                    left: `${TIME_COL_W}px`,
                    right: 0,
                    top: 0,
                    height: 0,
                    borderTop: "1.5px solid #dc2626",
                  }} />

                  {/* Dot at the start of the line */}
                  <div style={{
                    position: "absolute",
                    left: `${TIME_COL_W - 3}px`,
                    top: "-3px",
                    width: "6px", height: "6px",
                    borderRadius: "50%",
                    background: "#dc2626",
                    boxShadow: "0 0 0 2px var(--makas-bg)",
                  }} />
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
                          onClick={(e) => handleOpenPopup(appt, { x: e.clientX, y: e.clientY })}
                          style={{ padding: "10px 14px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <span style={{ fontSize: "11px", color: sc.color, fontWeight: 600, fontFamily: "'DM Mono', monospace", minWidth: "36px", flexShrink: 0 }}>{appt.time}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client}</div>
                              <div style={{ fontSize: "10px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.service}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                                <div style={{ width: "14px", height: "14px", background: C.primary, borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6px", fontWeight: 700, color: "var(--makas-bg)" }}>
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
              <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "11px", color: C.secondary }}>Toplam kasa</span>
                <span style={{ fontSize: "13px", color: C.primary, fontWeight: 600 }}>{fmtCurrency(todayRevenue)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      </div>{/* end desktop flex */}

      {/* Popup — controlled by CalendarView so all cards share one instance */}
      {activePopupAppt && (
        <AppointmentPopup
          appt={activePopupAppt}
          barbers={barbers}
          anchor={popup?.anchor}
          onClose={handleClosePopup}
          onStatusChange={handleStatusChange}
          onEdit={handleEditFromPopup}
          onDelete={handleDeleteFromPopup}
        />
      )}

      {/* Shared modal (create/edit) */}
      {showModal && (
        <ManualBookingModal
          defaultBarberId={modalBarberId}
          initialDate={date}
          editAppointment={modalEditAppt}
          onClose={() => { setShowModal(false); setModalEditAppt(null); }}
        />
      )}
    </>
  );
}

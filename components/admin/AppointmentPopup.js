"use client";

// Detail popup for a single appointment on the desktop calendar timeline.
// Renders customer info, service + barber + price + notes, a custom status
// dropdown, and edit/delete actions. Status changes bubble up to the caller
// which is expected to route COMPLETED / CANCELLED through their respective
// modals (handled by AppointmentsContext.updateStatus).

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Scissors, User as UserIcon, DollarSign, StickyNote,
  Pencil, Trash2, Check, ChevronDown,
  Clock, CheckCircle2, Zap, CheckCheck, UserX, XCircle, AlertCircle,
} from "lucide-react";
import { C, SHADOW } from "@/lib/adminTheme";

// Matches the visual language spec — labels/colors reused from CalendarView.
const SC = {
  pending:         { label: "Bekleniyor",        color: "#B45309", bg: "rgba(180,83,9,0.15)",    icon: Clock         },
  confirmed:       { label: "Onaylandı",          color: "#15803D", bg: "rgba(21,128,61,0.15)",   icon: CheckCircle2  },
  "arrival-check": { label: "Varış Bekleniyor",   color: "#7C3AED", bg: "rgba(124,58,237,0.15)",  icon: AlertCircle   },
  "in-progress":   { label: "Devam Ediyor",       color: "#2563EB", bg: "rgba(37,99,235,0.15)",   icon: Zap           },
  completed:       { label: "Tamamlandı",          color: "#57514B", bg: "rgba(87,81,75,0.15)",    icon: CheckCheck    },
  noshow:          { label: "Gelmedi",             color: "#111111", bg: "rgba(17,17,17,0.15)",    icon: UserX         },
  cancelled:       { label: "İptal",               color: "#52525b", bg: "rgba(82,82,91,0.15)",    icon: XCircle       },
};

const STATUS_ORDER = ["pending", "confirmed", "arrival-check", "in-progress", "completed", "noshow", "cancelled"];

function fmtCurrency(v) {
  if (v == null) return null;
  return `₺${Number(v).toLocaleString("tr-TR")}`;
}

// ─── Status dropdown ─────────────────────────────────────────────────────────
function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = SC[value] ?? SC.pending;
  const CurrentIcon = current.icon;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 12px",
          background: current.bg,
          border: `1px solid ${current.color}55`,
          borderRadius: "8px",
          cursor: "pointer",
          transition: "border-color 0.12s",
        }}
      >
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: current.color, flexShrink: 0 }} />
        <CurrentIcon size={14} color={current.color} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: current.color, fontWeight: 600, flex: 1, textAlign: "left" }}>
          {current.label}
        </span>
        <ChevronDown
          size={14}
          color={current.color}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0, right: 0,
              background: "var(--makas-surface)",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              boxShadow: SHADOW.pop,
              zIndex: 20,
              overflow: "hidden",
              padding: "4px",
            }}
          >
            {STATUS_ORDER.map((key) => {
              const cfg = SC[key];
              const OptIcon = cfg.icon;
              const active = value === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setOpen(false); onChange(key); }}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 10px",
                    background: active ? cfg.bg : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "var(--makas-surface2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <OptIcon size={14} color={cfg.color} style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: "12px",
                    color: active ? cfg.color : C.primary,
                    fontWeight: active ? 600 : 500,
                    flex: 1,
                  }}>
                    {cfg.label}
                  </span>
                  {active && <Check size={13} color={cfg.color} style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Popup ───────────────────────────────────────────────────────────────────
// Positioning: caller may pass anchor {x, y} in viewport coords (usually the
// mouse-click point). We clamp the popup to the viewport so it never overflows;
// if no anchor is given, we centre-fix it.
export default function AppointmentPopup({
  appt,
  barbers = [],
  anchor = null,
  onClose,
  onStatusChange,
  onEdit,
  onDelete,
}) {
  const POPUP_W = 320;
  const POPUP_MAX_H = 520;
  const MARGIN = 12;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!appt) return null;

  const sc = SC[appt.status] ?? SC.pending;

  // Resolve barber (needed if we ever want to swap the raw name string for a
  // canonical display name). Falls back to the string embedded on the appt.
  const barber = barbers.find(
    (b) => b.id === appt.barberId
  );
  const barberName = barber?.nameTr ?? barber?.name ?? appt.barber ?? "—";

  // Compute a clamped fixed position from the anchor.
  let posStyle;
  if (anchor && typeof window !== "undefined") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = anchor.x + 12;
    let top  = anchor.y + 12;
    if (left + POPUP_W + MARGIN > vw) left = Math.max(MARGIN, anchor.x - POPUP_W - 12);
    if (left < MARGIN) left = MARGIN;
    if (top + POPUP_MAX_H + MARGIN > vh) top = Math.max(MARGIN, vh - POPUP_MAX_H - MARGIN);
    if (top < MARGIN) top = MARGIN;
    posStyle = { top: `${top}px`, left: `${left}px` };
  } else {
    posStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  const price = fmtCurrency(appt.price);

  return (
    <AnimatePresence>
      <div
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ position: "fixed", inset: 0, zIndex: 70 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            ...posStyle,
            zIndex: 71,
            width: `${POPUP_W}px`,
            background: "var(--makas-surface)",
            border: `1px solid ${C.border}`,
            borderTop: `3px solid ${sc.color}`,
            borderRadius: "12px",
            boxShadow: SHADOW.pop,
            overflow: "hidden",
          }}
        >
          {/* ── Header ── */}
          <div style={{ padding: "16px 16px 12px", position: "relative" }}>
            <button
              onClick={onClose}
              aria-label="Kapat"
              style={{
                position: "absolute",
                top: "10px", right: "10px",
                width: "28px", height: "28px",
                background: "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: C.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--makas-surface2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={15} />
            </button>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "2px 8px",
              background: sc.bg,
              borderRadius: "10px",
              marginBottom: "8px",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.color }} />
              <span style={{ fontSize: "10px", color: sc.color, fontWeight: 600, letterSpacing: "0.03em" }}>
                {sc.label}
              </span>
            </div>

            <div style={{
              fontSize: "16px", fontWeight: 700, color: C.primary,
              lineHeight: 1.25, paddingRight: "24px",
            }}>
              {appt.client}
            </div>
            {appt.phone && (
              <div style={{
                fontSize: "12px", color: C.muted,
                marginTop: "2px",
                fontFamily: "'DM Mono', monospace",
              }}>
                {appt.phone}
              </div>
            )}
          </div>

          {/* ── Info block ── */}
          <div style={{
            padding: "12px 16px",
            borderTop: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            {/* Service + duration */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "24px", height: "24px",
                borderRadius: "6px",
                background: "var(--makas-surface2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Scissors size={13} color={C.secondary} />
              </div>
              <span style={{ fontSize: "13px", color: C.primary, flex: 1, fontWeight: 500 }}>
                {appt.service}
              </span>
              <span style={{
                fontSize: "11px", color: C.muted,
                fontFamily: "'DM Mono', monospace",
                background: "var(--makas-surface2)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}>
                {appt.duration}dk
              </span>
            </div>

            {/* Barber */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "24px", height: "24px",
                borderRadius: "6px",
                background: "var(--makas-surface2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <UserIcon size={13} color={C.secondary} />
              </div>
              <span style={{ fontSize: "13px", color: C.primary, flex: 1 }}>
                {barberName}
              </span>
            </div>

            {/* Price (only if > 0) */}
            {price && (appt.price ?? 0) > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "24px", height: "24px",
                  borderRadius: "6px",
                  background: "var(--makas-surface2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <DollarSign size={13} color={C.secondary} />
                </div>
                <span style={{ fontSize: "13px", color: C.primary, fontWeight: 600 }}>
                  {price}
                </span>
              </div>
            )}
          </div>

          {/* ── Notes (if present) ── */}
          {appt.notes && (
            <div style={{
              padding: "12px 16px",
              borderTop: `1px solid ${C.border}`,
              display: "flex", gap: "10px", alignItems: "flex-start",
            }}>
              <div style={{
                width: "24px", height: "24px",
                borderRadius: "6px",
                background: "var(--makas-surface2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <StickyNote size={13} color={C.secondary} />
              </div>
              <div style={{
                fontSize: "12px", color: C.secondary,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                flex: 1,
              }}>
                {appt.notes}
              </div>
            </div>
          )}

          {/* ── Status dropdown ── */}
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
            <div style={{
              fontSize: "10px", color: C.muted,
              letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: "6px", fontWeight: 600,
            }}>
              Durum
            </div>
            <StatusDropdown
              value={appt.status}
              onChange={(next) => onStatusChange?.(appt.id, next)}
            />
          </div>

          {/* ── Actions ── */}
          <div style={{
            display: "flex", gap: "8px",
            padding: "12px 16px 16px",
            borderTop: `1px solid ${C.border}`,
          }}>
            {onEdit && (
              <button
                onClick={() => onEdit(appt)}
                style={{
                  flex: 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "9px 10px",
                  background: "var(--makas-surface2)",
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  fontSize: "12px", fontWeight: 600,
                  color: C.primary,
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--makas-surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--makas-surface2)")}
              >
                <Pencil size={13} />
                Düzenle
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(appt)}
                style={{
                  flex: 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "9px 10px",
                  background: "rgba(185,28,28,0.08)",
                  border: "1px solid rgba(185,28,28,0.25)",
                  borderRadius: "8px",
                  fontSize: "12px", fontWeight: 600,
                  color: "#b91c1c",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(185,28,28,0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(185,28,28,0.08)")}
              >
                <Trash2 size={13} />
                Sil
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

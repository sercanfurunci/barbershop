"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, SHADOW } from "@/lib/adminTheme";
import { ALL_STATUS, FLOW } from "./statusConstants";

export function TimelineItem({ appt, isNext, isPast, onAction, index }) {
  const [expanded, setExpanded] = useState(false);
  const sc    = ALL_STATUS[appt.status] ?? ALL_STATUS.pending;
  const isDone = ["completed", "noshow", "cancelled"].includes(appt.status);
  // Primary next-action: one-tap shortcut so phones don't need to expand the row.
  const primary = appt.status === "pending"
    ? FLOW.find(f => f.key === "confirmed")
    : appt.status === "confirmed"
      ? FLOW.find(f => f.key === "completed")
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div
        onClick={() => !isDone && setExpanded(v => !v)}
        style={{
          background: isNext ? C.cardHi : C.card,
          border: `1px solid ${isNext ? sc.color + "44" : C.border}`,
          borderRadius: "12px",
          padding: "14px 16px",
          cursor: isDone ? "default" : "pointer",
          opacity: isPast && isDone ? 0.55 : 1,
          transition: "border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
          position: "relative",
          boxShadow: SHADOW.card,
        }}
        onMouseEnter={e => { if (!isDone) { e.currentTarget.style.borderColor = sc.color + "55"; e.currentTarget.style.background = C.cardHi; e.currentTarget.style.boxShadow = SHADOW.elevated; }}}
        onMouseLeave={e => { if (!isDone) { e.currentTarget.style.borderColor = isNext ? sc.color + "44" : C.border; e.currentTarget.style.background = isNext ? C.cardHi : C.card; e.currentTarget.style.boxShadow = SHADOW.card; }}}
      >
        {/* Top row: time + client/service + primary action */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Time */}
          <div style={{ textAlign: "center", minWidth: "46px", flexShrink: 0 }}>
            <div className="font-mono-custom" style={{ fontSize: "15px", color: isNext ? sc.color : C.primary, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.01em" }}>
              {appt.time}
            </div>
            <div className="font-mono-custom" style={{ fontSize: "9px", color: C.muted, marginTop: "3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{appt.duration}DK</div>
          </div>

          <div style={{ width: "1px", height: "36px", background: C.border, flexShrink: 0 }} />

          {/* Client + service */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13.5px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.005em" }}>
              {appt.client}
              {appt.source === "manual" && (
                <span className="font-mono-custom" style={{ marginLeft: "8px", fontSize: "8.5px", padding: "1.5px 6px", borderRadius: "999px", background: "rgba(96,165,250,0.1)", color: "#2563EB", border: "1px solid rgba(96,165,250,0.2)", fontWeight: 600, letterSpacing: "0.06em", verticalAlign: "middle" }}>TEL</span>
              )}
            </div>
            <div style={{ fontSize: "11.5px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
              {appt.service}
              {appt.phone && <span className="font-mono-custom hidden sm:inline" style={{ marginLeft: "8px", color: C.muted }}>· {appt.phone}</span>}
            </div>
          </div>

          {/* Price — hidden on small screens to prevent overflow */}
          <div className="font-mono-custom hidden sm:block" style={{ fontSize: "14px", color: isDone ? C.secondary : C.primary, fontWeight: 600, flexShrink: 0 }}>
            {appt.price == null ? "Sorulur" : `₺${appt.price.toLocaleString()}`}
          </div>

          {/* Status badge */}
          <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 9px", borderRadius: "999px", background: sc.bg, fontSize: "10.5px", color: sc.color, fontWeight: 600, flexShrink: 0, minWidth: "58px", justifyContent: "center" }}>
            {sc.label}
          </div>

          {/* Inline primary action — one-tap shortcut (44px touch target) */}
          {primary && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(appt.id, primary.key); }}
              style={{
                minHeight: "44px",
                padding: "0 12px",
                borderRadius: "8px",
                background: primary.bg,
                border: `1px solid ${primary.color}40`,
                fontSize: "12px",
                color: primary.color,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = primary.color; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = primary.color; }}
              onMouseLeave={e => { e.currentTarget.style.background = primary.bg; e.currentTarget.style.color = primary.color; e.currentTarget.style.borderColor = primary.color + "40"; }}
            >
              {primary.shortLabel}
            </button>
          )}
        </div>

        {/* Price row — visible only on small screens where it's hidden above */}
        <div className="flex items-center justify-between mt-1.5 sm:hidden">
          <div className="font-mono-custom" style={{ fontSize: "12px", color: isDone ? C.secondary : C.primary, fontWeight: 600 }}>
            {appt.price == null ? "Sorulur" : `₺${appt.price.toLocaleString()}`}
          </div>
        </div>

        {/* Quick actions (expanded) */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ display: "flex", gap: "6px", marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
                {FLOW.map(f => (
                  <button
                    key={f.key}
                    onClick={(e) => { e.stopPropagation(); onAction(appt.id, f.key); setExpanded(false); }}
                    style={{
                      flex: 1, minHeight: "44px", borderRadius: "8px",
                      background: appt.status === f.key ? f.bg : "none",
                      border: `1px solid ${appt.status === f.key ? f.color + "50" : C.border}`,
                      fontSize: "12px", color: appt.status === f.key ? f.color : C.secondary,
                      cursor: "pointer", fontWeight: appt.status === f.key ? 600 : 400,
                    }}
                    onMouseEnter={e => { if (appt.status !== f.key) { e.currentTarget.style.background = f.bg; e.currentTarget.style.color = f.color; }}}
                    onMouseLeave={e => { if (appt.status !== f.key) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.secondary; }}}
                  >
                    {f.shortLabel}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default TimelineItem;

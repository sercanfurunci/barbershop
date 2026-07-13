"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { C, SHADOW } from "@/lib/adminTheme";
import { ALL_STATUS, FLOW } from "./statusConstants";

export function NextAppointmentCard({ appt, onAction }) {
  if (!appt) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "22px 24px", display: "flex", alignItems: "center", gap: "16px", boxShadow: SHADOW.card }}>
        <div style={{ width: "46px", height: "46px", background: C.surface, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", opacity: 0.45 }}>✂</div>
        <div>
          <div style={{ fontSize: "13.5px", color: C.secondary, fontWeight: 500 }}>Sonraki randevu yok</div>
          <div style={{ fontSize: "11.5px", color: C.muted, marginTop: "3px" }}>Bugün geri kalan süre için müsaitsiniz</div>
        </div>
      </div>
    );
  }

  const sc = ALL_STATUS[appt.status] ?? ALL_STATUS.pending;
  const isActive = false;

  return (
    <motion.div
      layout
      style={{
        background: isActive ? "#EFF4FD" : C.card,
        border: `1px solid ${isActive ? "rgba(96,165,250,0.25)" : sc.color + "33"}`,
        borderRadius: "14px",
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
        boxShadow: SHADOW.card,
      }}
    >
      {isActive && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #2563EB, transparent)", opacity: 0.6 }} />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div className="font-mono-custom" style={{ fontSize: "24px", color: sc.color, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>{appt.time}</div>
          <div className="font-mono-custom" style={{ fontSize: "10px", color: C.muted, marginTop: "4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{appt.duration} DK</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "16px", color: C.primary, fontWeight: 600, marginBottom: "3px", letterSpacing: "-0.01em" }}>{appt.client}</div>
          <div style={{ fontSize: "13px", color: C.secondary, marginBottom: appt.phone ? "3px" : 0 }}>{appt.service}</div>
          {appt.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Phone size={10} style={{ color: C.muted }} />
              <span className="font-mono-custom" style={{ fontSize: "11px", color: C.muted }}>{appt.phone}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0, alignItems: "flex-end" }}>
          <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 9px", borderRadius: "999px", background: sc.bg, fontSize: "10.5px", color: sc.color, fontWeight: 600, letterSpacing: "0.01em" }}>
            {sc.label}
          </div>
          <div className="font-mono-custom" style={{ fontSize: "15px", color: C.primary, fontWeight: 700, textAlign: "right" }}>
            {appt.price == null ? "Sorulur" : `₺${appt.price.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div style={{ display: "flex", gap: "6px", marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${C.border}` }}>
        {FLOW.filter(f => f.key !== appt.status).map(f => (
          <button
            key={f.key}
            onClick={() => onAction(appt.id, f.key)}
            style={{
              flex: 1, minHeight: "44px", borderRadius: "8px",
              background: "none", border: `1px solid ${C.border}`,
              fontSize: "12px", color: C.secondary, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = f.bg; e.currentTarget.style.borderColor = f.color + "40"; e.currentTarget.style.color = f.color; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.secondary; }}
          >
            {f.shortLabel}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default NextAppointmentCard;

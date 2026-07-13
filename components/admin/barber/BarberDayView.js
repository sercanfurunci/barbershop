"use client";

import { AlertCircle } from "lucide-react";
import { C, SHADOW } from "@/lib/adminTheme";
import { nowTimeStr, isToday } from "@/lib/adminDateUtils";
import { NextAppointmentCard } from "./NextAppointmentCard";
import { TimelineItem } from "./TimelineItem";

export function BarberDayView({ barberId, date, appointments, updateStatus }) {
  const now        = nowTimeStr();
  const isToday_   = isToday(date);
  const dayAppts   = appointments
    .filter(a => a.barberId === barberId && a.date === date && a.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));
  const pending    = dayAppts.filter(a => a.status === "pending").length;
  const confirmed  = dayAppts.filter(a => a.status === "confirmed").length;
  const completed  = dayAppts.filter(a => a.status === "completed").length;
  // Barber's own earnings (their commission share). Legacy rows without
  // barberAmount fall back to the gross price so historic totals don't go to 0.
  const revenue    = dayAppts
    .filter(a => a.status === "completed")
    .reduce((s, a) => s + ((a.barberAmount ?? a.price) || 0) + (a.tipAmount || 0), 0);
  const nextAppt   = isToday_ ? dayAppts.find(a => a.time >= now && ["pending", "confirmed"].includes(a.status)) : null;
  const displayNext = nextAppt;

  return (
    <>
      {/* Stats strip: 2-col on mobile, 5-col on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" style={{ marginBottom: "18px" }}>
        {[
          { label: "Toplam",   value: dayAppts.length,    color: C.primary   },
          { label: "Onaylı",   value: confirmed,           color: "#15803D"   },
          { label: "Bekliyor", value: pending,             color: "#B45309"   },
          { label: "Tamam",    value: completed,           color: C.secondary },
          { label: "Kasa",     value: `₺${revenue.toLocaleString()}`, color: C.primary },
        ].map((s, i) => (
          <div key={i} className={i === 4 ? "col-span-2 sm:col-span-1" : ""} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "12px 14px", textAlign: "center", boxShadow: SHADOW.card }}>
            <div className="font-mono-custom" style={{ fontSize: "17px", color: s.color, fontWeight: 700, lineHeight: 1, marginBottom: "5px", letterSpacing: "-0.02em" }}>{s.value}</div>
            <div className="font-mono-custom" style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next / active appointment */}
      {isToday_ && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            {"Sonraki Randevu"}
          </div>
          <NextAppointmentCard appt={displayNext} onAction={updateStatus} />
        </div>
      )}

      {/* Pending banner */}
      {pending > 0 && isToday_ && (
        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={14} style={{ color: "#B45309", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#B45309", fontWeight: 500 }}>{pending} randevu onay bekliyor</span>
        </div>
      )}

      {/* Timeline */}
      <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
        {isToday_ ? "Bugünün Programı" : "Günün Programı"} · {dayAppts.length} randevu
      </div>
      {dayAppts.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", opacity: 0.2, marginBottom: "8px" }}>✂</div>
          <div style={{ fontSize: "13px", color: C.secondary }}>Bu gün için randevu yok</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {dayAppts.map((appt, i) => {
            const isPast = isToday_ && appt.time < now;
            const isNext = appt.id === displayNext?.id;
            return <TimelineItem key={appt.id} appt={appt} isNext={isNext} isPast={isPast} onAction={updateStatus} index={i} />;
          })}
        </div>
      )}
    </>
  );
}

export default BarberDayView;

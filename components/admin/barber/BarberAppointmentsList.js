"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { C } from "@/lib/adminTheme";
import { todayStr } from "@/lib/utils";
import { ALL_STATUS, FLOW } from "./statusConstants";

export function BarberAppointmentsList({ barberId, appointments, onAction, onNewBooking }) {
  const today = todayStr();

  const { upcoming, dateGroups } = useMemo(() => {
    const upcoming = appointments
      .filter(a => a.barberId === barberId && a.status !== "cancelled" && a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    const byDate = upcoming.reduce((acc, a) => {
      if (!acc[a.date]) acc[a.date] = [];
      acc[a.date].push(a);
      return acc;
    }, {});

    return { upcoming, dateGroups: Object.entries(byDate) };
  }, [appointments, barberId, today]);

  if (dateGroups.length === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.2 }}>✂</div>
        <div style={{ fontSize: "13px", color: C.secondary, marginBottom: "16px" }}>Yaklaşan randevu yok</div>
        <button
          onClick={onNewBooking}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: C.primary, border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", color: "#fff", cursor: "pointer", fontWeight: 600 }}
        >
          <Plus size={14} /> Randevu Ekle
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Yaklaşan Randevular · {upcoming.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {dateGroups.map(([dateStr, appts]) => {
          const label = dateStr === today ? "Bugün" : new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
          return (
            <div key={dateStr}>
              <div style={{ fontSize: "11px", color: dateStr === today ? C.primary : C.secondary, fontWeight: 600, letterSpacing: "0.05em", marginBottom: "8px", textTransform: dateStr === today ? "uppercase" : "none" }}>
                {label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {appts.map((appt) => {
                  const sc = ALL_STATUS[appt.status] ?? ALL_STATUS.pending;
                  return (
                    <div key={appt.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "center", minWidth: "40px", flexShrink: 0 }}>
                          <div style={{ fontSize: "14px", color: C.primary, fontWeight: 700, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{appt.time}</div>
                          <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>{appt.duration}dk</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client}</div>
                          <div style={{ fontSize: "11px", color: C.secondary, marginTop: "1px" }}>{appt.service}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                          <span style={{ fontSize: "13px", color: C.primary, fontWeight: 600 }}>{appt.price == null ? "Sorulur" : `₺${appt.price.toLocaleString()}`}</span>
                          <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "4px", background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                        </div>
                      </div>
                      {!["completed", "cancelled", "noshow"].includes(appt.status) && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                          {FLOW.filter(f => f.key !== appt.status).slice(0, 3).map(f => (
                            <button
                              key={f.key}
                              onClick={() => onAction(appt.id, f.key)}
                              style={{ flex: 1, minHeight: "36px", borderRadius: "7px", background: "none", border: `1px solid ${C.border}`, fontSize: "11px", color: C.secondary, cursor: "pointer" }}
                              onMouseEnter={e => { e.currentTarget.style.background = f.bg; e.currentTarget.style.color = f.color; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.secondary; }}
                            >
                              {f.shortLabel}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BarberAppointmentsList;

"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, addDays, startOfDay, isBefore,
  addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay,
} from "date-fns";
import { tr as dateFnsTr, enUS } from "date-fns/locale";
import { apiFetch } from "@/lib/api";

// Day-status legend:
//   🟢 working       — selectable
//   🟡 fullyBooked   — selectable, marked "Dolu"
//   ⚫ closed        — disabled, marked "Kapalı"
//   🔴 holiday       — disabled, marked "İzinli"
//
// `dayMap` comes from /api/availability/range and is authoritative. Falls back
// to a plain today+30 window when barber/service aren't ready yet.
export default function DateSelect({ shopId, booking, selectedDate, onSelect, lang = "tr" }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ?? new Date());
  const [dayMap, setDayMap] = useState({});     // { "YYYY-MM-DD": { status, label? } }
  const today    = startOfDay(new Date());
  const maxDate  = addDays(today, 30);
  const locale   = lang === "tr" ? dateFnsTr : enUS;

  const barberId  = booking?.barber?.id;
  const serviceId = booking?.service?.id;
  const canFetch  = !!(shopId && barberId && serviceId);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    const startStr = format(new Date(), "yyyy-MM-dd");
    apiFetch(`/api/availability/range?shopId=${shopId}&barberId=${barberId}&serviceId=${serviceId}&start=${startStr}&days=60`)
      .then(r => { if (!cancelled) setDayMap(r.days ?? {}); })
      .catch(() => { if (!cancelled) setDayMap({}); });
    return () => { cancelled = true; };
  }, [shopId, barberId, serviceId, canFetch]);

  const dayState = (date) => {
    const d = startOfDay(date);
    const key = format(d, "yyyy-MM-dd");
    if (isBefore(d, today) || isBefore(maxDate, d)) return { status: "past" };
    if (!canFetch)      return { status: "working" }; // fallback: don't gate before data loads
    if (dayMap[key])    return dayMap[key];
    return { status: "closed" }; // unknown = outside range
  };

  const monthStart  = startOfMonth(currentMonth);
  const monthEnd    = endOfMonth(currentMonth);
  const days        = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad    = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
  const paddedDays  = [...Array(startPad).fill(null), ...days];

  // Pad to complete the last row
  const totalCells = Math.ceil(paddedDays.length / 7) * 7;
  while (paddedDays.length < totalCells) paddedDays.push(null);

  const DAY_LABELS = lang === "tr"
    ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const badgeFor = (status) => {
    if (status === "fullyBooked") return { text: lang === "tr" ? "Dolu"  : "Full",   color: "#B45309" };
    if (status === "closed")      return { text: lang === "tr" ? "Kapalı": "Closed", color: "#8A8480" };
    if (status === "holiday")     return { text: lang === "tr" ? "İzinli": "Leave",  color: "#B91C1C" };
    return null;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "16px 12px 8px" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexShrink: 0 }}>
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="bg-secondary border-border text-secondary-foreground"
          style={{ width: "44px", height: "44px", borderWidth: "1px", borderStyle: "solid", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronLeft size={17} />
        </button>
        <span className="font-display font-light text-foreground" style={{ fontSize: "21px", letterSpacing: "-0.01em" }}>
          {format(currentMonth, "MMMM yyyy", { locale })}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="bg-secondary border-border text-secondary-foreground"
          style={{ width: "44px", height: "44px", borderWidth: "1px", borderStyle: "solid", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "4px", flexShrink: 0 }}>
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-muted-foreground" style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, padding: "4px 0", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — fills remaining height */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(52px, 1fr)", gap: "3px" }}>
        {paddedDays.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;
          const { status, label } = dayState(day);
          const selectable = status === "working" || status === "fullyBooked";
          const isSelected = selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isToday    = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
          const badge      = badgeFor(status);

          return (
            <button
              key={day.toISOString()}
              disabled={!selectable}
              onClick={() => onSelect(day)}
              title={status === "holiday" && label ? label : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9px",
                background: isSelected ? "var(--makas-ink)" : "transparent",
                color: isSelected ? "var(--makas-bg)" : selectable ? "var(--makas-ink)" : "#CEC8C0",
                fontSize: "16px",
                fontWeight: isToday ? 700 : 400,
                cursor: selectable ? "pointer" : "not-allowed",
                border: "none",
                position: "relative",
                transition: "background 0.13s",
                padding: "4px 2px",
              }}
            >
              {format(day, "d")}
              {badge && !isSelected && (
                <span style={{ fontSize: "8px", fontWeight: 600, letterSpacing: "0.03em", color: badge.color, marginTop: "1px", textTransform: "uppercase" }}>
                  {badge.text}
                </span>
              )}
              {isToday && !badge && !isSelected && (
                <div style={{ position: "absolute", bottom: "5px", left: "50%", transform: "translateX(-50%)", width: "3px", height: "3px", borderRadius: "50%", background: "var(--makas-ink)" }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

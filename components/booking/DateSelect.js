"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, addDays, startOfDay, isBefore,
  addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay,
} from "date-fns";
import { tr as dateFnsTr, enUS } from "date-fns/locale";

const C = {
  bg: "#F6F3EE", card: "#FFFFFF", border: "#E5DFD6", surface: "#EFEAE2",
  primary: "#111111", secondary: "#44403C", muted: "#6B7280",
};

export default function DateSelect({ selectedDate, onSelect, lang = "tr" }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ?? new Date());
  const today    = startOfDay(new Date());
  const maxDate  = addDays(today, 30);
  const locale   = lang === "tr" ? dateFnsTr : enUS;

  const isAvailable = (date) => {
    const d = startOfDay(date);
    return !isBefore(d, today) && !isBefore(maxDate, d);
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

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "16px 12px 8px" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexShrink: 0 }}>
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          style={{ width: "38px", height: "38px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "9px", color: C.secondary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronLeft size={17} />
        </button>
        <span className="font-display font-light" style={{ fontSize: "21px", color: C.primary, letterSpacing: "-0.01em" }}>
          {format(currentMonth, "MMMM yyyy", { locale })}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={{ width: "38px", height: "38px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "9px", color: C.secondary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "4px", flexShrink: 0 }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "10px", color: C.muted, fontWeight: 600, padding: "4px 0", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — fills remaining height */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(40px, 1fr)", gap: "3px" }}>
        {paddedDays.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;
          const available  = isAvailable(day);
          const isSelected = selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isToday    = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

          return (
            <button
              key={day.toISOString()}
              disabled={!available}
              onClick={() => onSelect(day)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9px",
                background: isSelected ? C.primary : "transparent",
                color: isSelected ? "#fff" : available ? C.primary : "#CEC8C0",
                fontSize: "16px",
                fontWeight: isToday ? 700 : 400,
                cursor: available ? "pointer" : "not-allowed",
                border: "none",
                position: "relative",
                transition: "background 0.13s",
              }}
            >
              {format(day, "d")}
              {isToday && !isSelected && (
                <div style={{ position: "absolute", bottom: "5px", left: "50%", transform: "translateX(-50%)", width: "3px", height: "3px", borderRadius: "50%", background: C.primary }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

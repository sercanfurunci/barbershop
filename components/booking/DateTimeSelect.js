"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { timeSlots, unavailableSlots } from "@/lib/data";
import { format, addDays, startOfDay, isBefore, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { tr as dateFnsTr, enUS } from "date-fns/locale";

const C = {
  bg:       "#070707",
  card:     "#0f0f14",
  border:   "rgba(255,255,255,0.07)",
  surface:  "#16161e",
  primary:  "#F0EDE8",
  secondary:"#6b6870",
  muted:    "#2e2d35",
  red:      "#CC1A1A",
};

export default function DateTimeSelect({ booking, selectedDate, selectedTime, onSelect, onNext, onBack, lang = "tr", tx }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localDate, setLocalDate] = useState(selectedDate);
  const [localTime, setLocalTime] = useState(selectedTime);
  const s3 = tx?.booking?.step3 ?? {};
  const locale = lang === "tr" ? dateFnsTr : enUS;

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPad = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const DAY_LABELS = lang === "tr"
    ? ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"]
    : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const isDateAvailable = (date) => {
    const d = startOfDay(date);
    if (isBefore(d, today)) return false;
    if (isBefore(maxDate, d)) return false;
    if (getDay(date) === 0) return false;
    return true;
  };

  const getBarberUnavailableSlots = () => {
    if (!booking.barber || booking.barber.id === "any") return [];
    return unavailableSlots[booking.barber.id] || [];
  };

  const isSlotAvailable = (slot) => !getBarberUnavailableSlots().includes(slot);

  const handleContinue = () => {
    if (localDate && localTime) { onSelect(localDate, localTime); onNext(); }
  };

  const availableCount = timeSlots.filter(isSlotAvailable).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div style={{ width: "20px", height: "2px", background: C.red, borderRadius: "1px" }} />
          <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.red, fontWeight: 500 }}>
            {s3.eyebrow}
          </span>
        </div>
        <h1
          className="font-display font-light"
          style={{ fontSize: "clamp(32px, 4.5vw, 48px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "10px" }}
        >
          {s3.title?.[0]}{" "}
          <span style={{ fontStyle: "italic", color: C.red }}>{s3.title?.[1]}</span>
        </h1>
        <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.6 }}>{s3.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Calendar panel */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px" }}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="flex items-center justify-center transition-all"
              style={{
                width: "32px", height: "32px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.secondary,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.secondary; }}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-display font-light" style={{ fontSize: "16px", color: C.primary, letterSpacing: "-0.01em" }}>
              {format(currentMonth, "MMMM yyyy", { locale })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="flex items-center justify-center transition-all"
              style={{
                width: "32px", height: "32px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.secondary,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.secondary; }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center py-2" style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.04em" }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {paddedDays.map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} style={{ minHeight: "44px" }} />;
              const available = isDateAvailable(day);
              const isSelected = localDate && format(day, "yyyy-MM-dd") === format(localDate, "yyyy-MM-dd");
              const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

              return (
                <button
                  key={day.toISOString()}
                  disabled={!available}
                  onClick={() => { setLocalDate(day); setLocalTime(null); }}
                  className="flex items-center justify-center relative transition-all duration-150"
                  style={{
                    fontSize: "13px",
                    borderRadius: "8px",
                    minHeight: "44px",
                    background: isSelected ? C.red : "transparent",
                    color: isSelected ? "#fff" : available ? C.primary : C.muted,
                    cursor: available ? "pointer" : "not-allowed",
                    fontWeight: isToday ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (available && !isSelected) e.currentTarget.style.background = C.surface;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {format(day, "d")}
                  {isToday && !isSelected && (
                    <div
                      className="absolute bottom-1 left-1/2 -translate-x-1/2"
                      style={{ width: "3px", height: "3px", background: C.red, borderRadius: "50%" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots panel */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 style={{ fontSize: "14px", color: C.primary, fontWeight: 500 }}>
              {localDate
                ? format(localDate, "EEEE, d MMMM", { locale })
                : (lang === "tr" ? "Tarih seçin" : "Select a date")}
            </h3>
            {localDate && (
              <span
                className="px-2 py-1"
                style={{ fontSize: "11px", color: C.secondary, background: C.surface, borderRadius: "6px", border: `1px solid ${C.border}` }}
              >
                {availableCount} {lang === "tr" ? "uygun" : "available"}
              </span>
            )}
          </div>

          {!localDate ? (
            <div className="flex flex-col items-center justify-center" style={{ height: "260px", gap: "12px" }}>
              <div style={{ fontSize: "32px", opacity: 0.2 }}>◷</div>
              <p style={{ fontSize: "13px", color: C.muted }}>{s3.selectDate}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={localDate.toISOString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-3 gap-2 overflow-y-auto"
                style={{ maxHeight: "280px" }}
              >
                {timeSlots.map((slot) => {
                  const available = isSlotAvailable(slot);
                  const isSlotSelected = localTime === slot;
                  return (
                    <button
                      key={slot}
                      disabled={!available}
                      onClick={() => setLocalTime(slot)}
                      className="transition-all duration-150"
                      style={{ minHeight: "44px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: `1px solid ${isSlotSelected ? C.red : available ? C.border : "rgba(255,255,255,0.03)"}`,
                        background: isSlotSelected ? C.red : available ? "transparent" : "transparent",
                        color: isSlotSelected ? "#fff" : available ? C.primary : C.muted,
                        cursor: available ? "pointer" : "not-allowed",
                        textDecoration: available ? "none" : "line-through",
                      }}
                      onMouseEnter={(e) => {
                        if (available && !isSlotSelected) {
                          e.currentTarget.style.borderColor = "rgba(204,26,26,0.4)";
                          e.currentTarget.style.color = C.red;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSlotSelected) {
                          e.currentTarget.style.borderColor = available ? C.border : "rgba(255,255,255,0.03)";
                          e.currentTarget.style.color = available ? C.primary : C.muted;
                        }
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Summary bar + continue */}
      <div
        className="mt-4"
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          padding: "16px 20px",
        }}
      >
        <div style={{ fontSize: "13px", marginBottom: "12px" }}>
          {localDate && localTime ? (
            <span>
              <span style={{ color: C.primary, fontWeight: 500 }}>{format(localDate, "EEEE, d MMMM", { locale })}</span>
              <span style={{ color: C.secondary }}>{" "}{lang === "tr" ? "saat" : "at"}{" "}</span>
              <span style={{ color: C.red, fontWeight: 600 }}>{localTime}</span>
            </span>
          ) : (
            <span style={{ color: C.muted }}>{s3.noSelection}</span>
          )}
        </div>
        <button
          onClick={handleContinue}
          disabled={!localDate || !localTime}
          className="group flex items-center justify-center gap-2 w-full transition-all duration-200"
          style={{
            background: localDate && localTime ? C.red : C.surface,
            color: localDate && localTime ? "#fff" : C.muted,
            minHeight: "52px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            border: `1px solid ${localDate && localTime ? "transparent" : C.border}`,
            cursor: localDate && localTime ? "pointer" : "not-allowed",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => { if (localDate && localTime) e.currentTarget.style.background = "#E02020"; }}
          onMouseLeave={(e) => { if (localDate && localTime) e.currentTarget.style.background = C.red; }}
        >
          {s3.continue ?? (lang === "tr" ? "Devam Et" : "Continue")}
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

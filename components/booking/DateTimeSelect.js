"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  format, addDays, startOfDay, isBefore,
  addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay,
} from "date-fns";
import { tr as dateFnsTr, enUS } from "date-fns/locale";

const C = {
  bg:       "#F6F3EE",
  card:     "#FFFFFF",
  border:   "#E5DFD6",
  surface:  "#EFEAE2",
  primary:  "#111111",
  secondary:"#44403C",
  muted:    "#6B7280",
  red:      "#C62828",
};

function SlotSkeleton({ count = 8 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: "44px", background: C.surface, borderRadius: "8px", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  );
}

export default function DateTimeSelect({ booking, allBarbers = [], selectedDate, selectedTime, onSelect, onNext, onBack, lang = "tr", tx }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localDate, setLocalDate]       = useState(selectedDate);
  const [localTime, setLocalTime]       = useState(selectedTime);
  const s3 = tx?.booking?.step3 ?? {};
  const locale = lang === "tr" ? dateFnsTr : enUS;

  const today   = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  // Availability state
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotBarberMap, setSlotBarberMap]   = useState({});
  const [loadingSlots, setLoadingSlots]     = useState(false);

  // Ref-based prefetch cache: dateStr → slots[] | "loading"
  const prefetchRef = useRef({});

  // Prefetch next 7 days in background as soon as barber + service are known.
  // Uses a ref so prefetch completions don't trigger re-renders.
  useEffect(() => {
    const barberId  = booking.barber?.id;
    const serviceId = booking.service?.id;
    if (!barberId || !serviceId || barberId === "any") return;

    Array.from({ length: 7 }, (_, i) => format(addDays(today, i), "yyyy-MM-dd"))
      .filter(d => !prefetchRef.current[d])
      .forEach(d => {
        prefetchRef.current[d] = "loading";
        apiFetch(`/api/availability?barberId=${barberId}&serviceId=${serviceId}&date=${d}`)
          .then(r  => { prefetchRef.current[d] = r.slots ?? []; })
          .catch(() => { delete prefetchRef.current[d]; });
      });
  }, [booking.barber?.id, booking.service?.id]);

  useEffect(() => {
    if (!localDate || !booking.barber || !booking.service) return;
    const serviceId = booking.service.id;
    const isAny    = booking.barber.id === "any";
    const dateStr  = format(localDate, "yyyy-MM-dd");

    setLocalTime(null);
    setSlotBarberMap({});

    if (!isAny) {
      // Cache hit: instant display, no spinner
      const cached = prefetchRef.current[dateStr];
      if (Array.isArray(cached)) {
        setAvailableSlots(cached);
        setLoadingSlots(false);
        return;
      }
      // Cache miss: fetch and prime the cache for next time
      setLoadingSlots(true);
      setAvailableSlots([]);
      apiFetch(`/api/availability?barberId=${booking.barber.id}&serviceId=${serviceId}&date=${dateStr}`)
        .then((data) => {
          const slots = data.slots ?? [];
          prefetchRef.current[dateStr] = slots;
          setAvailableSlots(slots);
        })
        .catch(() => setAvailableSlots([]))
        .finally(() => setLoadingSlots(false));
    } else {
      setLoadingSlots(true);
      setAvailableSlots([]);
      const barberList = allBarbers.filter((b) => b.available);
      if (barberList.length === 0) { setLoadingSlots(false); return; }
      Promise.all(
        barberList.map((b) =>
          apiFetch(`/api/availability?barberId=${b.id}&serviceId=${serviceId}&date=${dateStr}`)
            .then((data) => ({ barberId: b.id, slots: data.slots ?? [] }))
            .catch(() => ({ barberId: b.id, slots: [] }))
        )
      ).then((results) => {
        const map = {};
        for (const { barberId, slots } of results) {
          for (const slot of slots) {
            if (!map[slot]) map[slot] = barberId;
          }
        }
        const sorted = Object.keys(map).sort();
        setSlotBarberMap(map);
        setAvailableSlots(sorted);
      }).finally(() => setLoadingSlots(false));
    }
  }, [localDate, booking.barber?.id, booking.service?.id]);

  const handleSlotClick = (slot) => {
    setLocalTime(slot);
    let resolvedBarber = null;
    if (booking.barber?.id === "any" && slotBarberMap[slot]) {
      const b = allBarbers.find((barb) => barb.id === slotBarberMap[slot]);
      if (b) resolvedBarber = b;
    }
    onSelect(localDate, slot, resolvedBarber);
  };

  const handleDateSelect = (date) => {
    setLocalDate(date);
    setLocalTime(null);
  };

  const isDateAvailable = (date) => {
    const d = startOfDay(date);
    return !isBefore(d, today) && !isBefore(maxDate, d);
  };

  // ── Mobile date strip: next 30 days ──────────────────────────────────────
  const datePills = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  // ── Desktop calendar ──────────────────────────────────────────────────────
  const monthStart  = startOfMonth(currentMonth);
  const monthEnd    = endOfMonth(currentMonth);
  const days        = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad    = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
  const paddedDays  = [...Array(startPad).fill(null), ...days];
  const DAY_LABELS  = lang === "tr"
    ? ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"]
    : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const slotGrid = (cols = 4) => (
    <AnimatePresence mode="wait">
      {loadingSlots ? (
        <SlotSkeleton count={8} />
      ) : availableSlots.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ padding: "20px 16px", textAlign: "center", fontSize: "13px", color: C.muted, background: C.card, borderRadius: "10px", border: `1px solid ${C.border}` }}
        >
          {lang === "tr" ? "Bu tarihte müsait saat yok" : "No available times on this date"}
        </motion.div>
      ) : (
        <motion.div
          key={localDate?.toISOString()}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px" }}
        >
          {availableSlots.map((slot) => {
            const isSel = localTime === slot;
            return (
              <button
                key={slot}
                onClick={() => handleSlotClick(slot)}
                style={{
                  height: "44px", borderRadius: "8px",
                  border: `1px solid ${isSel ? C.red : C.border}`,
                  background: isSel ? C.red : C.card,
                  color: isSel ? "#fff" : C.primary,
                  fontSize: "13px", fontWeight: 500,
                  cursor: "pointer", transition: "all 0.12s",
                }}
                onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.borderColor = "rgba(198,40,40,0.4)"; e.currentTarget.style.color = C.red; } }}
                onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.primary; } }}
              >
                {slot}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "14px" }}>
        <h1
          className="font-display font-light"
          style={{ fontSize: "clamp(26px, 4vw, 40px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "5px" }}
        >
          {s3.title?.[0]}{" "}
          <span style={{ fontStyle: "italic", color: C.red }}>{s3.title?.[1]}</span>
        </h1>
        <p style={{ fontSize: "13px", color: C.muted }}>{s3.subtitle}</p>
      </div>

      {/* ── MOBILE: date strip + slots ── */}
      <div className="md:hidden">
        {/* Section label */}
        <div style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: "8px", fontWeight: 500 }}>
          {lang === "tr" ? "Tarih" : "Date"}
        </div>

        {/* Date pills strip */}
        <div
          className="no-scrollbar"
          style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "16px", WebkitOverflowScrolling: "touch", flexWrap: "nowrap" }}
        >
          {datePills.map((date) => {
            const dateStr   = format(date, "yyyy-MM-dd");
            const isSelected = localDate && format(localDate, "yyyy-MM-dd") === dateStr;
            const isToday   = dateStr === format(today, "yyyy-MM-dd");
            const dayName   = format(date, "EEE", { locale }).slice(0, 3);

            return (
              <button
                key={dateStr}
                onClick={() => handleDateSelect(date)}
                style={{
                  width: "52px", flexShrink: 0,
                  paddingTop: "9px", paddingBottom: "9px",
                  borderRadius: "10px",
                  border: `1px solid ${isSelected ? C.red : C.border}`,
                  background: isSelected ? C.red : C.card,
                  color: isSelected ? "#fff" : C.primary,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "1px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "9px", letterSpacing: "0.04em", textTransform: "uppercase", color: isSelected ? "rgba(255,255,255,0.65)" : C.muted }}>
                  {dayName}
                </span>
                <span style={{ fontSize: "18px", fontWeight: isToday ? 700 : 400, lineHeight: 1.15 }}>
                  {format(date, "d")}
                </span>
                {isToday && !isSelected && (
                  <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: C.red }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Slot section */}
        {localDate ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, fontWeight: 500 }}>
                {format(localDate, "EEEE, d MMMM", { locale })}
              </div>
              {!loadingSlots && availableSlots.length > 0 && (
                <span style={{ fontSize: "11px", color: C.secondary, background: C.surface, border: `1px solid ${C.border}`, padding: "2px 8px", borderRadius: "6px" }}>
                  {availableSlots.length} {s3.available ?? (lang === "tr" ? "uygun" : "available")}
                </span>
              )}
            </div>
            {slotGrid(4)}
          </div>
        ) : (
          <div style={{ padding: "28px 16px", textAlign: "center", fontSize: "13px", color: C.muted, background: C.card, borderRadius: "10px", border: `1px dashed ${C.border}` }}>
            {lang === "tr" ? "↑ Tarih seçerek devam edin" : "↑ Select a date to see available times"}
          </div>
        )}
      </div>

      {/* ── DESKTOP: calendar + time slots side by side ── */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        {/* Calendar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              style={{ width: "30px", height: "30px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", color: C.secondary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.secondary; }}
            >
              <ChevronLeft size={13} />
            </button>
            <span className="font-display font-light" style={{ fontSize: "15px", color: C.primary, letterSpacing: "-0.01em" }}>
              {format(currentMonth, "MMMM yyyy", { locale })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              style={{ width: "30px", height: "30px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", color: C.secondary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.secondary; }}
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center py-1.5" style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.04em" }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {paddedDays.map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} style={{ minHeight: "36px" }} />;
              const available = isDateAvailable(day);
              const isSelected = localDate && format(day, "yyyy-MM-dd") === format(localDate, "yyyy-MM-dd");
              const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
              return (
                <button
                  key={day.toISOString()}
                  disabled={!available}
                  onClick={() => handleDateSelect(day)}
                  className="flex items-center justify-center relative transition-all duration-150"
                  style={{
                    fontSize: "12px", borderRadius: "7px", minHeight: "36px",
                    background: isSelected ? C.red : "transparent",
                    color: isSelected ? "#fff" : available ? C.primary : C.muted,
                    cursor: available ? "pointer" : "not-allowed",
                    fontWeight: isToday ? 700 : 400,
                  }}
                  onMouseEnter={(e) => { if (available && !isSelected) e.currentTarget.style.background = C.surface; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  {format(day, "d")}
                  {isToday && !isSelected && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2" style={{ width: "3px", height: "3px", background: C.red, borderRadius: "50%" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>
              {localDate ? format(localDate, "EEEE, d MMMM", { locale }) : (lang === "tr" ? "Tarih seçin" : "Select a date")}
            </h3>
            {localDate && !loadingSlots && availableSlots.length > 0 && (
              <span style={{ fontSize: "11px", color: C.secondary, background: C.surface, borderRadius: "6px", border: `1px solid ${C.border}`, padding: "2px 8px" }}>
                {availableSlots.length} {s3.available ?? (lang === "tr" ? "uygun" : "available")}
              </span>
            )}
          </div>

          {!localDate ? (
            <div className="flex flex-col items-center justify-center" style={{ height: "220px", gap: "10px" }}>
              <div style={{ fontSize: "28px", opacity: 0.15 }}>◷</div>
              <p style={{ fontSize: "13px", color: C.muted }}>{s3.selectDate}</p>
            </div>
          ) : (
            <div style={{ maxHeight: "240px", overflowY: "auto" }} className="no-scrollbar">
              {slotGrid(3)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

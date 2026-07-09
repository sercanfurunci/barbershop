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

function SlotSkeleton({ count = 8 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-secondary" style={{ height: "44px", borderRadius: "8px", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  );
}

export default function DateTimeSelect({ shopId, booking, allBarbers = [], selectedDate, selectedTime, onSelect, onNext, onBack, lang = "tr", tx }) {
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

  // Per-day status for calendar rendering: { "YYYY-MM-DD": { status, label? } }
  const [dayMap, setDayMap] = useState({});

  // Ref-based prefetch cache: dateStr → slots[] | "loading"
  const prefetchRef = useRef({});

  // Load calendar day-states as soon as barber+service are known.
  useEffect(() => {
    const barberId  = booking.barber?.id;
    const serviceId = booking.service?.id;
    if (!shopId || !barberId || !serviceId) return;
    let cancelled = false;
    const startStr = format(new Date(), "yyyy-MM-dd");
    apiFetch(`/api/availability/range?shopId=${shopId}&barberId=${barberId}&serviceId=${serviceId}&start=${startStr}&days=60`)
      .then(r => { if (!cancelled) setDayMap(r.days ?? {}); })
      .catch(() => { if (!cancelled) setDayMap({}); });
    return () => { cancelled = true; };
  }, [shopId, booking.barber?.id, booking.service?.id]);

  // Prefetch next 7 days in background as soon as barber + service are known.
  // Uses a ref so prefetch completions don't trigger re-renders.
  useEffect(() => {
    const barberId  = booking.barber?.id;
    const serviceId = booking.service?.id;
    if (!shopId || !barberId || !serviceId || barberId === "any") return;

    Array.from({ length: 7 }, (_, i) => format(addDays(today, i), "yyyy-MM-dd"))
      .filter(d => !prefetchRef.current[d])
      .forEach(d => {
        prefetchRef.current[d] = "loading";
        apiFetch(`/api/availability?shopId=${shopId}&barberId=${barberId}&serviceId=${serviceId}&date=${d}`)
          .then(r  => { prefetchRef.current[d] = r.slots ?? []; })
          .catch(() => { delete prefetchRef.current[d]; });
      });
  }, [shopId, booking.barber?.id, booking.service?.id]);

  useEffect(() => {
    if (!localDate || !booking.barber || !booking.service) return;
    const serviceId = booking.service.id;
    const isAny    = booking.barber.id === "any";
    const dateStr  = format(localDate, "yyyy-MM-dd");

    setLocalTime(null);
    setSlotBarberMap({});

    const base = `shopId=${shopId}&serviceId=${serviceId}&date=${dateStr}`;

    if (!isAny) {
      const cached = prefetchRef.current[dateStr];
      if (Array.isArray(cached)) {
        setAvailableSlots(cached);
        setLoadingSlots(false);
        return;
      }
      setLoadingSlots(true);
      setAvailableSlots([]);
      apiFetch(`/api/availability?${base}&barberId=${booking.barber.id}`)
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
          apiFetch(`/api/availability?${base}&barberId=${b.id}`)
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
        setSlotBarberMap(map);
        setAvailableSlots(Object.keys(map).sort());
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

  const dayState = (date) => {
    const key = format(date, "yyyy-MM-dd");
    if (!isDateAvailable(date)) return { status: "past" };
    if (dayMap[key]) return dayMap[key];
    return Object.keys(dayMap).length === 0 ? { status: "working" } : { status: "closed" };
  };

  const badgeFor = (status) => {
    if (status === "fullyBooked") return { text: lang === "tr" ? "Dolu"   : "Full",   color: "#B45309" };
    if (status === "closed")      return { text: lang === "tr" ? "Kapalı" : "Closed", color: "#8A8480" };
    if (status === "holiday")     return { text: lang === "tr" ? "İzinli" : "Leave",  color: "#B91C1C" };
    return null;
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
          className="bg-card border-border text-muted-foreground"
          style={{ padding: "20px 16px", textAlign: "center", fontSize: "13px", borderRadius: "10px", borderWidth: "1px", borderStyle: "solid" }}
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
                  border: `1px solid ${isSel ? "var(--makas-ink)" : "var(--makas-border)"}`,
                  background: isSel ? "var(--makas-ink)" : "var(--makas-surface)",
                  color: isSel ? "var(--makas-bg)" : "var(--makas-ink)",
                  fontSize: "13px", fontWeight: 500,
                  cursor: "pointer", transition: "all 0.12s",
                }}
                onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.borderColor = "rgba(17,17,17,0.4)"; e.currentTarget.style.color = "var(--makas-ink)"; } }}
                onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.borderColor = "var(--makas-border)"; e.currentTarget.style.color = "var(--makas-ink)"; } }}
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
          className="font-display font-light text-foreground"
          style={{ fontSize: "clamp(26px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "5px" }}
        >
          {s3.title?.[0]}{" "}
          <span className="text-foreground" style={{ fontStyle: "italic" }}>{s3.title?.[1]}</span>
        </h1>
        <p className="text-muted-foreground" style={{ fontSize: "13px" }}>{s3.subtitle}</p>
      </div>

      {/* ── MOBILE: date strip + slots ── */}
      <div className="md:hidden">
        {/* Section label */}
        <div className="text-muted-foreground" style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px", fontWeight: 500 }}>
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
            const { status, label } = dayState(date);
            const selectable = status === "working" || status === "fullyBooked";
            const badge = badgeFor(status);

            return (
              <button
                key={dateStr}
                disabled={!selectable}
                onClick={() => handleDateSelect(date)}
                title={status === "holiday" && label ? label : undefined}
                style={{
                  width: "52px", flexShrink: 0, minHeight: "44px",
                  paddingTop: "9px", paddingBottom: "9px",
                  borderRadius: "10px",
                  border: `1px solid ${isSelected ? "var(--makas-ink)" : "var(--makas-border)"}`,
                  background: isSelected ? "var(--makas-ink)" : "var(--makas-surface)",
                  color: isSelected ? "var(--makas-bg)" : selectable ? "var(--makas-ink)" : "var(--makas-ink-muted)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "1px",
                  cursor: selectable ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  opacity: selectable ? 1 : 0.55,
                }}
              >
                <span style={{ fontSize: "9px", letterSpacing: "0.04em", textTransform: "uppercase", color: isSelected ? "rgba(255,255,255,0.65)" : "var(--makas-ink-muted)" }}>
                  {dayName}
                </span>
                <span style={{ fontSize: "18px", fontWeight: isToday ? 700 : 400, lineHeight: 1.15 }}>
                  {format(date, "d")}
                </span>
                {badge && !isSelected ? (
                  <span style={{ fontSize: "8px", fontWeight: 600, letterSpacing: "0.03em", color: badge.color, textTransform: "uppercase" }}>
                    {badge.text}
                  </span>
                ) : isToday && !isSelected && (
                  <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--makas-ink)" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Slot section */}
        {localDate ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="text-muted-foreground" style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
                {format(localDate, "EEEE, d MMMM", { locale })}
              </div>
              {!loadingSlots && availableSlots.length > 0 && (
                <span className="text-secondary-foreground bg-secondary border-border" style={{ fontSize: "11px", borderWidth: "1px", borderStyle: "solid", padding: "2px 8px", borderRadius: "6px" }}>
                  {availableSlots.length} {s3.available ?? (lang === "tr" ? "uygun" : "available")}
                </span>
              )}
            </div>
            {slotGrid(4)}
          </div>
        ) : (
          <div className="bg-card border-border text-muted-foreground" style={{ padding: "28px 16px", textAlign: "center", fontSize: "13px", borderRadius: "10px", borderWidth: "1px", borderStyle: "dashed" }}>
            {lang === "tr" ? "↑ Tarih seçerek devam edin" : "↑ Select a date to see available times"}
          </div>
        )}
      </div>

      {/* ── DESKTOP: calendar + time slots side by side ── */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        {/* Calendar */}
        <div className="bg-card border-border" style={{ borderWidth: "1px", borderStyle: "solid", borderRadius: "12px", padding: "20px" }}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="bg-secondary border-border text-secondary-foreground"
              style={{ width: "44px", height: "44px", borderWidth: "1px", borderStyle: "solid", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--makas-ink)"; e.currentTarget.style.color = "var(--makas-ink)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--makas-border)"; e.currentTarget.style.color = "var(--makas-ink-secondary)"; }}
            >
              <ChevronLeft size={13} />
            </button>
            <span className="font-display font-light text-foreground" style={{ fontSize: "15px", letterSpacing: "-0.01em" }}>
              {format(currentMonth, "MMMM yyyy", { locale })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="bg-secondary border-border text-secondary-foreground"
              style={{ width: "44px", height: "44px", borderWidth: "1px", borderStyle: "solid", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--makas-ink)"; e.currentTarget.style.color = "var(--makas-ink)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--makas-border)"; e.currentTarget.style.color = "var(--makas-ink-secondary)"; }}
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center py-1.5 text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.04em" }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {paddedDays.map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} style={{ minHeight: "44px" }} />;
              const { status, label } = dayState(day);
              const selectable = status === "working" || status === "fullyBooked";
              const isSelected = localDate && format(day, "yyyy-MM-dd") === format(localDate, "yyyy-MM-dd");
              const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
              const badge = badgeFor(status);
              return (
                <button
                  key={day.toISOString()}
                  disabled={!selectable}
                  onClick={() => handleDateSelect(day)}
                  title={status === "holiday" && label ? label : undefined}
                  className="flex flex-col items-center justify-center relative transition-all duration-150"
                  style={{
                    fontSize: "12px", borderRadius: "7px", minHeight: "44px",
                    background: isSelected ? "var(--makas-ink)" : "transparent",
                    color: isSelected ? "var(--makas-bg)" : selectable ? "var(--makas-ink)" : "var(--makas-ink-muted)",
                    cursor: selectable ? "pointer" : "not-allowed",
                    fontWeight: isToday ? 700 : 400,
                    opacity: selectable ? 1 : 0.6,
                    padding: "2px",
                  }}
                  onMouseEnter={(e) => { if (selectable && !isSelected) e.currentTarget.style.background = "var(--makas-surface2)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <span>{format(day, "d")}</span>
                  {badge && !isSelected ? (
                    <span style={{ fontSize: "7px", fontWeight: 600, letterSpacing: "0.03em", color: badge.color, textTransform: "uppercase", marginTop: "1px" }}>
                      {badge.text}
                    </span>
                  ) : isToday && !isSelected && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2" style={{ width: "3px", height: "3px", background: "var(--makas-ink)", borderRadius: "50%" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div className="bg-card border-border" style={{ borderWidth: "1px", borderStyle: "solid", borderRadius: "12px", padding: "20px" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>
              {localDate ? format(localDate, "EEEE, d MMMM", { locale }) : (lang === "tr" ? "Tarih seçin" : "Select a date")}
            </h3>
            {localDate && !loadingSlots && availableSlots.length > 0 && (
              <span className="text-secondary-foreground bg-secondary border-border" style={{ fontSize: "11px", borderRadius: "6px", borderWidth: "1px", borderStyle: "solid", padding: "2px 8px" }}>
                {availableSlots.length} {s3.available ?? (lang === "tr" ? "uygun" : "available")}
              </span>
            )}
          </div>

          {!localDate ? (
            <div className="flex flex-col items-center justify-center" style={{ height: "220px", gap: "10px" }}>
              <div style={{ fontSize: "28px", opacity: 0.15 }}>◷</div>
              <p className="text-muted-foreground" style={{ fontSize: "13px" }}>{s3.selectDate}</p>
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

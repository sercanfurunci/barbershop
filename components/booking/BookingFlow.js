"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import ServiceSelect from "./ServiceSelect";
import BarberSelect from "./BarberSelect";
import DateTimeSelect from "./DateTimeSelect";
import Confirmation from "./Confirmation";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { apiFetch } from "@/lib/api";
import { format } from "date-fns";
import { tr as dateFnsTr, enUS } from "date-fns/locale";

const C = {
  bg:       "#070707",
  card:     "#0f0f14",
  cardHi:   "#111118",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.12)",
  surface:  "#16161e",
  primary:  "#F0EDE8",
  secondary:"#6b6870",
  muted:    "#2e2d35",
  red:      "#CC1A1A",
};

// ── Stepper ────────────────────────────────────────────────────────────────────
function Stepper({ step, steps, onGoTo }) {
  return (
    <>
      {/* Desktop stepper */}
      <div className="hidden md:flex items-stretch max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {steps.map((s, i) => {
          const idx    = i + 1;
          const done   = idx < step;
          const active = idx === step;
          const future = idx > step;
          return (
            <div key={i} className="flex items-stretch flex-1 min-w-0">
              <button
                onClick={() => done && onGoTo(idx)}
                disabled={future}
                className="flex-1 flex items-center gap-2.5 py-4 px-3 relative transition-all duration-150 min-w-0"
                style={{
                  color: active ? C.primary : done ? C.secondary : C.muted,
                  cursor: done ? "pointer" : future ? "default" : "default",
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0 transition-all duration-200"
                  style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: done ? C.red : "transparent",
                    border: done ? "none" : active ? `1.5px solid ${C.red}` : `1.5px solid ${C.muted}`,
                    fontSize: "11px", fontWeight: 600,
                    color: done ? "#fff" : active ? C.red : C.muted,
                  }}
                >
                  {done ? <Check size={11} /> : idx}
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: "12px", fontWeight: active ? 600 : 400, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: "10px", color: C.muted, whiteSpace: "nowrap" }}>
                    {s.desc}
                  </div>
                </div>
                {active && (
                  <motion.div
                    layoutId="step-indicator"
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: "2px", background: C.red, borderRadius: "1px" }}
                  />
                )}
              </button>
              {i < steps.length - 1 && (
                <div className="flex items-center shrink-0 px-1">
                  <ChevronRight size={12} style={{ color: C.muted }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile stepper — compact pill */}
      <div className="flex md:hidden items-center gap-3 px-4 py-3.5">
        {/* Step dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          {steps.map((_, i) => {
            const idx = i + 1;
            const done = idx < step;
            const active = idx === step;
            return (
              <div
                key={i}
                style={{
                  width: active ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: done ? C.red : active ? C.red : C.muted,
                  transition: "all 0.25s ease",
                  opacity: done ? 0.6 : 1,
                }}
              />
            );
          })}
        </div>
        {/* Active step label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "12px", color: C.primary, fontWeight: 600 }}>
            {steps[step - 1]?.label}
          </span>
          <span style={{ fontSize: "11px", color: C.muted, marginLeft: "6px" }}>
            {step}/{steps.length}
          </span>
        </div>
        {/* Progress fraction */}
        <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.05em", shrink: 0 }}>
          {Math.round(((step - 1) / steps.length) * 100)}%
        </div>
      </div>
    </>
  );
}

// ── BookingFlow ────────────────────────────────────────────────────────────────
export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState({ service: null, barber: null, date: null, time: null });
  const { lang } = useLang();
  const tx = useT(lang);

  const [services, setServices] = useState([]);
  const [barbers, setBarbers]   = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/services"),
      apiFetch("/api/barbers"),
    ]).then(([svcData, brbrData]) => {
      setServices(svcData.map((s) => ({
        ...s,
        name:        { tr: s.nameTr, en: s.nameEn },
        description: { tr: s.descTr, en: s.descEn },
        category:    s.category.toLowerCase(),
      })));
      setBarbers(brbrData.map((b) => ({
        ...b,
        name:    b.nameTr,
        title:   { tr: b.titleTr, en: b.titleEn },
        bio:     { tr: b.bioTr,   en: b.bioEn   },
        reviews: b.reviewCount,
      })));
      setDataLoaded(true);
    }).catch(() => setDataLoaded(true));
  }, []);

  // ── Step navigation with dependency resets ──────────────────────────────────
  const goToStep = (idx) => setStep(idx);
  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onServiceSelect = (s) => {
    // Reset all downstream selections
    setBooking({ service: s, barber: null, date: null, time: null });
    nextStep();
  };

  const onBarberSelect = (b) => {
    // Reset date + time
    setBooking((prev) => ({ ...prev, barber: b, date: null, time: null }));
    nextStep();
  };

  const onDateTimeSelect = (date, time, resolvedBarber) => {
    setBooking((prev) => ({
      ...prev,
      date,
      time,
      ...(resolvedBarber ? { barber: resolvedBarber } : {}),
    }));
  };

  const onDateChange = () => {
    // When user changes date in DateTimeSelect, reset time
    setBooking((prev) => ({ ...prev, time: null }));
  };

  const steps = tx.booking.steps;
  const locale = lang === "tr" ? dateFnsTr : enUS;

  const chips = [
    booking.service && { icon: "✂", label: booking.service.name[lang] },
    booking.barber  && { icon: "●", label: booking.barber.id === "any" ? (lang === "tr" ? "Tercih Yok" : "No Pref.") : (booking.barber.name || booking.barber.nameTr) },
    booking.date    && { icon: "◷", label: format(booking.date, "d MMM", { locale }) + (booking.time ? ` · ${booking.time}` : "") },
  ].filter(Boolean);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>

      {/* ── Stepper bar ── */}
      <div
        className="sticky top-[68px] z-30"
        style={{
          background: `${C.bg}f8`,
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(204,26,26,0.15), transparent)" }} />
        <Stepper step={step} steps={steps} onGoTo={goToStep} />

        {/* Compact chips row — only when there are selections */}
        <AnimatePresence>
          {chips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
              style={{ overflow: "hidden" }}
            >
              <div className="flex flex-wrap items-center gap-2 py-2.5">
                {chips.map((chip, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: "20px",
                      fontSize: "11px",
                      color: C.secondary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: C.red, fontSize: "10px" }}>{chip.icon}</span>
                    {chip.label}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Page content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: "clamp(28px, 4vh, 52px)", paddingBottom: "clamp(40px, 6vh, 80px)" }}>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 && (
              <ServiceSelect
                services={services}
                loaded={dataLoaded}
                selected={booking.service}
                onSelect={onServiceSelect}
                lang={lang} tx={tx}
              />
            )}
            {step === 2 && (
              <BarberSelect
                barbers={barbers}
                loaded={dataLoaded}
                selected={booking.barber}
                onSelect={onBarberSelect}
                onBack={prevStep}
                lang={lang} tx={tx}
              />
            )}
            {step === 3 && (
              <DateTimeSelect
                booking={booking}
                allBarbers={barbers}
                selectedDate={booking.date}
                selectedTime={booking.time}
                onSelect={onDateTimeSelect}
                onNext={nextStep}
                onBack={prevStep}
                lang={lang} tx={tx}
              />
            )}
            {step === 4 && (
              <Confirmation
                booking={booking}
                onBack={prevStep}
                lang={lang} tx={tx}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

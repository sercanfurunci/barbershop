"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import ServiceSelect from "./ServiceSelect";
import BarberSelect from "./BarberSelect";
import DateTimeSelect from "./DateTimeSelect";
import Confirmation from "./Confirmation";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import Link from "next/link";

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

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState({ service: null, barber: null, date: null, time: null });
  const { lang } = useLang();
  const tx = useT(lang);

  const updateBooking = (key, value) => setBooking((prev) => ({ ...prev, [key]: value }));
  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const steps = tx.booking.steps;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>

      {/* Step header */}
      <div
        className="sticky top-[68px] z-30"
        style={{ background: `${C.bg}f5`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-stretch">
            {steps.map((s, i) => {
              const idx    = i + 1;
              const done   = idx < step;
              const active = idx === step;
              const future = idx > step;
              return (
                <div key={i} className="flex items-stretch flex-1 min-w-0">
                  <button
                    onClick={() => done && setStep(idx)}
                    disabled={future}
                    className="flex-1 flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 py-3.5 px-2 sm:px-3 relative transition-all duration-150 min-w-0"
                    style={{
                      color: active ? C.primary : done ? C.secondary : C.muted,
                      cursor: done ? "pointer" : future ? "not-allowed" : "default",
                      minHeight: "52px",
                    }}
                  >
                    {/* Step circle */}
                    <div
                      className="flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{
                        width: "24px", height: "24px",
                        borderRadius: "50%",
                        background: done ? C.red : active ? "transparent" : "transparent",
                        border: done ? "none" : active ? `1.5px solid ${C.red}` : `1.5px solid ${C.muted}`,
                        fontSize: "11px",
                        fontWeight: 600,
                        color: done ? "#fff" : active ? C.red : C.muted,
                      }}
                    >
                      {done ? <Check size={11} /> : idx}
                    </div>
                    {/* Label — visible from sm up; on mobile show only on active step */}
                    <div className={`min-w-0 ${active ? "block" : "hidden sm:block"}`}>
                      <div style={{ fontSize: "12px", fontWeight: active ? 600 : 400, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                        {s.label}
                      </div>
                      <div className="hidden sm:block" style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                        {s.desc}
                      </div>
                    </div>
                    {/* Active bottom line */}
                    {active && (
                      <motion.div
                        layoutId="step-indicator"
                        className="absolute bottom-0 left-0 right-0"
                        style={{ height: "2px", background: C.red, borderRadius: "1px" }}
                      />
                    )}
                  </button>
                  {i < steps.length - 1 && (
                    <div className="flex items-center shrink-0">
                      <div style={{ width: "8px", height: "1px", background: C.muted }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-14">

        {/* Breadcrumb progress summary */}
        {booking.service && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 flex-wrap mb-8"
          >
            {booking.service && (
              <span className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px", color: C.secondary }}>
                <span style={{ color: C.red }}>✂</span>
                {booking.service.name[lang]}
              </span>
            )}
            {booking.barber && (
              <span className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px", color: C.secondary }}>
                <span style={{ color: C.red }}>●</span>
                {booking.barber.name || (lang === "tr" ? "Tercih Yok" : "No Preference")}
              </span>
            )}
            {booking.date && booking.time && (
              <span className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px", color: C.secondary }}>
                <span style={{ color: C.red }}>◷</span>
                {booking.time}
              </span>
            )}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 && (
              <ServiceSelect
                selected={booking.service}
                onSelect={(s) => { updateBooking("service", s); nextStep(); }}
                lang={lang} tx={tx}
              />
            )}
            {step === 2 && (
              <BarberSelect
                selected={booking.barber}
                onSelect={(b) => { updateBooking("barber", b); nextStep(); }}
                onBack={prevStep}
                lang={lang} tx={tx}
              />
            )}
            {step === 3 && (
              <DateTimeSelect
                booking={booking}
                selectedDate={booking.date}
                selectedTime={booking.time}
                onSelect={(date, time) => { updateBooking("date", date); updateBooking("time", time); }}
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

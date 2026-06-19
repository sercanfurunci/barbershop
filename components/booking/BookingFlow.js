"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import ServiceSelect from "./ServiceSelect";
import BarberSelect from "./BarberSelect";
import DateSelect from "./DateSelect";
import TimeSelect from "./TimeSelect";
import DateTimeSelect from "./DateTimeSelect";
import Confirmation from "./Confirmation";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { apiFetch } from "@/lib/api";
import { format } from "date-fns";
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

// Mobile: 5 steps (service / barber / date / time / confirm)
const STEP_TITLES = {
  tr: ["Hizmet Seç", "Berber Seç", "Tarih Seç", "Saat Seç", "Bilgilerini Gir"],
  en: ["Select Service", "Select Barber", "Select Date", "Select Time", "Your Details"],
};

// Full-screen push slide variants
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit:  (dir) => ({ x: dir > 0 ? "-22%" : "22%", opacity: 0 }),
};
const slideTransition = { duration: 0.34, ease: [0.32, 0.72, 0, 1] };

// ── Confirm-change bottom sheet ───────────────────────────────────────────────
function ConfirmChangeDialog({ message, onConfirm, onCancel, lang }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{ padding: "16px", paddingBottom: "max(16px, env(safe-area-inset-bottom))", background: "rgba(17,17,17,0.5)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 48, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.card, borderRadius: "16px", padding: "20px", width: "100%", maxWidth: "420px", border: `1px solid ${C.border}` }}
      >
        <p style={{ fontSize: "14px", color: C.primary, lineHeight: 1.55, marginBottom: "16px" }}>{message}</p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onCancel} style={{ flex: 1, height: "46px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.surface, color: C.secondary, fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
            {lang === "tr" ? "İptal" : "Cancel"}
          </button>
          <button onClick={onConfirm} style={{ flex: 1, height: "46px", borderRadius: "10px", border: "none", background: C.red, color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            {lang === "tr" ? "Devam Et" : "Continue"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Desktop stepper ───────────────────────────────────────────────────────────
function DesktopStepper({ activeStep, steps, onGoTo }) {
  return (
    <div className="hidden md:flex items-stretch max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {steps.map((s, i) => {
        const idx    = i + 1;
        const done   = idx < activeStep;
        const active = idx === activeStep;
        const future = idx > activeStep;
        return (
          <div key={i} className="flex items-stretch flex-1 min-w-0">
            <button
              onClick={() => done && onGoTo(idx)}
              disabled={future}
              className="flex-1 flex items-center gap-2.5 py-4 px-3 relative transition-all duration-150 min-w-0"
              style={{ color: active ? C.primary : done ? C.secondary : C.muted, cursor: done ? "pointer" : "default" }}
            >
              <div style={{
                width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                background: done ? C.red : "transparent",
                border: done ? "none" : active ? `1.5px solid ${C.red}` : `1.5px solid ${C.muted}`,
                fontSize: "11px", fontWeight: 600,
                color: done ? "#fff" : active ? C.red : C.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {done ? <Check size={11} /> : idx}
              </div>
              <div className="min-w-0">
                <div style={{ fontSize: "12px", fontWeight: active ? 600 : 400, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{s.label}</div>
                <div style={{ fontSize: "10px", color: C.muted, whiteSpace: "nowrap" }}>{s.desc}</div>
              </div>
              {active && (
                <motion.div layoutId="desk-step-indicator" className="absolute bottom-0 left-0 right-0" style={{ height: "2px", background: C.red, borderRadius: "1px" }} />
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
  );
}

// ── Main flow ─────────────────────────────────────────────────────────────────
function normalizeServices(raw) {
  return raw.map((s) => ({
    ...s,
    name:        { tr: s.nameTr, en: s.nameEn },
    description: { tr: s.descTr, en: s.descEn },
    category:    s.category?.toLowerCase() ?? "cuts",
  }));
}

function normalizeBarbers(raw) {
  return raw.map((b) => ({
    ...b,
    name:    b.nameTr,
    title:   { tr: b.titleTr, en: b.titleEn },
    bio:     { tr: b.bioTr,   en: b.bioEn   },
    reviews: b.reviewCount,
  }));
}

function resolvePreselect(preselect, normServices, normBarbers) {
  if (!preselect) return { service: null, barber: null, date: null };
  const service = preselect.serviceId
    ? normServices.find(s => s.id === preselect.serviceId) || null
    : null;
  const barber = preselect.barberId === "any"
    ? { id: "any" }
    : preselect.barberId
      ? normBarbers.find(b => b.id === preselect.barberId) || null
      : null;
  const date = preselect.dateOffset != null ? (() => {
    const d = new Date();
    d.setDate(d.getDate() + preselect.dateOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  })() : null;
  return { service, barber, date };
}

function initialStep(preselect, hasInitial) {
  if (!preselect || !hasInitial) return 1;
  const hasService = !!preselect.serviceId;
  const hasBarber  = !!preselect.barberId;
  const hasDate    = preselect.dateOffset != null;
  if (hasService && hasBarber && hasDate) return 4;
  if (hasService && hasBarber) return 3;
  if (hasService) return 2;
  return 1;
}

export default function BookingFlow({ initialServices = [], initialBarbers = [], preselect = null }) {
  const hasInitial = initialServices.length > 0;
  const normServicesInit = hasInitial ? normalizeServices(initialServices) : [];
  const normBarbersInit  = initialBarbers.length > 0 ? normalizeBarbers(initialBarbers) : [];

  // step 1-5 on mobile; desktop maps 3+4 → DateTimeSelect, 5 → Confirmation
  const [step, setStep]           = useState(() => initialStep(preselect, hasInitial));
  const [direction, setDirection] = useState(1);
  const [booking, setBooking]     = useState(() => {
    const pre = resolvePreselect(preselect, normServicesInit, normBarbersInit);
    return { service: pre.service, barber: pre.barber, date: pre.date, time: null };
  });
  const [confirming, setConfirming] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);
  const { lang } = useLang();
  const tx = useT(lang);

  const [services, setServices]   = useState(() => hasInitial ? normalizeServices(initialServices) : []);
  const [barbers, setBarbers]     = useState(() => initialBarbers.length > 0 ? normalizeBarbers(initialBarbers) : []);
  const [dataLoaded, setDataLoaded] = useState(hasInitial);

  useEffect(() => {
    if (hasInitial) return; // already have server-side data
    Promise.all([apiFetch("/api/services"), apiFetch("/api/barbers")])
      .then(([svcData, brbrData]) => {
        setServices(normalizeServices(svcData));
        setBarbers(normalizeBarbers(brbrData));
        setDataLoaded(true);
      })
      .catch(() => setDataLoaded(true));
  }, []);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goToStep = (idx) => { setDirection(idx > step ? 1 : -1); setStep(idx); };
  const nextStep = () => { setDirection(1); setStep((s) => Math.min(s + 1, 5)); };
  const prevStep = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 1)); };

  // Desktop maps steps differently: steps 3+4 → DateTimeSelect, 5 → Confirmation
  const desktopGoToStep = (deskIdx) => {
    const target = deskIdx === 4 ? 5 : deskIdx;
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };
  const desktopNextStep = () => {
    setDirection(1);
    setStep((s) => {
      if (s <= 2) return s + 1;
      if (s <= 4) return 5;
      return s;
    });
  };

  // Desktop active step (maps mobile 5-step to desktop 4-step for highlighting)
  const desktopStep = step <= 2 ? step : step <= 4 ? 3 : 4;

  // ── Selection handlers ──────────────────────────────────────────────────────
  const onServiceSelect = (s) => {
    if (booking.service?.id === s.id) { nextStep(); return; }
    // Only reset downstream if service is being CHANGED (not set for the first time)
    const hasDownstream = booking.service && (booking.barber || booking.date || booking.time);
    if (hasDownstream) {
      setPendingChange({
        message: lang === "tr"
          ? "Bu hizmet değişikliği berber ve tarih seçimlerinizi sıfırlayacak."
          : "Changing service will reset your barber and date selections.",
        action: () => { setBooking({ service: s, barber: null, date: null, time: null }); nextStep(); },
      });
    } else {
      // First-time selection: preserve preselected barber/date
      setBooking((prev) => ({ ...prev, service: s, time: null }));
      nextStep();
    }
  };

  const onBarberSelect = (b) => {
    if (booking.barber?.id === b.id) { nextStep(); return; }
    // Only reset downstream if barber is being CHANGED (not set for the first time)
    const hasDownstream = booking.barber && (booking.date || booking.time);
    if (hasDownstream) {
      setPendingChange({
        message: lang === "tr"
          ? "Bu berber değişikliği tarih ve saat seçimlerinizi sıfırlayacak."
          : "Changing barber will reset your date and time selections.",
        action: () => { setBooking((prev) => ({ ...prev, barber: b, date: null, time: null })); nextStep(); },
      });
    } else {
      // First-time selection: preserve preselected date
      setBooking((prev) => ({ ...prev, barber: b, time: null }));
      nextStep();
    }
  };

  // Mobile: step 3 = date only → auto-advance to time
  const onDateSelect = (date) => {
    setBooking((prev) => ({ ...prev, date, time: null }));
    nextStep();
  };

  // Mobile: step 4 = time → auto-advance to confirmation
  const onTimeSelect = (time, resolvedBarber) => {
    setBooking((prev) => ({
      ...prev, time,
      ...(resolvedBarber ? { barber: resolvedBarber } : {}),
    }));
    nextStep();
  };

  // Desktop: date+time combined
  const onDateTimeSelect = (date, time, resolvedBarber) => {
    setBooking((prev) => ({
      ...prev, date, time,
      ...(resolvedBarber ? { barber: resolvedBarber } : {}),
    }));
    if (date && time) desktopNextStep();
  };

  const steps        = tx.booking.steps;
  const locale       = lang === "tr" ? dateFnsTr : enUS;
  const stepTitle    = (STEP_TITLES[lang] ?? STEP_TITLES.tr)[step - 1] ?? "";
  const serviceName  = booking.service
    ? (typeof booking.service.name === "object" ? booking.service.name[lang] : booking.service.name)
    : null;

  // Can the mobile "Next" button in bottom bar advance the user?
  const canAdvance = (() => {
    if (step === 1) return !!booking.service;
    if (step === 2) return !!booking.barber;
    if (step === 3) return !!booking.date;
    if (step === 4) return !!booking.time;
    return false;
  })();

  // Summary chips for desktop
  const chips = [
    booking.service && { icon: "✂", label: serviceName, targetStep: 1 },
    booking.barber  && { icon: "●", label: booking.barber.id === "any" ? (lang === "tr" ? "Tercih Yok" : "No Pref.") : (booking.barber.name || booking.barber.nameTr), targetStep: 2 },
    (booking.date || booking.time) && {
      icon: "◷",
      label: (booking.date ? format(booking.date, "d MMM", { locale }) : "") + (booking.time ? ` · ${booking.time}` : ""),
      targetStep: 3,
    },
  ].filter(Boolean);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE: Fixed full-screen step flow
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="md:hidden flex flex-col overflow-hidden"
        style={{
          position: "fixed",
          top: "68px", left: 0, right: 0, bottom: 0,
          zIndex: 10,
          background: C.bg,
        }}
      >
        {/* ── Top navigation bar ── */}
        {!bookingDone && (
          <div style={{
            flexShrink: 0,
            display: "flex", alignItems: "center",
            padding: "0 16px",
            height: "52px",
            borderBottom: `1px solid ${C.border}`,
            background: C.bg,
          }}>
            <div style={{ width: "60px" }}>
              {step > 1 && (
                <button
                  onClick={prevStep}
                  style={{ display: "flex", alignItems: "center", gap: "3px", color: C.secondary, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "14px" }}
                >
                  <ChevronLeft size={16} />
                  {lang === "tr" ? "Geri" : "Back"}
                </button>
              )}
            </div>
            <div style={{ flex: 1, textAlign: "center", fontSize: "14px", fontWeight: 600, color: C.primary, letterSpacing: "-0.01em" }}>
              {stepTitle}
            </div>
            <div style={{ width: "60px", textAlign: "right", fontSize: "12px", color: C.muted }}>
              {step}/5
            </div>
          </div>
        )}

        {/* ── Progress bar ── */}
        {!bookingDone && (
          <div style={{ height: "2px", background: C.border, flexShrink: 0 }}>
            <motion.div
              style={{ height: "100%", background: C.red }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
        )}

        {/* ── Sliding content area ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              style={{ position: "absolute", inset: 0, overflowY: "auto" }}
              className="no-scrollbar"
            >
              {step === 1 && (
                <ServiceSelect
                  services={services}
                  loaded={dataLoaded}
                  selected={booking.service}
                  onSelect={onServiceSelect}
                  lang={lang}
                  tx={tx}
                  compact
                />
              )}
              {step === 2 && (
                <BarberSelect
                  barbers={barbers}
                  loaded={dataLoaded}
                  selected={booking.barber}
                  onSelect={onBarberSelect}
                  lang={lang}
                  tx={tx}
                  compact
                />
              )}
              {step === 3 && (
                <DateSelect
                  selectedDate={booking.date}
                  onSelect={onDateSelect}
                  lang={lang}
                />
              )}
              {step === 4 && (
                <TimeSelect
                  booking={booking}
                  allBarbers={barbers}
                  onSelect={onTimeSelect}
                  lang={lang}
                />
              )}
              {step === 5 && (
                <div style={{ padding: "0 16px 24px" }}>
                  <Confirmation
                    booking={booking}
                    onBack={prevStep}
                    onLoadingChange={setConfirming}
                    onSuccess={() => setBookingDone(true)}
                    lang={lang}
                    tx={tx}
                    compact
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom action bar ── */}
        {!bookingDone && (
          <div style={{
            flexShrink: 0,
            background: "rgba(246,243,238,0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: `1px solid ${C.border}`,
            padding: "10px 16px",
            paddingBottom: "max(10px, env(safe-area-inset-bottom))",
          }}>
            {step < 5 ? (
              /* Steps 1-4: summary + optional "Next" */
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {serviceName ? (
                    <>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {serviceName}
                      </div>
                      <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px" }}>
                        ₺{booking.service.price?.toLocaleString()} · {booking.service.duration} {lang === "tr" ? "dk" : "min"}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "13px", color: C.muted }}>
                      {lang === "tr" ? "Hizmet seçiniz" : "Select a service"}
                    </div>
                  )}
                </div>

                {/* "Next" button — only when there's already a selection on the current step */}
                {canAdvance && (
                  <button
                    onClick={nextStep}
                    style={{
                      flexShrink: 0,
                      height: "44px", padding: "0 18px",
                      borderRadius: "10px",
                      background: C.red, color: "#fff",
                      fontSize: "13px", fontWeight: 600,
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "3px",
                    }}
                  >
                    {lang === "tr" ? "Devam" : "Next"}
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            ) : (
              /* Step 5: Submit */
              <button
                type="submit"
                form="booking-confirm-form"
                disabled={confirming}
                style={{
                  width: "100%", height: "52px",
                  borderRadius: "12px",
                  background: confirming ? C.surface : C.red,
                  color: confirming ? C.muted : "#fff",
                  fontSize: "15px", fontWeight: 600,
                  border: "none",
                  cursor: confirming ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                {confirming ? (
                  <>
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(0,0,0,0.12)", borderTopColor: C.muted }} />
                    {lang === "tr" ? "Gönderiliyor..." : "Booking..."}
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {tx?.booking?.step4?.confirmBtn ?? (lang === "tr" ? "Randevuyu Onayla" : "Confirm Booking")}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP: Stepper + scrolling layout
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block" style={{ paddingTop: "68px" }}>
        {/* Sticky stepper bar */}
        <div
          className="sticky top-[68px] z-30"
          style={{ background: "rgba(246,243,238,0.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}
        >
          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(198,40,40,0.12), transparent)" }} />
          <DesktopStepper activeStep={desktopStep} steps={steps} onGoTo={desktopGoToStep} />

          {/* Selection chips */}
          <AnimatePresence>
            {chips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div
                    className="no-scrollbar"
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 0", overflowX: "auto", flexWrap: "nowrap" }}
                  >
                    {chips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => goToStep(chip.targetStep)}
                        style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          padding: "4px 12px",
                          background: C.card, border: `1px solid ${C.border}`, borderRadius: "20px",
                          fontSize: "11px", color: C.secondary,
                          cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.secondary; }}
                      >
                        <span style={{ color: C.red, fontSize: "9px" }}>{chip.icon}</span>
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 1 && (
                <ServiceSelect services={services} loaded={dataLoaded} selected={booking.service} onSelect={onServiceSelect} lang={lang} tx={tx} />
              )}
              {step === 2 && (
                <BarberSelect barbers={barbers} loaded={dataLoaded} selected={booking.barber} onSelect={onBarberSelect} lang={lang} tx={tx} />
              )}
              {(step === 3 || step === 4) && (
                <DateTimeSelect booking={booking} allBarbers={barbers} selectedDate={booking.date} selectedTime={booking.time} onSelect={onDateTimeSelect} onNext={desktopNextStep} onBack={prevStep} lang={lang} tx={tx} />
              )}
              {step === 5 && (
                <Confirmation booking={booking} onBack={prevStep} onLoadingChange={setConfirming} onSuccess={() => setBookingDone(true)} lang={lang} tx={tx} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Change confirmation dialog ── */}
      <AnimatePresence>
        {pendingChange && (
          <ConfirmChangeDialog
            message={pendingChange.message}
            lang={lang}
            onConfirm={() => { pendingChange.action(); setPendingChange(null); }}
            onCancel={() => setPendingChange(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { services, barbers } from "@/lib/data";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { Check, Star, ChevronRight } from "lucide-react";

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

function BookingWidget({ lang, tx }) {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber]   = useState(null);
  const s = tx.hero;

  const serviceList = services.slice(0, 5);

  return (
    <div
      className="w-full max-w-md mx-auto lg:mx-0"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* Widget header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center" style={{ background: C.red, borderRadius: "4px" }}>
            <span className="font-bold text-white" style={{ fontSize: "9px" }}>M</span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: C.primary, letterSpacing: "0.02em" }}>
            {lang === "tr" ? "Randevu Planla" : "Book Appointment"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
          <span style={{ fontSize: "10px", color: "#22c55e", letterSpacing: "0.05em" }}>
            {lang === "tr" ? "Müsait" : "Available"}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Step 1: Service */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-4 h-4 flex items-center justify-center text-white"
              style={{ background: selectedService ? C.red : C.muted, borderRadius: "50%", fontSize: "9px", fontWeight: 700, flexShrink: 0 }}
            >
              {selectedService ? <Check size={9} /> : "1"}
            </div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: selectedService ? C.primary : C.secondary, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {lang === "tr" ? "Hizmet" : "Service"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {serviceList.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedService(svc.id === selectedService ? null : svc.id)}
                className="transition-all duration-150"
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 500,
                  border: `1px solid ${selectedService === svc.id ? C.red : C.border}`,
                  background: selectedService === svc.id ? `${C.red}18` : "transparent",
                  color: selectedService === svc.id ? C.red : C.secondary,
                  letterSpacing: "0.02em",
                }}
              >
                {svc.name[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: C.border }} />

        {/* Step 2: Barber */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-4 h-4 flex items-center justify-center text-white"
              style={{ background: selectedBarber ? C.red : C.muted, borderRadius: "50%", fontSize: "9px", fontWeight: 700, flexShrink: 0 }}
            >
              {selectedBarber ? <Check size={9} /> : "2"}
            </div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: selectedBarber ? C.primary : C.secondary, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {lang === "tr" ? "Berber" : "Barber"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {barbers.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBarber(b.id === selectedBarber ? null : b.id)}
                className="relative flex flex-col items-center gap-1 transition-all duration-150"
                title={b.name}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center font-bold text-white transition-all"
                  style={{
                    borderRadius: "10px",
                    background: selectedBarber === b.id ? C.red : C.surface,
                    fontSize: "10px",
                    border: `2px solid ${selectedBarber === b.id ? C.red : "transparent"}`,
                    letterSpacing: "0.03em",
                  }}
                >
                  {b.avatar}
                </div>
                <span style={{ fontSize: "8px", color: selectedBarber === b.id ? C.red : C.muted, letterSpacing: "0.04em" }}>
                  {b.name.split(" ")[0]}
                </span>
              </button>
            ))}
            <button
              onClick={() => setSelectedBarber(selectedBarber === "any" ? null : "any")}
              className="flex flex-col items-center gap-1 transition-all duration-150"
            >
              <div
                className="w-9 h-9 flex items-center justify-center transition-all"
                style={{
                  borderRadius: "10px",
                  background: selectedBarber === "any" ? C.red : C.surface,
                  border: `2px solid ${selectedBarber === "any" ? C.red : C.border}`,
                  fontSize: "14px",
                }}
              >
                ✦
              </div>
              <span style={{ fontSize: "8px", color: selectedBarber === "any" ? C.red : C.muted, letterSpacing: "0.04em" }}>
                {lang === "tr" ? "Herhangi" : "Any"}
              </span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: C.border }} />

        {/* Step 3: Date hint */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-4 h-4 flex items-center justify-center text-white"
              style={{ background: C.muted, borderRadius: "50%", fontSize: "9px", fontWeight: 700, flexShrink: 0 }}
            >
              3
            </div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: C.secondary, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {lang === "tr" ? "Tarih & Saat" : "Date & Time"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(lang === "tr"
              ? ["Bugün", "Yarın", "Çrts"]
              : ["Today", "Tomorrow", "Thu"]
            ).map((label, i) => (
              <button
                key={label}
                className="py-2 text-center transition-all"
                style={{
                  borderRadius: "6px",
                  background: i === 0 ? `${C.red}15` : C.surface,
                  border: `1px solid ${i === 0 ? `${C.red}40` : C.border}`,
                  fontSize: "11px",
                  color: i === 0 ? C.red : C.secondary,
                  fontWeight: i === 0 ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/book"
          className="flex items-center justify-center gap-2 w-full transition-all duration-200"
          style={{
            background: C.red,
            color: "#fff",
            padding: "13px 24px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e02020")}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.red)}
        >
          {lang === "tr" ? "Randevu Al" : "Book Now"}
          <ChevronRight size={14} />
        </Link>

        <p style={{ fontSize: "10px", color: C.muted, textAlign: "center", letterSpacing: "0.04em" }}>
          {lang === "tr" ? "Ücretsiz iptal · İşlem ücreti yok · Anında onay" : "Free cancellation · No booking fees · Instant confirmation"}
        </p>
      </div>
    </div>
  );
}

export default function Hero() {
  const { lang } = useLang();
  const tx = useT(lang);

  const TRUST = lang === "tr"
    ? [
        { value: "4.9", label: "Ortalama Puan", icon: "★" },
        { value: "3.200+", label: "Mutlu Müşteri", icon: null },
        { value: "12+", label: "Yıllık Deneyim", icon: null },
        { value: "4", label: "Usta Berber", icon: null },
      ]
    : [
        { value: "4.9", label: "Avg. Rating", icon: "★" },
        { value: "3,200+", label: "Happy Clients", icon: null },
        { value: "12+", label: "Years Experience", icon: null },
        { value: "4", label: "Master Barbers", icon: null },
      ];

  return (
    <section
      className="relative min-h-screen flex flex-col"
      style={{ background: C.bg }}
    >
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 0% 50%, rgba(204,26,26,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 80% at 100% 20%, rgba(180,120,60,0.04) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-24 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(100vh-72px)]">

            {/* LEFT — 6 columns */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center py-10 lg:py-20">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2.5 mb-8 w-fit"
              >
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={11} fill={C.red} style={{ color: C.red }} />
                  ))}
                </div>
                <span style={{ fontSize: "12px", color: C.secondary, letterSpacing: "0.04em" }}>
                  4.9 · 400+ {lang === "tr" ? "değerlendirme" : "reviews"}
                </span>
                <span style={{ width: "1px", height: "12px", background: C.border, display: "inline-block" }} />
                <span
                  style={{ fontSize: "11px", color: C.red, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}
                >
                  {lang === "tr" ? "İstanbul · Premium Berber" : "Istanbul · Premium Barber"}
                </span>
              </motion.div>

              {/* Headline */}
              <div className="mb-6 overflow-hidden">
                <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display font-light leading-none"
                  style={{ letterSpacing: "-0.025em" }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "clamp(48px, 6.5vw, 88px)",
                      color: C.primary,
                      lineHeight: 0.95,
                    }}
                  >
                    {lang === "tr" ? "Ustalar" : "Masters"}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "clamp(48px, 6.5vw, 88px)",
                      color: C.primary,
                      lineHeight: 0.95,
                      fontStyle: "italic",
                    }}
                  >
                    {lang === "tr" ? "sizi" : "await"}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "clamp(48px, 6.5vw, 88px)",
                      color: C.red,
                      lineHeight: 0.95,
                    }}
                  >
                    {lang === "tr" ? "bekliyor." : "you."}
                  </span>
                </motion.h1>
              </div>

              {/* Supporting copy */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{ fontSize: "15px", color: C.secondary, lineHeight: 1.7, maxWidth: "420px", marginBottom: "36px" }}
              >
                {lang === "tr"
                  ? "İstanbul'un en seçkin berberleri ile premium saç ve sakal bakımı. Online randevu alın, bekleme yok."
                  : "Premium haircuts and grooming with Istanbul's finest barbers. Book online, no waiting."}
              </motion.p>

              {/* Primary + Secondary CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex-col sm:flex-row gap-3 mb-10 hidden sm:flex"
              >
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    background: C.red,
                    color: "#fff",
                    padding: "14px 32px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#e02020")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = C.red)}
                >
                  {lang === "tr" ? "Randevu Al" : "Book Now"}
                  <ChevronRight size={15} />
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    background: "transparent",
                    color: C.secondary,
                    padding: "14px 24px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    border: `1px solid ${C.border}`,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.secondary; e.currentTarget.style.borderColor = C.border; }}
                >
                  {lang === "tr" ? "Hizmetleri Gör" : "View Services"}
                </a>
              </motion.div>
              {/* Mobile: just a secondary explore link (sticky bar handles Book Now) */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex sm:hidden mb-8"
              >
                <a
                  href="#services"
                  className="inline-flex items-center gap-2 transition-all duration-200"
                  style={{ color: C.secondary, fontSize: "14px", fontWeight: 500, letterSpacing: "0.02em" }}
                >
                  {lang === "tr" ? "Hizmetleri Gör" : "View Services"}
                  <ChevronRight size={14} />
                </a>
              </motion.div>

              {/* Trust metrics */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.65 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0"
                style={{ borderTop: `1px solid ${C.border}`, paddingTop: "24px" }}
              >
                {TRUST.map((item, i) => (
                  <div
                    key={item.label}
                    className="flex flex-col sm:[&:not(:last-child)]:pr-4 sm:[&:not(:last-child)]:border-r sm:[&:not(:first-child)]:pl-4"
                    style={{ borderColor: C.border }}
                  >
                    <span className="font-display font-light" style={{ fontSize: "22px", color: C.primary, lineHeight: 1, letterSpacing: "-0.02em" }}>
                      {item.icon && <span style={{ color: C.red, fontSize: "14px", marginRight: "2px" }}>{item.icon}</span>}
                      {item.value}
                    </span>
                    <span style={{ fontSize: "10px", color: C.muted, marginTop: "4px", letterSpacing: "0.04em", lineHeight: 1.3 }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* RIGHT — 6 columns: Booking widget */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 xl:col-span-7 flex items-center justify-center lg:justify-end py-10 lg:py-20"
            >
              <div className="w-full max-w-[440px] lg:max-w-none xl:max-w-[480px]">
                {/* Decorative context above card */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {barbers.map((b) => (
                        <div
                          key={b.id}
                          className="w-7 h-7 flex items-center justify-center font-bold text-white text-[9px] border-2"
                          style={{ borderRadius: "50%", background: C.red, borderColor: C.bg, letterSpacing: "0.03em" }}
                        >
                          {b.avatar}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: "12px", color: C.secondary }}>
                      {lang === "tr" ? "4 berber müsait" : "4 barbers available"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "20px" }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                    <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: 500, letterSpacing: "0.05em" }}>
                      {lang === "tr" ? "Şu an açık" : "Open now"}
                    </span>
                  </div>
                </div>

                <BookingWidget lang={lang} tx={tx} />

                {/* Next available slot hint */}
                <div className="flex items-center gap-2 mt-4 px-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.red }} />
                  <span style={{ fontSize: "11px", color: C.muted }}>
                    {lang === "tr"
                      ? "En yakın müsait slot: Bugün 14:00 — Mehmet Yılmaz"
                      : "Next available: Today at 14:00 — Mehmet Yılmaz"}
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}

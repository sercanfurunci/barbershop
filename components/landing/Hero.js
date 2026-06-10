"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { services, barbers } from "@/lib/data";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { Check, Star, ChevronRight, Clock } from "lucide-react";

const C = {
  bg:       "#070707",
  card:     "#0f0f14",
  cardHi:   "#141419",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.12)",
  surface:  "#16161e",
  primary:  "#F0EDE8",
  secondary:"#6b6870",
  muted:    "#2e2d35",
  red:      "#CC1A1A",
};

function StatusCard({ lang }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.borderHi}`,
      borderRadius: "12px",
      padding: "14px 16px",
      marginBottom: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      {/* Row 1: Open status + hours */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 600, letterSpacing: "0.03em" }}>
            {lang === "tr" ? "Şu an açık" : "Open now"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Clock size={11} style={{ color: C.muted }} />
          <span style={{ fontSize: "11px", color: C.secondary, fontFamily: "monospace", letterSpacing: "0.03em" }}>10:00 – 21:30</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: C.border }} />

      {/* Row 2: Barber avatars */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {barbers.map((b, i) => (
            <div key={b.id} style={{
              width: "26px", height: "26px", borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.red}, #9a1212)`,
              border: `2px solid ${C.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "8px", fontWeight: 700, color: "#fff",
              letterSpacing: "0.02em", flexShrink: 0,
              marginLeft: i > 0 ? "-8px" : "0",
            }}>
              {b.avatar}
            </div>
          ))}
        </div>
        <span style={{ fontSize: "12px", color: C.secondary }}>
          {lang === "tr" ? "4 berber müsait" : "4 barbers available"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.red, flexShrink: 0 }} />
          <span style={{ fontSize: "11px", color: C.muted }}>
            {lang === "tr" ? "Bugün 14:00" : "Today 14:00"}
          </span>
        </div>
      </div>
    </div>
  );
}

function BookingWidget({ lang, tx }) {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber]   = useState(null);
  const [dateLabels, setDateLabels] = useState(["Bugün", "Yarın", "---"]);

  useEffect(() => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    const dayTr = d.toLocaleDateString("tr-TR", { weekday: "short" });
    const dayEn = d.toLocaleDateString("en-US", { weekday: "short" });
    setDateLabels(lang === "tr" ? ["Bugün", "Yarın", dayTr] : ["Today", "Tomorrow", dayEn]);
  }, [lang]);

  const serviceList = services.slice(0, 5);

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.borderHi}`,
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
    }}>
      {/* Widget header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${C.border}`,
        background: "rgba(255,255,255,0.025)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", background: C.red, borderRadius: "5px" }}>
            <span style={{ fontWeight: 700, color: "#fff", fontSize: "10px" }}>A</span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: C.primary, letterSpacing: "0.02em" }}>
            {lang === "tr" ? "Randevu Planla" : "Book Appointment"}
          </span>
        </div>
        <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.05em" }}>
          {lang === "tr" ? "Ücretsiz · Anında Onay" : "Free · Instant Confirm"}
        </div>
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Step 1: Service */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", background: selectedService ? C.red : C.muted, borderRadius: "50%", fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {selectedService ? <Check size={9} /> : "1"}
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, color: selectedService ? C.primary : C.secondary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {lang === "tr" ? "Hizmet" : "Service"}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {serviceList.map((svc) => (
              <button key={svc.id}
                onClick={() => setSelectedService(svc.id === selectedService ? null : svc.id)}
                style={{
                  padding: "6px 13px", borderRadius: "6px", fontSize: "11px", fontWeight: 500,
                  border: `1px solid ${selectedService === svc.id ? C.red : C.border}`,
                  background: selectedService === svc.id ? `${C.red}18` : "transparent",
                  color: selectedService === svc.id ? C.red : C.secondary,
                  letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.15s",
                }}>
                {svc.name[lang]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: "1px", background: C.border }} />

        {/* Step 2: Barber */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", background: selectedBarber ? C.red : C.muted, borderRadius: "50%", fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {selectedBarber ? <Check size={9} /> : "2"}
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, color: selectedBarber ? C.primary : C.secondary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {lang === "tr" ? "Berber" : "Barber"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {barbers.map((b) => (
              <button key={b.id}
                onClick={() => setSelectedBarber(b.id === selectedBarber ? null : b.id)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", background: "none", border: "none" }}
                title={b.name}>
                <div style={{
                  width: "38px", height: "38px", borderRadius: "10px",
                  background: selectedBarber === b.id ? C.red : C.surface,
                  fontSize: "10px", fontWeight: 700, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${selectedBarber === b.id ? C.red : "transparent"}`,
                  letterSpacing: "0.03em", transition: "all 0.15s",
                }}>
                  {b.avatar}
                </div>
                <span style={{ fontSize: "9px", color: selectedBarber === b.id ? C.red : C.muted, letterSpacing: "0.03em" }}>
                  {b.name.split(" ")[0]}
                </span>
              </button>
            ))}
            <button
              onClick={() => setSelectedBarber(selectedBarber === "any" ? null : "any")}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", background: "none", border: "none" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: selectedBarber === "any" ? C.red : C.surface,
                border: `2px solid ${selectedBarber === "any" ? C.red : C.border}`,
                fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
              }}>✦</div>
              <span style={{ fontSize: "9px", color: selectedBarber === "any" ? C.red : C.muted, letterSpacing: "0.03em" }}>
                {lang === "tr" ? "Herhangi" : "Any"}
              </span>
            </button>
          </div>
        </div>

        <div style={{ height: "1px", background: C.border }} />

        {/* Step 3: Date */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", background: C.muted, borderRadius: "50%", fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>3</div>
            <span style={{ fontSize: "10px", fontWeight: 600, color: C.secondary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {lang === "tr" ? "Tarih & Saat" : "Date & Time"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {dateLabels.map((label, i) => (
              <button key={label} style={{
                padding: "10px 0", textAlign: "center", borderRadius: "7px", cursor: "pointer",
                background: i === 0 ? `${C.red}18` : C.surface,
                border: `1px solid ${i === 0 ? `${C.red}50` : C.border}`,
                fontSize: "11px", color: i === 0 ? C.red : C.secondary,
                fontWeight: i === 0 ? 600 : 400,
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link href="/book" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          background: C.red, color: "#fff", padding: "15px 24px", borderRadius: "9px",
          fontSize: "14px", fontWeight: 700, letterSpacing: "0.04em", textDecoration: "none",
          boxShadow: `0 8px 24px rgba(204,26,26,0.35)`, transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#e02020"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(204,26,26,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.boxShadow = "0 8px 24px rgba(204,26,26,0.35)"; }}
        >
          {lang === "tr" ? "Randevu Al" : "Book Now"}
          <ChevronRight size={15} />
        </Link>

        <p style={{ fontSize: "10px", color: C.muted, textAlign: "center", letterSpacing: "0.04em", marginTop: "-8px" }}>
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
        { value: "12+", label: "Years Exp.", icon: null },
        { value: "4", label: "Master Barbers", icon: null },
      ];

  return (
    <section className="relative min-h-screen flex flex-col" style={{ background: C.bg }}>

      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 60% at 0% 50%, rgba(204,26,26,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 80% at 100% 20%, rgba(180,120,60,0.04) 0%, transparent 60%)",
      }} />

      <div className="relative z-10 flex-1 flex items-start lg:items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 pt-10 pb-12 lg:pt-0 lg:pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"
            style={{ minHeight: "calc(100vh - 72px)", paddingTop: "clamp(0px, 4vh, 40px)", paddingBottom: "clamp(16px, 4vh, 40px)" }}>

            {/* ── LEFT ── */}
            <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "28px", width: "fit-content" }}
              >
                <div style={{ display: "flex", gap: "2px" }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={C.red} style={{ color: C.red }} />)}
                </div>
                <span style={{ fontSize: "11px", color: C.secondary, letterSpacing: "0.04em" }}>
                  4.9 · 400+ {lang === "tr" ? "değerlendirme" : "reviews"}
                </span>
                <span style={{ width: "1px", height: "12px", background: C.border, display: "inline-block" }} />
                <span style={{ fontSize: "10px", color: C.red, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                  {lang === "tr" ? "Darıca · Premium Berber" : "Darıca · Premium Barber"}
                </span>
              </motion.div>

              {/* Headline — padding-bottom gives descenders breathing room */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-display font-light"
                style={{ letterSpacing: "-0.025em", marginBottom: "20px", paddingBottom: "4px" }}
              >
                <span style={{ display: "block", fontSize: "clamp(52px, 6.5vw, 90px)", color: C.primary, lineHeight: 1.0 }}>
                  {lang === "tr" ? "Ustalar" : "Masters"}
                </span>
                <span style={{ display: "block", fontSize: "clamp(52px, 6.5vw, 90px)", color: C.primary, lineHeight: 1.0, fontStyle: "italic" }}>
                  {lang === "tr" ? "sizi" : "await"}
                </span>
                {/* Extra paddingBottom on last line ensures descenders on "y","j","g" aren't clipped */}
                <span style={{ display: "block", fontSize: "clamp(52px, 6.5vw, 90px)", color: C.red, lineHeight: 1.0, paddingBottom: "0.2em" }}>
                  {lang === "tr" ? "bekliyor." : "you."}
                </span>
              </motion.h1>

              {/* Sub-copy */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.38 }}
                style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.75, maxWidth: "400px", marginBottom: "32px" }}
              >
                {lang === "tr"
                  ? "Abdurrahman Çelik Exclusive Salon'da premium saç ve sakal bakımı. Online randevu alın, bekleme yok."
                  : "Premium haircuts and grooming at Abdurrahman Çelik Exclusive Salon. Book online, no waiting."}
              </motion.p>

              {/* Desktop CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.48 }}
                className="hidden sm:flex flex-col sm:flex-row gap-3 mb-10"
              >
                <Link href="/book" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: C.red, color: "#fff", padding: "13px 28px", borderRadius: "8px",
                  fontSize: "14px", fontWeight: 600, letterSpacing: "0.02em", whiteSpace: "nowrap", textDecoration: "none",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#e02020"}
                  onMouseLeave={e => e.currentTarget.style.background = C.red}
                >
                  {lang === "tr" ? "Randevu Al" : "Book Now"}
                  <ChevronRight size={14} />
                </Link>
                <a href="#services" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: "transparent", color: C.secondary, padding: "13px 22px", borderRadius: "8px",
                  fontSize: "14px", fontWeight: 500, letterSpacing: "0.02em",
                  border: `1px solid ${C.border}`, whiteSpace: "nowrap", textDecoration: "none", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.secondary; e.currentTarget.style.borderColor = C.border; }}
                >
                  {lang === "tr" ? "Hizmetleri Gör" : "View Services"}
                </a>
              </motion.div>

              {/* Mobile: explore link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.48 }}
                className="flex sm:hidden mb-6"
              >
                <a href="#services" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: C.secondary, fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
                  {lang === "tr" ? "Hizmetleri Gör" : "View Services"}
                  <ChevronRight size={13} />
                </a>
              </motion.div>

              {/* Trust bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="hidden sm:grid grid-cols-4 gap-0"
                style={{ borderTop: `1px solid ${C.border}`, paddingTop: "20px" }}
              >
                {TRUST.map((item, i) => (
                  <div key={item.label}
                    className="flex flex-col"
                    style={{
                      paddingRight: i < 3 ? "16px" : "0",
                      paddingLeft: i > 0 ? "16px" : "0",
                      borderRight: i < 3 ? `1px solid ${C.border}` : "none",
                    }}
                  >
                    <span className="font-display font-light" style={{ fontSize: "20px", color: C.primary, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                      {item.icon && <span style={{ color: C.red, fontSize: "13px", marginRight: "2px" }}>{item.icon}</span>}
                      {item.value}
                    </span>
                    <span style={{ fontSize: "9px", color: C.muted, marginTop: "3px", letterSpacing: "0.04em", lineHeight: 1.4 }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── RIGHT ── */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 xl:col-span-7 flex items-center justify-center lg:justify-end"
            >
              <div style={{ width: "100%", maxWidth: "520px" }}>
                <StatusCard lang={lang} />
                <BookingWidget lang={lang} tx={tx} />
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}

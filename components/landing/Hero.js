"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { Check, Star, ChevronRight, Clock } from "lucide-react";

const C = {
  bg:       "#F6F3EE",
  card:     "#FFFFFF",
  cardHi:   "#FAFAF8",
  border:   "#E5DFD6",
  borderHi: "#D4CECC",
  surface:  "#EFEAE2",
  primary:  "#111111",
  secondary:"#44403C",
  muted:    "#6B7280",
  dim:      "#D4CECC",
  red:      "#C62828",
};

function StatusCard({ lang, barbers }) {
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
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 6px rgba(22,163,74,0.3)", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600, letterSpacing: "0.03em" }}>
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
              background: `linear-gradient(135deg, ${C.red}, #7f1d1d)`,
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
          {lang === "tr" ? `${barbers.length} berber müsait` : `${barbers.length} barbers available`}
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

function BookingWidget({ lang, tx, services, barbers }) {
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
      boxShadow: "0 8px 40px rgba(17,17,17,0.08)",
    }}>
      {/* Widget header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
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
            <div style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", background: selectedService ? C.red : C.dim, borderRadius: "50%", fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
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
            <div style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", background: selectedBarber ? C.red : C.dim, borderRadius: "50%", fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
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
                  background: selectedBarber === b.id ? C.red : C.border,
                  fontSize: "10px", fontWeight: 700,
                  color: selectedBarber === b.id ? "#fff" : C.secondary,
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
                background: selectedBarber === "any" ? C.red : C.border,
                border: `2px solid ${selectedBarber === "any" ? C.red : "transparent"}`,
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
            <div style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", background: C.dim, borderRadius: "50%", fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>3</div>
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
          boxShadow: `0 8px 24px rgba(198,40,40,0.3)`, transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#B91C1C"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(198,40,40,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.boxShadow = "0 8px 24px rgba(198,40,40,0.3)"; }}
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

export default function Hero({ services = [], barbers = [] }) {
  const { lang } = useLang();
  const tx = useT(lang);

  const TRUST = lang === "tr"
    ? [
        { value: "4.9", label: "Ortalama Puan", icon: "★" },
        { value: "176", label: "Google Yorumu", icon: null },
        { value: "12+", label: "Yıllık Deneyim", icon: null },
        { value: String(barbers.length), label: "Usta Berber", icon: null },
      ]
    : [
        { value: "4.9", label: "Avg. Rating", icon: "★" },
        { value: "176", label: "Google Reviews", icon: null },
        { value: "12+", label: "Years Exp.", icon: null },
        { value: String(barbers.length), label: "Master Barbers", icon: null },
      ];

  return (
    <section className="relative min-h-screen flex flex-col" style={{ background: C.bg }}>

      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 70% at 100% 0%, #EDE8E0 0%, transparent 55%), radial-gradient(ellipse 40% 50% at 0% 100%, rgba(198,40,40,0.04) 0%, transparent 50%)",
      }} />

      <div className="relative z-10 flex-1 flex items-start lg:items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 pt-10 pb-12 lg:pt-0 lg:pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"
            style={{ minHeight: "calc(100vh - 72px)", paddingTop: "clamp(0px, 4vh, 40px)", paddingBottom: "clamp(16px, 4vh, 40px)" }}>

            {/* ── LEFT ── */}
            <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center">

              {/* Badge */}
              <div
                className="hero-badge"
                style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "28px", width: "fit-content" }}
              >
                <div style={{ display: "flex", gap: "2px" }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={C.red} style={{ color: C.red }} />)}
                </div>
                <span style={{ fontSize: "11px", color: C.secondary, letterSpacing: "0.04em" }}>
                  4.9 · 176 {lang === "tr" ? "değerlendirme" : "reviews"}
                </span>
                <span style={{ width: "1px", height: "12px", background: C.border, display: "inline-block" }} />
                <span style={{ fontSize: "10px", color: C.red, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                  {lang === "tr" ? "Darıca · Premium Berber" : "Darıca · Premium Barber"}
                </span>
              </div>

              {/* Headline — padding-bottom gives descenders breathing room */}
              <h1
                className="font-display font-light hero-heading"
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
              </h1>

              {/* Sub-copy */}
              <p
                className="hero-sub"
                style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.75, maxWidth: "400px", marginBottom: "32px" }}
              >
                {lang === "tr"
                  ? "Abdurrahman Çelik Exclusive Salon'da premium saç ve sakal bakımı. Online randevu alın, bekleme yok."
                  : "Premium haircuts and grooming at Abdurrahman Çelik Exclusive Salon. Book online, no waiting."}
              </p>

              {/* Desktop CTAs */}
              <div className="hero-ctas hidden sm:flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/book" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: C.red, color: "#fff", padding: "13px 28px", borderRadius: "8px",
                  fontSize: "14px", fontWeight: 600, letterSpacing: "0.02em", whiteSpace: "nowrap", textDecoration: "none",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#B91C1C"}
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
                  onMouseEnter={e => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.secondary; e.currentTarget.style.borderColor = C.border; }}
                >
                  {lang === "tr" ? "Hizmetleri Gör" : "View Services"}
                </a>
              </div>

              {/* Mobile: explore link */}
              <div className="hero-ctas flex sm:hidden mb-6">
                <a href="#services" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: C.secondary, fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
                  {lang === "tr" ? "Hizmetleri Gör" : "View Services"}
                  <ChevronRight size={13} />
                </a>
              </div>

              {/* Trust bar */}
              <div
                className="hero-trust hidden sm:grid grid-cols-4 gap-0"
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
              </div>
            </div>

            {/* ── RIGHT ── */}
            <div className="hero-right lg:col-span-7 xl:col-span-7 flex items-center justify-center lg:justify-end">
              <div style={{ width: "100%", maxWidth: "520px" }}>
                <StatusCard lang={lang} barbers={barbers} />
                <BookingWidget lang={lang} tx={tx} services={services} barbers={barbers} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

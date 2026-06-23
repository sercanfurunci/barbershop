"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useShop } from "@/contexts/ShopContext";
import { Star, ChevronRight, Clock, Check } from "lucide-react";

const C = {
  bg:       "#F7F4EE",
  bgSoft:   "#FDFBF7",
  surface:  "#EFEAE2",
  card:     "#FFFFFF",
  border:   "#E5DED3",
  borderHi: "#D4CECC",
  primary:  "#111111",
  secondary:"#4A4A4A",
  muted:    "#8A8480",
  dim:      "#C5BEB5",
};

function StatusCard({ lang, barbers }) {
  const displayBarbers = barbers;

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: "10px",
      padding: "12px 16px",
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: "#16a34a", boxShadow: "0 0 6px rgba(22,163,74,0.35)",
          flexShrink: 0,
        }} />
        <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 600 }}>
          {lang === "tr" ? "Şu an açık" : "Open now"}
        </span>
        <span style={{ width: "1px", height: "12px", background: C.border, flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Clock size={10} style={{ color: C.muted }} />
          <span style={{ fontSize: "11px", color: C.secondary, letterSpacing: "0.02em" }}>10:00 – 21:30</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ display: "flex" }}>
          {displayBarbers.slice(0, 4).map((b, i) => (
            <div key={b.id} style={{
              width: "22px", height: "22px", borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.primary}, #7f1d1d)`,
              border: `2px solid ${C.card}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "7px", fontWeight: 700, color: "#fff",
              marginLeft: i > 0 ? "-6px" : "0",
              flexShrink: 0,
            }}>
              {b.avatar}
            </div>
          ))}
        </div>
        <span style={{ fontSize: "11px", color: C.muted }}>
          {displayBarbers.slice(0, 4).length} {lang === "tr" ? "müsait" : "available"}
        </span>
      </div>
    </div>
  );
}

function BookingWidget({ lang, services, barbers }) {
  const shop = useShop();
  const bookBase = shop?.slug ? `/${shop.slug}/book` : "/book";
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber]   = useState(null);
  const [selectedDate, setSelectedDate]       = useState(null);
  const [dateLabels, setDateLabels] = useState(
    lang === "tr" ? ["Bugün", "Yarın", "---"] : ["Today", "Tomorrow", "---"]
  );

  useEffect(() => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    const label = d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { weekday: "short" });
    setDateLabels(lang === "tr" ? ["Bugün", "Yarın", label] : ["Today", "Tomorrow", label]);
  }, [lang]);

  const serviceList = services.slice(0, 5);
  const barberList  = barbers;

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.borderHi}`,
      borderRadius: "14px",
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(17,17,17,0.07), 0 1px 4px rgba(17,17,17,0.04)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "22px", height: "22px",
            background: C.primary, borderRadius: "5px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontWeight: 800, color: "#fff", fontSize: "10px" }}>A</span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: C.primary, letterSpacing: "0.01em" }}>
            {lang === "tr" ? "Randevu Planla" : "Book Appointment"}
          </span>
        </div>
        <span style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.04em" }}>
          {lang === "tr" ? "Ücretsiz · Anında Onay" : "Free · Instant Confirm"}
        </span>
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>

        {/* Step 1: Service */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
            <div style={{
              width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
              background: selectedService ? C.primary : C.dim,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "9px", fontWeight: 700, color: "#fff",
            }}>
              {selectedService ? <Check size={9} /> : "1"}
            </div>
            <span style={{
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase",
              color: selectedService ? C.primary : C.secondary,
            }}>
              {lang === "tr" ? "Hizmet" : "Service"}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {serviceList.map(svc => (
              <button key={svc.id}
                onClick={() => setSelectedService(svc.id === selectedService ? null : svc.id)}
                style={{
                  minHeight: "36px",
                  padding: "8px 12px", borderRadius: "6px",
                  fontSize: "11px", fontWeight: 500, cursor: "pointer",
                  border: `1px solid ${selectedService === svc.id ? C.primary : C.border}`,
                  background: selectedService === svc.id ? `rgba(17,17,17,0.08)` : "transparent",
                  color: selectedService === svc.id ? C.primary : C.secondary,
                  transition: "all 0.15s",
                }}>
                {svc.name[lang]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: "1px", background: C.border }} />

        {/* Step 2: Barber */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
            <div style={{
              width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
              background: selectedBarber ? C.primary : C.dim,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "9px", fontWeight: 700, color: "#fff",
            }}>
              {selectedBarber ? <Check size={9} /> : "2"}
            </div>
            <span style={{
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase",
              color: selectedBarber ? C.primary : C.secondary,
            }}>
              {lang === "tr" ? "Berber" : "Barber"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {barberList.slice(0, 4).map(b => (
              <button key={b.id}
                onClick={() => setSelectedBarber(b.id === selectedBarber ? null : b.id)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", background: "none", border: "none", padding: 0 }}
                title={b.name}>
                {b.profilePhoto ? (
                  <Image src={b.profilePhoto} alt={b.name || ""} width={38} height={38}
                    sizes="38px"
                    style={{
                      borderRadius: "9px", objectFit: "cover",
                      border: `2px solid ${selectedBarber === b.id ? C.primary : C.border}`,
                      transition: "all 0.15s",
                    }} />
                ) : (
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "9px",
                    background: selectedBarber === b.id ? C.primary : C.surface,
                    border: `2px solid ${selectedBarber === b.id ? C.primary : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: 700,
                    color: selectedBarber === b.id ? "#fff" : C.secondary,
                    letterSpacing: "0.03em", transition: "all 0.15s",
                  }}>
                    {b.avatar}
                  </div>
                )}
                <span style={{ fontSize: "9px", color: selectedBarber === b.id ? C.primary : C.muted, letterSpacing: "0.02em" }}>
                  {(b.name || "").split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: "1px", background: C.border }} />

        {/* Step 3: Date */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
            <div style={{
              width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
              background: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "9px", fontWeight: 700, color: "#fff",
            }}>
              <Check size={9} />
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.primary }}>
              {lang === "tr" ? "Tarih & Saat" : "Date & Time"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px" }}>
            {dateLabels.map((label, i) => (
              <button key={label} onClick={() => setSelectedDate(selectedDate === i ? null : i)} style={{
                padding: "10px 0", textAlign: "center", borderRadius: "7px", cursor: "pointer",
                background: selectedDate === i ? `rgba(17,17,17,0.08)` : C.surface,
                border: `1px solid ${selectedDate === i ? `rgba(17,17,17,0.35)` : C.border}`,
                fontSize: "11px", fontWeight: selectedDate === i ? 600 : 400,
                color: selectedDate === i ? C.primary : C.secondary,
                transition: "all 0.15s",
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link href={`${bookBase}?${new URLSearchParams({
          ...(selectedService               ? { service: selectedService }      : {}),
          ...(selectedBarber                ? { barber:  selectedBarber  }      : {}),
          ...(selectedDate !== null         ? { date:    String(selectedDate) } : {}),
        }).toString()}`} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          background: C.primary, color: "#fff",
          padding: "15px 24px", borderRadius: "9px",
          fontSize: "14px", fontWeight: 700, letterSpacing: "0.03em",
          textDecoration: "none",
          boxShadow: "0 6px 20px rgba(17,17,17,0.28)",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#111111"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(17,17,17,0.38)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.boxShadow = "0 6px 20px rgba(17,17,17,0.28)"; }}
        >
          {lang === "tr" ? "Randevu Al" : "Book Now"}
          <ChevronRight size={15} />
        </Link>

        <p style={{ fontSize: "10px", color: C.muted, textAlign: "center", letterSpacing: "0.03em", marginTop: "-6px" }}>
          {lang === "tr"
            ? "Ücretsiz iptal · İşlem ücreti yok · Anında onay"
            : "Free cancellation · No booking fees · Instant confirmation"}
        </p>
      </div>
    </div>
  );
}

export default function Hero({ services = [], barbers = [], googleReviews = null }) {
  const { lang } = useLang();
  const tx = useT(lang);
  const shop = useShop();
  const bookBase = shop?.slug ? `/${shop.slug}/book` : "/book";
  // ponytail: rating comes from SSR via prop. No client fetch.
  const googleRating = googleReviews?.rating
    ? { rating: googleReviews.rating, total: googleReviews.totalRatings }
    : null;

  return (
    <section className="relative min-h-screen flex flex-col" style={{ background: C.bg }}>
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 70% at 100% 0%, #EDE8E0 0%, transparent 55%)",
      }} />

      <div className="relative z-10 flex-1 flex items-start lg:items-center">
        <div style={{
          width: "min(1440px, 100%)",
          marginInline: "auto",
          paddingInline: "clamp(20px, 4vw, 32px)",
          paddingTop: "40px",
          paddingBottom: "48px",
        }} className="lg:!pt-0 lg:!pb-0">
          <div
            className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-16 lg:min-h-[calc(100dvh-68px)]"
            style={{
              paddingTop: "clamp(0px, 4vh, 40px)",
              paddingBottom: "clamp(16px, 4vh, 40px)",
            }}
          >

            {/* ── LEFT ── */}
            <div className="lg:col-span-5 flex flex-col justify-center" style={{ maxWidth: "720px" }}>

              {/* Stars + location */}
              <div className="hero-badge flex items-center gap-3 mb-8" style={{ flexWrap: "wrap" }}>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={C.primary} style={{ color: C.primary }} />)}
                </div>
                {googleRating && (
                  <span style={{ fontSize: "11px", color: C.secondary }}>
                    {googleRating.rating} · {googleRating.total}+ {lang === "tr" ? "değerlendirme" : "reviews"}
                  </span>
                )}
                <span style={{ width: "1px", height: "12px", background: C.border, flexShrink: 0 }} />
                <span style={{ fontSize: "10px", color: C.primary, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                  {tx.hero.badge(shop)}
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-display font-light hero-heading"
                style={{ letterSpacing: "-0.025em", marginBottom: "20px" }}
              >
                <span style={{ display: "block", fontSize: "clamp(56px, 7vw, 104px)", color: C.primary, lineHeight: 0.98 }}>
                  {lang === "tr" ? "Ustalar" : "Masters"}
                </span>
                <span style={{ display: "block", fontSize: "clamp(56px, 7vw, 104px)", color: C.primary, lineHeight: 0.98, fontStyle: "italic" }}>
                  {lang === "tr" ? "sizi" : "await"}
                </span>
                <span style={{ display: "block", fontSize: "clamp(56px, 7vw, 104px)", color: C.primary, lineHeight: 0.98, paddingBottom: "0.18em" }}>
                  {lang === "tr" ? "bekliyor." : "you."}
                </span>
              </h1>

              {/* Sub-copy */}
              <p className="hero-sub" style={{
                fontSize: "15px",
                color: C.secondary,
                lineHeight: 1.75,
                maxWidth: "400px",
                marginBottom: "32px",
              }}>
                {lang === "tr"
                  ? `${shop?.name ?? "Salonumuzda"} premium saç ve sakal bakımı. Online randevu alın, bekleme yok.`
                  : `Premium haircuts and grooming at ${shop?.name ?? "our salon"}. Book online, no waiting.`}
              </p>

              {/* Desktop CTAs */}
              <div className="hero-ctas hidden sm:flex flex-row gap-3 mb-10">
                <Link href={bookBase} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: C.primary, color: "#fff",
                  padding: "13px 28px", borderRadius: "8px",
                  fontSize: "14px", fontWeight: 600, letterSpacing: "0.02em",
                  textDecoration: "none", transition: "background 0.15s",
                  whiteSpace: "nowrap",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#111111"}
                  onMouseLeave={e => e.currentTarget.style.background = C.primary}
                >
                  {lang === "tr" ? "Randevu Al" : "Book Now"}
                  <ChevronRight size={14} />
                </Link>
                <a href="#services" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: "transparent", color: C.secondary,
                  padding: "13px 22px", borderRadius: "8px",
                  fontSize: "14px", fontWeight: 500,
                  border: `1px solid ${C.border}`,
                  textDecoration: "none", transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = "#6B7280"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.secondary; e.currentTarget.style.borderColor = C.border; }}
                >
                  {lang === "tr" ? "Hizmetleri Gör" : "View Services"}
                </a>
              </div>

              {/* Mobile: explore link */}
              <div className="hero-ctas flex sm:hidden mb-6">
                <a href="#services" style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  color: C.secondary, fontSize: "14px", fontWeight: 500, textDecoration: "none",
                }}>
                  {lang === "tr" ? "Hizmetleri Gör" : "View Services"}
                  <ChevronRight size={13} />
                </a>
              </div>

              {/* Trust line */}
              <div
                className="hero-trust hidden sm:flex items-center gap-5 pt-6"
                style={{ borderTop: `1px solid ${C.border}` }}
              >
                {shop?.description && (
                  <span style={{ fontSize: "12px", color: C.secondary }}>{shop.description}</span>
                )}
              </div>
            </div>

            {/* ── RIGHT: Booking widget ── */}
            <div className="hero-right lg:col-span-7 flex items-center justify-center lg:justify-end">
              <div style={{ width: "100%", maxWidth: "560px" }}>
                <StatusCard lang={lang} barbers={barbers} />
                <BookingWidget lang={lang} services={services} barbers={barbers} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

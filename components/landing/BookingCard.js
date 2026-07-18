"use client";

// Booking card — quick-start widget in the hero row beside IdentityBlock on
// desktop, stacked under it on mobile. NOT sticky — once the user scrolls
// past the hero, the rest of the page is full-width.
// Compact 3-step picker (service / barber / date) feeding /[slug]/book?…

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import { ChevronRight, Check, Clock, Zap, Users, Sparkles, Flame } from "lucide-react";

const C = {
  surface:  "var(--makas-surface)",
  surface2: "var(--makas-surface2)",
  card:     "var(--makas-surface)",
  border:   "var(--makas-border)",
  borderHi: "#D4CECC",
  primary:  "var(--makas-ink)",
  secondary:"var(--makas-ink-secondary)",
  muted:    "var(--makas-ink-muted)",
  dim:      "var(--makas-thumb)",
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
function todayKey() { return DAY_KEYS[(new Date().getDay() + 6) % 7]; }
function fmtMin(m) {
  if (m == null) return null;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export default function BookingCard({
  services = [],
  barbers = [],
  hours = null,
  nextAvailable = null,   // { dayOffset, minutes } — server-computed earliest open slot
  activityCount = 0,      // appointments booked in last 24h
}) {
  const { lang } = useLang();
  const shop = useShop();
  const bookBase = shop?.slug ? `/${shop.slug}/book` : "/book";

  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber,  setSelectedBarber]  = useState(null);
  const [selectedDate,    setSelectedDate]    = useState(null);

  // ponytail: derive labels purely from lang. The 3rd label depends on the
  // current date, so SSR/CSR may briefly disagree across midnight TZ — third
  // button gets suppressHydrationWarning to silence the diff.
  const dateLabels = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    const label = d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { weekday: "short" });
    return lang === "tr" ? ["Bugün", "Yarın", label] : ["Today", "Tomorrow", label];
  }, [lang]);

  const serviceList    = services.slice(0, 5);
  const availableList  = barbers.filter((b) => b.available !== false);
  const barberList     = availableList.slice(0, 6);
  const barbersTotal   = barbers.length;
  const barbersAvail   = availableList.length;

  // ponytail: trust SSR. Both shop-wide (min across barbers) and per-barber
  // values come from the server with real bookings + breaks + holidays. Page
  // revalidates every 300s (see app/[shopSlug]/page.js), which is good enough
  // — a client-side recompute can't see new bookings made elsewhere anyway.
  const pickedBarber = selectedBarber ? barbers.find(x => x.id === selectedBarber) : null;
  const effectiveNext = pickedBarber ? pickedBarber.nextAvailable ?? null : nextAvailable;

  const nextSlotLabel = useMemo(() => {
    if (!effectiveNext) return null;
    const { dayOffset, minutes } = effectiveNext;
    const time = fmtMin(minutes);
    if (dayOffset === 0) return lang === "tr" ? `bugün ${time}` : `today ${time}`;
    if (dayOffset === 1) return lang === "tr" ? `yarın ${time}` : `tomorrow ${time}`;
    const d = new Date(); d.setDate(d.getDate() + dayOffset);
    const wk = d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { weekday: "short" });
    return `${wk} ${time}`;
  }, [effectiveNext, lang]);

  // open/closed line for header (only if we have today's hours)
  const todayHours = hours?.find((h) => h.day === todayKey());
  const hasHoursToday = todayHours?.start != null && todayHours?.end != null;
  const isOpen = (() => {
    if (!hasHoursToday) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= todayHours.start && cur < todayHours.end;
  })();

  const href = `${bookBase}?${new URLSearchParams({
    ...(selectedService       ? { service: selectedService }      : {}),
    ...(selectedBarber        ? { barber:  selectedBarber  }      : {}),
    ...(selectedDate !== null ? { date:    String(selectedDate) } : {}),
  }).toString()}`;

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.borderHi}`,
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(17,17,17,0.09), 0 2px 6px rgba(17,17,17,0.04)",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 24px",
        borderBottom: `1px solid ${C.border}`,
        background: C.surface2,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.primary, letterSpacing: "0.01em" }}>
          {lang === "tr" ? "Randevu Planla" : "Book Appointment"}
        </span>
        {hasHoursToday ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isOpen ? "#16a34a" : "#9ca3af",
              boxShadow: isOpen ? "0 0 6px rgba(22,163,74,0.35)" : "none",
            }} />
            <Clock size={10} />
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmtMin(todayHours.start)} – {fmtMin(todayHours.end)}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.04em" }}>
            {lang === "tr" ? "Ücretsiz · Anında Onay" : "Free · Instant Confirm"}
          </span>
        )}
      </div>

      {/* Info strip — earliest slot · live availability · 24h activity.
          Every chip is conditional; the row hides entirely if nothing to show. */}
      {(nextSlotLabel || barbersTotal > 0 || activityCount > 0) && (
        <div style={{
          padding: "10px 24px",
          background: "rgba(17,17,17,0.02)",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 14px",
          fontSize: 11.5, color: C.secondary, fontWeight: 500,
        }}>
          {nextSlotLabel && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                  suppressHydrationWarning>
              <Zap size={12} style={{ color: "#15803d" }} fill="#15803d" />
              <span style={{ color: C.primary, fontWeight: 600 }}>
                {pickedBarber
                  ? (lang === "tr"
                      ? `${(pickedBarber.name || "").split(" ")[0]} ile`
                      : `With ${(pickedBarber.name || "").split(" ")[0]}`)
                  : (lang === "tr" ? "En erken" : "Earliest")}
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{nextSlotLabel}</span>
            </span>
          )}
          {barbersTotal > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Users size={12} />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {lang === "tr"
                  ? `${barbersAvail}/${barbersTotal} berber müsait`
                  : `${barbersAvail}/${barbersTotal} barbers available`}
              </span>
            </span>
          )}
          {activityCount > 2 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Flame size={12} style={{ color: "#c2410c" }} />
              {lang === "tr"
                ? `Son 24 saatte ${activityCount} randevu`
                : `${activityCount} bookings in 24h`}
            </span>
          )}
        </div>
      )}

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Step 1 — service */}
        {serviceList.length > 0 && (
          <Step
            n={1}
            label={lang === "tr" ? "Hizmet" : "Service"}
            done={!!selectedService}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {serviceList.map((svc) => {
                const active = selectedService === svc.id;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => setSelectedService(active ? null : svc.id)}
                    style={{
                      padding: "8px 12px", borderRadius: 6,
                      fontSize: 12, fontWeight: 500, cursor: "pointer",
                      border: `1px solid ${active ? C.primary : C.border}`,
                      background: active ? "rgba(17,17,17,0.08)" : "transparent",
                      color: active ? C.primary : C.secondary,
                      transition: "all 0.15s",
                      minHeight: 36,
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}
                  >
                    {svc.popular && (
                      <Sparkles size={11} style={{ color: "#c2410c" }} fill="#fb923c" />
                    )}
                    <span>{svc.name[lang]}</span>
                    {svc.duration != null && (
                      <span style={{
                        fontSize: 10, color: active ? C.secondary : C.muted,
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        · {svc.duration}{lang === "tr" ? "dk" : "m"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {serviceList.length > 0 && barberList.length > 0 && (
          <div style={{ height: 1, background: C.border }} />
        )}

        {/* Step 2 — barber */}
        {barberList.length > 0 && (
          <Step
            n={2}
            label={lang === "tr" ? "Berber" : "Barber"}
            done={!!selectedBarber}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {barberList.map((b) => {
                const active = selectedBarber === b.id;
                const avail  = b.available !== false;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBarber(active ? null : b.id)}
                    title={b.name + (avail ? "" : lang === "tr" ? " (yoğun)" : " (busy)")}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      {b.profilePhoto ? (
                        <Image
                          src={b.profilePhoto} alt={b.name || ""} width={40} height={40} sizes="40px"
                          style={{
                            borderRadius: 9, objectFit: "cover",
                            border: `2px solid ${active ? C.primary : C.border}`,
                            transition: "all 0.15s",
                            opacity: avail ? 1 : 0.55,
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: 9,
                          background: active ? C.primary : C.surface2,
                          border: `2px solid ${active ? C.primary : C.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700,
                          color: active ? "#fff" : C.secondary,
                          transition: "all 0.15s",
                          opacity: avail ? 1 : 0.55,
                        }}>
                          {b.avatar}
                        </div>
                      )}
                      {/* Availability dot — green = open for bookings, gray = unavailable */}
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          right: -2, bottom: -2,
                          width: 11, height: 11, borderRadius: "50%",
                          background: avail ? "#16a34a" : "#9ca3af",
                          border: `2px solid ${C.card}`,
                          boxShadow: avail ? "0 0 5px rgba(22,163,74,0.45)" : "none",
                        }}
                      />
                    </div>
                    <span style={{
                      fontSize: 10,
                      color: active ? C.primary : C.muted,
                      letterSpacing: "0.02em", maxWidth: 56,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {(b.name || "").split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {barberList.length > 0 && <div style={{ height: 1, background: C.border }} />}

        {/* Step 3 — date */}
        <Step
          n={3}
          label={lang === "tr" ? "Tarih & Saat" : "Date & Time"}
          done={selectedDate !== null}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
            {dateLabels.map((label, i) => {
              const active = selectedDate === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDate(active ? null : i)}
                  suppressHydrationWarning={i === 2}
                  style={{
                    padding: "0", minHeight: "44px", textAlign: "center", borderRadius: 7, cursor: "pointer",
                    background: active ? "rgba(17,17,17,0.08)" : C.surface2,
                    border: `1px solid ${active ? "rgba(17,17,17,0.35)" : C.border}`,
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    color: active ? C.primary : C.secondary,
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Step>

        {/* CTA */}
        <Link
          href={href}
          className="makas-cta makas-cta-dark"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: C.primary, color: "var(--makas-bg)",
            padding: "16px 24px", borderRadius: 10,
            fontSize: 14.5, fontWeight: 700, letterSpacing: "0.03em",
            textDecoration: "none",
            boxShadow: "0 6px 20px rgba(17,17,17,0.28)",
          }}
        >
          {lang === "tr" ? "Randevu Al" : "Book Now"}
          <ChevronRight size={15} />
        </Link>

        <p style={{
          fontSize: 11, color: C.muted, textAlign: "center",
          letterSpacing: "0.03em", marginTop: -8,
        }}>
          {lang === "tr"
            ? "Ücretsiz iptal · İşlem ücreti yok · Anında onay"
            : "Free cancellation · No booking fees · Instant confirmation"}
        </p>
      </div>
    </div>
  );
}

function Step({ n, label, done, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
          background: done ? C.primary : C.dim,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: done ? "var(--makas-bg)" : "#fff",
        }}>
          {done ? <Check size={9} /> : n}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase",
          color: done ? C.primary : C.secondary,
        }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

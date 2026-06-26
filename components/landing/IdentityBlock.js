"use client";

// Identity block — replaces CoverBanner + Hero left column.
// Compact (~320px tall on desktop): logo + name + meta + CTAs + socials.
// Every field is conditional — empty fields collapse, no empty gaps.

import Image from "next/image";
import Link from "next/link";
import { Star, Phone, MessageCircle, MapPin, Calendar } from "lucide-react";
import { track } from "@/lib/track";
import { telHref, waHref } from "@/lib/validation";
import { useLang } from "@/contexts/LanguageContext";

const C = {
  bg:        "var(--makas-bg)",
  surface:   "var(--makas-surface)",
  border:    "var(--makas-border)",
  primary:   "var(--makas-ink)",
  secondary: "var(--makas-ink-secondary)",
  muted:     "var(--makas-ink-muted)",
};

const SHOP_TYPE_LABEL = {
  tr: { male: "Erkek", female: "Kadın", unisex: "Unisex" },
  en: { male: "Men's", female: "Women's", unisex: "Unisex" },
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
function todayKey() {
  return DAY_KEYS[(new Date().getDay() + 6) % 7];
}
function fmtMin(m) {
  if (m == null) return null;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function prettifySlug(slug) {
  if (!slug) return "Salon";
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function IdentityBlock({ shop, hours, googleReviews }) {
  const { lang } = useLang();
  if (!shop) return null;

  const displayName = shop.name?.trim() || prettifySlug(shop.slug);
  const phoneHref   = telHref(shop.phone);
  const whatsappHref = waHref(shop.whatsappNumber ?? shop.phone);
  const mapHref = shop.latitude && shop.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`
    : shop.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`
      : null;
  const bookHref = `/${shop.slug}/book`;

  // ── open/closed (today) ────────────────────────────────────────────────────
  const todayHours = hours?.find((h) => h.day === todayKey());
  const hasHoursToday = todayHours?.start != null && todayHours?.end != null;
  const isOpen = (() => {
    if (!hasHoursToday) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= todayHours.start && cur < todayHours.end;
  })();

  // ── meta chips ─────────────────────────────────────────────────────────────
  const metaBits = [];
  if (shop.ownerName)   metaBits.push(shop.ownerName);
  if (shop.foundedYear) metaBits.push(lang === "tr" ? `Kuruluş ${shop.foundedYear}` : `Est. ${shop.foundedYear}`);
  if (shop.shopType && SHOP_TYPE_LABEL[lang]?.[shop.shopType]) {
    metaBits.push(SHOP_TYPE_LABEL[lang][shop.shopType]);
  }

  const hasSocial = !!(shop.instagramUrl || shop.facebookUrl || shop.tiktokUrl);

  // ponytail: no width/padding container here — parent owns layout so the
  // BookingCard column can sit beside this on desktop.
  return (
    <section data-identity style={{
      display: "flex",
      flexDirection: "column",
      gap: "clamp(20px, 2.5vw, 28px)",
    }}>
      <div style={{ display: "contents" }}>
        {/* ── Identity row: logo + name + meta ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(14px, 2vw, 20px)",
          minWidth: 0,
        }}>
          {/* Logo / monogram */}
          <div style={{
            position: "relative",
            width: "clamp(64px, 8vw, 88px)",
            height: "clamp(64px, 8vw, 88px)",
            flexShrink: 0,
            borderRadius: "16px",
            overflow: "hidden",
            background: C.surface,
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {shop.logo ? (
              <Image src={shop.logo} alt={displayName} fill sizes="88px" style={{ objectFit: "cover" }} priority />
            ) : (
              <span className="font-display" style={{
                fontSize: "clamp(28px, 3.6vw, 40px)", fontWeight: 400, color: C.primary,
              }}>
                {displayName[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1
              className="font-display font-light"
              style={{
                fontSize: "clamp(28px, 4.4vw, 52px)",
                letterSpacing: "-0.025em",
                lineHeight: 1.04,
                color: C.primary,
                margin: 0,
                textWrap: "balance",
              }}
            >
              {displayName}
            </h1>

            {/* meta row */}
            <div style={{
              marginTop: "10px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "10px 12px",
              fontSize: "13px",
              color: C.secondary,
            }}>
              {/* rating */}
              {googleReviews?.rating != null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" strokeWidth={0} />
                  <span style={{ color: C.primary, fontWeight: 600 }}>{googleReviews.rating.toFixed(1)}</span>
                  <span style={{ color: C.muted }}>({googleReviews.totalRatings})</span>
                </span>
              )}

              {/* open/closed */}
              {hasHoursToday && (
                <>
                  {googleReviews?.rating != null && <Dot />}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    fontWeight: 600,
                    color: isOpen ? "#15803d" : C.muted,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: isOpen ? "#16a34a" : "#9ca3af",
                      boxShadow: isOpen ? "0 0 6px rgba(22,163,74,0.35)" : "none",
                    }} />
                    {isOpen
                      ? (lang === "tr" ? "Açık" : "Open")
                      : (lang === "tr" ? "Kapalı" : "Closed")}
                  </span>
                  <span style={{ color: C.muted, fontVariantNumeric: "tabular-nums" }}>
                    {fmtMin(todayHours.start)} – {fmtMin(todayHours.end)}
                  </span>
                </>
              )}

              {/* address (city or short address) */}
              {(shop.city || shop.addressLine) && (
                <>
                  {(googleReviews?.rating != null || hasHoursToday) && <Dot />}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: C.muted }}>
                    <MapPin size={12} />
                    {shop.addressLine || shop.city}
                  </span>
                </>
              )}

              {/* type / founded / owner — secondary meta */}
              {metaBits.length > 0 && (
                <>
                  <Dot />
                  <span style={{ color: C.muted }}>
                    {metaBits.join(" · ")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── CTA row ── */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
        }}>
          <Link
            href={bookHref}
            className="makas-cta makas-cta-dark"
            onClick={() => track(shop.id, "book_click", { source: "identity" })}
            style={primaryBtn}
          >
            <Calendar size={16} />
            {lang === "tr" ? "Randevu Al" : "Book Now"}
          </Link>
          {phoneHref && (
            <a
              href={phoneHref}
              className="makas-cta makas-cta-outline"
              onClick={() => track(shop.id, "call_click", { source: "identity" })}
              style={ghostBtn}
            >
              <Phone size={14} />
              {lang === "tr" ? "Ara" : "Call"}
            </a>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank" rel="noopener noreferrer"
              className="makas-cta makas-cta-outline"
              onClick={() => track(shop.id, "whatsapp_click", { source: "identity" })}
              style={ghostBtn}
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          )}
          {mapHref && (
            <a
              href={mapHref}
              target="_blank" rel="noopener noreferrer"
              className="makas-cta makas-cta-outline"
              onClick={() => track(shop.id, "directions_click", { source: "identity" })}
              style={ghostBtn}
            >
              <MapPin size={14} />
              {lang === "tr" ? "Yol Tarifi" : "Directions"}
            </a>
          )}
        </div>

        {/* ── Social row ── */}
        {hasSocial && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            fontSize: "12px", color: C.muted,
          }}>
            <span style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
              {lang === "tr" ? "Takip" : "Follow"}
            </span>
            {shop.instagramUrl && <SocialIcon href={shop.instagramUrl} Icon={InstagramGlyph} label="Instagram" />}
            {shop.facebookUrl  && <SocialIcon href={shop.facebookUrl}  Icon={FacebookGlyph}  label="Facebook"  />}
            {shop.tiktokUrl    && <SocialIcon href={shop.tiktokUrl}    Icon={TikTokGlyph}    label="TikTok"    />}
          </div>
        )}
      </div>
    </section>
  );
}

function Dot() {
  return <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--makas-ink-muted)", opacity: 0.6 }} />;
}

function SocialIcon({ href, Icon, label }) {
  return (
    <a
      href={href}
      target="_blank" rel="noopener noreferrer"
      aria-label={label}
      style={{
        width: 32, height: 32, borderRadius: 8,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "var(--makas-ink-secondary)",
        background: "transparent",
        border: "1px solid var(--makas-border)",
        transition: "color 0.18s, border-color 0.18s, background 0.18s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--makas-ink)";
        e.currentTarget.style.borderColor = "var(--makas-ink-muted)";
        e.currentTarget.style.background = "rgba(17,17,17,0.025)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--makas-ink-secondary)";
        e.currentTarget.style.borderColor = "var(--makas-border)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon size={15} />
    </a>
  );
}

// lucide-react 1.x dropped brand glyphs — inline SVGs for socials.
function InstagramGlyph({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function FacebookGlyph({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function TikTokGlyph({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82a4.13 4.13 0 0 1-2.65-1.55V14.4a5.6 5.6 0 1 1-5.6-5.6c.27 0 .54.02.8.06v2.86a2.78 2.78 0 1 0 2.02 2.68V2h2.78a4.13 4.13 0 0 0 2.65 3.82z" />
    </svg>
  );
}

const primaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "12px 22px",
  background: "var(--makas-ink)",
  color: "#fff",
  fontSize: 14, fontWeight: 600, letterSpacing: "0.01em",
  borderRadius: 10, textDecoration: "none",
  minHeight: 44, boxSizing: "border-box",
};
const ghostBtn = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "12px 18px",
  background: "transparent",
  color: "var(--makas-ink-secondary)",
  border: "1px solid var(--makas-border)",
  fontSize: 13, fontWeight: 600,
  borderRadius: 10, textDecoration: "none",
  minHeight: 44, boxSizing: "border-box",
};

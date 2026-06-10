"use client";

import Link from "next/link";
import { MapPin, Phone, Clock, ArrowUpRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";

function InstagramIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function TikTokIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
}

const PHONE      = "+90 537 330 59 73";
const ADDRESS_TR = "Battal Gazi Cd. No:112 D:A\nKazım Karabekir, 41700 Darıca / Kocaeli";
const ADDRESS_EN = "Battal Gazi St. No:112 D:A\nKazım Karabekir, 41700 Darıca / Kocaeli";
const MAPS_EMBED = "https://maps.google.com/maps?q=Abdurrahman+%C3%87elik+Exclusive+Salon+Dar%C4%B1ca+Kocaeli&output=embed&hl=tr&z=16";
const MAPS_LINK  = "https://www.google.com/maps/search/Abdurrahman+%C3%87elik+Exclusive+Salon+Dar%C4%B1ca";

const serviceNames = {
  tr: ["Klasik Kesim", "Soluk & Kıvrım", "Sakal Şekillendirme", "Usta Tıraşı", "Kesim & Sakal", "VIP Bakım"],
  en: ["Classic Cut", "Fade & Taper", "Beard Sculpt", "Royal Shave", "Cut & Beard", "VIP Grooming"],
};

const SOCIAL = [
  { href: "https://www.instagram.com/abdurrahmancelikoffical", icon: <InstagramIcon size={14} />, label: "Instagram" },
  { href: "https://www.facebook.com/share/1BF6pDurn5/",        icon: <FacebookIcon  size={14} />, label: "Facebook"  },
  { href: "https://www.tiktok.com/@abdurrahman_celik41",       icon: <TikTokIcon    size={14} />, label: "TikTok"   },
];

export default function Footer() {
  const { lang } = useLang();
  const tx = useT(lang);
  const ft = tx.footer;

  return (
    <footer style={{ background: "#080808" }}>

      {/* ─── Location Section ─────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #1a1a1a", position: "relative", overflow: "hidden" }}>

        {/* Top fade from previous section */}
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: "80px", background: "linear-gradient(to bottom, #080808 0%, transparent 100%)", zIndex: 2, pointerEvents: "none" }} />

        <div className="max-w-7xl mx-auto" style={{ padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }} className="lg:!grid-cols-[420px_1fr]">

            {/* ── Info panel ── */}
            <div style={{
              padding: "72px 0 72px",
              display: "flex", flexDirection: "column", justifyContent: "center",
              borderRight: "none", position: "relative", zIndex: 3,
            }} className="lg:!border-r lg:!border-[#1a1a1a] lg:!pr-16">

              {/* Eyebrow */}
              <div style={{ fontSize: "10px", letterSpacing: "0.25em", color: "#CC1A1A", textTransform: "uppercase", fontWeight: 600, marginBottom: "28px" }}>
                {lang === "tr" ? "Bizi Ziyaret Edin" : "Visit Us"}
              </div>

              {/* Salon name */}
              <h2 style={{ fontSize: "clamp(22px, 2.8vw, 32px)", color: "#F8F6F1", fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "32px" }}>
                Abdurrahman Çelik<br />
                <span style={{ fontStyle: "italic", color: "#9a9490" }}>Exclusive Salon</span>
              </h2>

              {/* Divider */}
              <div style={{ width: "32px", height: "1px", background: "#CC1A1A", marginBottom: "32px" }} />

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "40px" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <MapPin size={13} style={{ color: "#CC1A1A", flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "13px", color: "#6B6660", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {lang === "tr" ? ADDRESS_TR : ADDRESS_EN}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <Phone size={13} style={{ color: "#CC1A1A", flexShrink: 0 }} />
                  <a href={`tel:${PHONE.replace(/\s/g, "")}`}
                    style={{ fontSize: "13px", color: "#6B6660", textDecoration: "none", letterSpacing: "0.03em", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#F8F6F1"}
                    onMouseLeave={e => e.currentTarget.style.color = "#6B6660"}>
                    {PHONE}
                  </a>
                </div>

                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <Clock size={13} style={{ color: "#CC1A1A", flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ fontSize: "13px", color: "#6B6660", lineHeight: 1.7 }}>
                    {ft.hours.weekdays}
                    {ft.hours.sat && <><br />{ft.hours.sat}</>}
                    <br /><span style={{ color: "#3a3a3a" }}>{ft.hours.sun}</span>
                  </div>
                </div>
              </div>

              {/* Directions CTA */}
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "10px",
                  fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
                  color: "#F8F6F1", textDecoration: "none", fontWeight: 500,
                  paddingBottom: "8px", borderBottom: "1px solid #CC1A1A",
                  alignSelf: "flex-start", transition: "opacity 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {lang === "tr" ? "Yol Tarifi Al" : "Get Directions"}
                <ArrowUpRight size={13} style={{ color: "#CC1A1A" }} />
              </a>
            </div>

            {/* ── Map panel ── */}
            <div style={{ position: "relative", height: "280px", overflow: "hidden" }} className="lg:!h-auto lg:!min-h-[360px]">

              {/* Map iframe */}
              <iframe
                src={MAPS_EMBED}
                width="100%"
                height="100%"
                style={{
                  border: 0, display: "block", position: "absolute", inset: 0,
                  filter: "grayscale(0.5) contrast(0.85) brightness(0.75) sepia(0.1)",
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Salon Konumu"
              />

              {/* Left fade — blends into info panel on desktop */}
              <div style={{ position: "absolute", inset: "0 auto 0 0", width: "120px", background: "linear-gradient(to right, #080808, transparent)", pointerEvents: "none", zIndex: 1 }} className="hidden lg:block" />
              {/* Top fade */}
              <div style={{ position: "absolute", inset: "0 0 auto 0", height: "80px", background: "linear-gradient(to bottom, #080808, transparent)", pointerEvents: "none", zIndex: 1 }} />
              {/* Bottom fade */}
              <div style={{ position: "absolute", inset: "auto 0 0 0", height: "80px", background: "linear-gradient(to top, #080808, transparent)", pointerEvents: "none", zIndex: 1 }} />
              {/* Right fade */}
              <div style={{ position: "absolute", inset: "0 0 0 auto", width: "60px", background: "linear-gradient(to left, #080808, transparent)", pointerEvents: "none", zIndex: 1 }} />

              {/* Mobile top fade */}
              <div style={{ position: "absolute", inset: "0 0 auto 0", height: "40px", background: "linear-gradient(to bottom, #080808, transparent)", pointerEvents: "none", zIndex: 2 }} className="lg:hidden" />
            </div>

          </div>
        </div>

        {/* Bottom fade into footer grid */}
        <div style={{ position: "absolute", inset: "auto 0 0 0", height: "60px", background: "linear-gradient(to top, #080808, transparent)", zIndex: 2, pointerEvents: "none" }} />
      </section>

      {/* ─── Footer grid ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #141414" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16" style={{ borderBottom: "1px solid #1a1a1a" }}>

            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ width: "32px", height: "32px", background: "#CC1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "var(--font-display, serif)", fontSize: "14px", fontWeight: 700, color: "#fff" }}>A</span>
                </div>
                <div>
                  <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#F8F6F1", textTransform: "uppercase", fontWeight: 600, lineHeight: 1 }}>Abdurrahman Çelik</div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "#CC1A1A", textTransform: "uppercase", marginTop: "3px" }}>Exclusive Salon</div>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#4a4a4a", lineHeight: 1.8, marginBottom: "24px" }}>{ft.tagline}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                {SOCIAL.map(({ href, icon, label }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    style={{
                      width: "34px", height: "34px", border: "1px solid #1e1e1e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#4a4a4a", textDecoration: "none", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#F8F6F1"; e.currentTarget.style.borderColor = "#CC1A1A"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#4a4a4a"; e.currentTarget.style.borderColor = "#1e1e1e"; }}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#CC1A1A", marginBottom: "20px", fontWeight: 600 }}>{ft.services}</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {serviceNames[lang].map((s) => (
                  <li key={s}>
                    <Link href="/book" style={{ fontSize: "12px", color: "#4a4a4a", textDecoration: "none", transition: "color 0.2s", letterSpacing: "0.01em" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#F8F6F1"}
                      onMouseLeave={e => e.currentTarget.style.color = "#4a4a4a"}>
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#CC1A1A", marginBottom: "20px", fontWeight: 600 }}>{ft.company}</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {ft.companyLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} style={{ fontSize: "12px", color: "#4a4a4a", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#F8F6F1"}
                      onMouseLeave={e => e.currentTarget.style.color = "#4a4a4a"}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact repeat — compact */}
            <div>
              <h4 style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#CC1A1A", marginBottom: "20px", fontWeight: 600 }}>{ft.visit}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <MapPin size={11} style={{ color: "#CC1A1A", flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "12px", color: "#4a4a4a", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {lang === "tr" ? ADDRESS_TR : ADDRESS_EN}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <Phone size={11} style={{ color: "#CC1A1A", flexShrink: 0 }} />
                  <a href={`tel:${PHONE.replace(/\s/g, "")}`} style={{ fontSize: "12px", color: "#4a4a4a", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#F8F6F1"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4a4a4a"}>
                    {PHONE}
                  </a>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <Clock size={11} style={{ color: "#CC1A1A", flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "12px", color: "#4a4a4a", lineHeight: 1.7 }}>
                    {ft.hours.weekdays}
                    {ft.hours.sat && <><br />{ft.hours.sat}</>}
                    <br /><span style={{ color: "#2e2e2e" }}>{ft.hours.sun}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ paddingTop: "28px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }} className="sm:!flex-row sm:!justify-between">
            <p style={{ fontSize: "10px", color: "#2e2e2e", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              © 2026 Abdurrahman Çelik Exclusive Salon
            </p>
            <div style={{ display: "flex", gap: "24px" }}>
              {[ft.privacy, ft.terms, ft.cookies].map((item) => (
                <a key={item} href="#" style={{ fontSize: "10px", color: "#2e2e2e", textDecoration: "none", letterSpacing: "0.08em", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#6B6660"}
                  onMouseLeave={e => e.currentTarget.style.color = "#2e2e2e"}>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}

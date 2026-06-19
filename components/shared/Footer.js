"use client";

import Link from "next/link";
import { MapPin, Phone, Clock, ArrowUpRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useShop } from "@/contexts/ShopContext";

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

const serviceNames = {
  tr: ["Klasik Kesim", "Fade & Taper", "Sakal Şekillendirme", "Usta Tıraşı", "Kesim & Sakal", "VIP Bakım"],
  en: ["Classic Cut", "Fade & Taper", "Beard Sculpt", "Royal Shave", "Cut & Beard", "VIP Grooming"],
};

function buildSocialLinks(social = {}) {
  const links = [];
  if (social.instagram) links.push({ href: social.instagram, icon: <InstagramIcon size={14} />, label: "Instagram" });
  if (social.facebook)  links.push({ href: social.facebook,  icon: <FacebookIcon  size={14} />, label: "Facebook"  });
  if (social.tiktok)    links.push({ href: social.tiktok,    icon: <TikTokIcon    size={14} />, label: "TikTok"    });
  return links;
}

export default function Footer() {
  const { lang } = useLang();
  const tx = useT(lang);
  const ft = tx.footer;
  const shop = useShop();

  const shopName  = shop?.name ?? "MAKAS";
  const shopPhone = shop?.phone ?? null;
  const shopAddr  = shop?.address ?? null;
  const bookHref  = shop?.slug ? `/${shop.slug}/book` : "/book";
  const socialLinks = buildSocialLinks(shop?.social ?? {});

  const mapsLink = shop?.googlePlaceId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopName)}&query_place_id=${shop.googlePlaceId}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${shopName}${shopAddr ? ` ${shopAddr}` : ""}`)}`;
  const mapsEmbed  = shop?.mapsEmbed
    || `https://maps.google.com/maps?q=${encodeURIComponent(shopName)}&output=embed&hl=tr&z=16`;

  return (
    <footer className="md:pb-0" style={{ background: "#111111", paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>

      {/* ─── Location Section ─────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #1E1E1E", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: "80px", background: "linear-gradient(to bottom, #111111 0%, transparent 100%)", zIndex: 2, pointerEvents: "none" }} />

        <div className="max-w-7xl mx-auto" style={{ padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }} className="lg:!grid-cols-[420px_1fr]">

            {/* ── Info panel ── */}
            <div style={{ padding: "72px 0 72px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "none", position: "relative", zIndex: 3 }}
              className="lg:!border-r lg:!border-[#1E1E1E] lg:!pr-16">

              <div style={{ fontSize: "10px", letterSpacing: "0.25em", color: "#F7F4EE", textTransform: "uppercase", fontWeight: 600, marginBottom: "28px" }}>
                {lang === "tr" ? "Bizi Ziyaret Edin" : "Visit Us"}
              </div>

              <h2 style={{ fontSize: "clamp(22px, 2.8vw, 32px)", color: "#F6F3EE", fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "32px" }}>
                {shopName}
              </h2>

              <div style={{ width: "32px", height: "1px", background: "#F7F4EE", marginBottom: "32px" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "40px" }}>
                {shopAddr && (
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <MapPin size={13} style={{ color: "#F7F4EE", flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ fontSize: "13px", color: "#9A9490", lineHeight: 1.7, whiteSpace: "pre-line" }}>{shopAddr}</span>
                  </div>
                )}
                {shopPhone && (
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <Phone size={13} style={{ color: "#F7F4EE", flexShrink: 0 }} />
                    <a href={`tel:${shopPhone.replace(/\s/g, "")}`}
                      style={{ fontSize: "13px", color: "#9A9490", textDecoration: "none", letterSpacing: "0.03em", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#F6F3EE"}
                      onMouseLeave={e => e.currentTarget.style.color = "#9A9490"}>
                      {shopPhone}
                    </a>
                  </div>
                )}
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <Clock size={13} style={{ color: "#F7F4EE", flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ fontSize: "13px", color: "#9A9490", lineHeight: 1.7 }}>
                    {ft.hours.weekdays}
                    {ft.hours.sat && <><br />{ft.hours.sat}</>}
                    <br /><span style={{ color: "#3E3C3A" }}>{ft.hours.sun}</span>
                  </div>
                </div>
              </div>

              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#F6F3EE", textDecoration: "none", fontWeight: 500, paddingBottom: "8px", borderBottom: "1px solid #F7F4EE", alignSelf: "flex-start", transition: "opacity 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {lang === "tr" ? "Yol Tarifi Al" : "Get Directions"}
                <ArrowUpRight size={13} style={{ color: "#F7F4EE" }} />
              </a>
            </div>

            {/* ── Map panel ── */}
            <div style={{ position: "relative", height: "280px", overflow: "hidden" }} className="lg:!h-auto lg:!min-h-[360px]">
              <iframe
                src={mapsEmbed}
                width="100%"
                height="100%"
                style={{ border: 0, display: "block", position: "absolute", inset: 0, filter: "grayscale(0.5) contrast(0.85) brightness(0.75) sepia(0.1)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Salon Konumu"
              />
              <div style={{ position: "absolute", inset: "0 auto 0 0", width: "120px", background: "linear-gradient(to right, #111111, transparent)", pointerEvents: "none", zIndex: 1 }} className="hidden lg:block" />
              <div style={{ position: "absolute", inset: "0 0 auto 0", height: "80px", background: "linear-gradient(to bottom, #111111, transparent)", pointerEvents: "none", zIndex: 1 }} />
              <div style={{ position: "absolute", inset: "auto 0 0 0", height: "80px", background: "linear-gradient(to top, #111111, transparent)", pointerEvents: "none", zIndex: 1 }} />
              <div style={{ position: "absolute", inset: "0 0 0 auto", width: "60px", background: "linear-gradient(to left, #111111, transparent)", pointerEvents: "none", zIndex: 1 }} />
              <div style={{ position: "absolute", inset: "0 0 auto 0", height: "40px", background: "linear-gradient(to bottom, #111111, transparent)", pointerEvents: "none", zIndex: 2 }} className="lg:hidden" />
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", inset: "auto 0 0 0", height: "60px", background: "linear-gradient(to top, #111111, transparent)", zIndex: 2, pointerEvents: "none" }} />
      </section>

      {/* ─── Footer grid ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #1E1E1E" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-12 pb-16" style={{ borderBottom: "1px solid #1E1E1E" }}>

            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ width: "32px", height: "32px", background: "#F7F4EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "var(--font-display, serif)", fontSize: "14px", fontWeight: 700, color: "#fff" }}>{shopName[0].toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#F6F3EE", textTransform: "uppercase", fontWeight: 600, lineHeight: 1 }}>{shopName}</div>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#888582", lineHeight: 1.8, marginBottom: "24px" }}>{ft.tagline}</p>
              {socialLinks.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {socialLinks.map(({ href, icon, label }) => (
                    <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                      style={{ width: "34px", height: "34px", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", color: "#888582", textDecoration: "none", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#F6F3EE"; e.currentTarget.style.borderColor = "#F7F4EE"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#888582"; e.currentTarget.style.borderColor = "#2a2a2a"; }}
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Services */}
            <div>
              <h4 style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#F7F4EE", marginBottom: "20px", fontWeight: 600 }}>{ft.services}</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {serviceNames[lang].map((s) => (
                  <li key={s}>
                    <Link href={bookHref} style={{ fontSize: "12px", color: "#888582", textDecoration: "none", transition: "color 0.2s", letterSpacing: "0.01em" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#F6F3EE"}
                      onMouseLeave={e => e.currentTarget.style.color = "#888582"}>
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#F7F4EE", marginBottom: "20px", fontWeight: 600 }}>{ft.company}</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {ft.companyLinks.map((item) => {
                  const slug = shop?.slug ?? "";
                  const href = slug
                    ? item.href.replace(/^\/(#|$)/, `/${slug}$1`).replace(/^\/book/, `/${slug}/book`).replace(/^\/barber/, `/${slug}/barber`)
                    : item.href;
                  return (
                  <li key={item.href}>
                    <Link href={href} style={{ fontSize: "12px", color: "#888582", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#F6F3EE"}
                      onMouseLeave={e => e.currentTarget.style.color = "#888582"}>
                      {item.label}
                    </Link>
                  </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div style={{ paddingTop: "28px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }} className="sm:!flex-row sm:!justify-between">
            <p style={{ fontSize: "10px", color: "#555250", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              © {new Date().getFullYear()} {shopName}
            </p>
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                { label: ft.privacy,  href: shop?.slug ? `/${shop.slug}/gizlilik` : "/gizlilik" },
                { label: ft.terms,    href: "/kullanim-kosullari" },
                { label: ft.cookies,  href: "/cerez-politikasi" },
              ].map(({ label, href }) => (
                <Link key={href} href={href} style={{ fontSize: "10px", color: "#555250", textDecoration: "none", letterSpacing: "0.08em", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#9A9490"}
                  onMouseLeave={e => e.currentTarget.style.color = "#555250"}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}

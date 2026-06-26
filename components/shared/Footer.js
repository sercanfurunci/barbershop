"use client";

import Link from "next/link";
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
  const socialLinks = buildSocialLinks(shop?.social ?? {});

  return (
    <footer className="md:pb-0" style={{ background: "var(--makas-footer)", paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>

      <div style={{ borderTop: "1px solid #1E1E1E" }}>
        <div style={{
          width: "min(1440px, 100%)",
          marginInline: "auto",
          paddingInline: "clamp(20px, 4vw, 32px)",
          paddingTop: "48px",
          paddingBottom: "32px",
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-10" style={{ borderBottom: "1px solid #1E1E1E" }}>

            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ width: "32px", height: "32px", background: "var(--makas-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "var(--font-display, serif)", fontSize: "14px", fontWeight: 700, color: "#fff" }}>{shopName[0].toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "var(--makas-bg)", textTransform: "uppercase", fontWeight: 600, lineHeight: 1 }}>{shopName}</div>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#888582", lineHeight: 1.8, marginBottom: "24px" }}>{ft.tagline}</p>
              {socialLinks.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {socialLinks.map(({ href, icon, label }) => (
                    <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                      style={{ width: "34px", height: "34px", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", color: "#888582", textDecoration: "none", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "var(--makas-bg)"; e.currentTarget.style.borderColor = "var(--makas-bg)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#888582"; e.currentTarget.style.borderColor = "#2a2a2a"; }}
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Company */}
            <div>
              <h4 style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--makas-bg)", marginBottom: "20px", fontWeight: 600 }}>{ft.company}</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {ft.companyLinks.map((item) => {
                  const slug = shop?.slug ?? "";
                  const href = slug
                    ? item.href.replace(/^\/(#|$)/, `/${slug}$1`).replace(/^\/book/, `/${slug}/book`).replace(/^\/barber/, `/${slug}/barber`)
                    : item.href;
                  return (
                  <li key={item.href}>
                    <Link href={href} style={{ fontSize: "12px", color: "#888582", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--makas-bg)"}
                      onMouseLeave={e => e.currentTarget.style.color = "#888582"}>
                      {item.label}
                    </Link>
                  </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div style={{ paddingTop: "24px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }} className="sm:!flex-row sm:!justify-between">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <p style={{ fontSize: "10px", color: "#555250", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                © {new Date().getFullYear()} {shopName}
              </p>
              <span style={{ color: "#2a2a2a" }}>·</span>
              <p style={{ fontSize: "10px", color: "#555250", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Powered by <Link href="https://makas.app" style={{ color: "#9A9490", textDecoration: "none" }}>MAKAS</Link>
              </p>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
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

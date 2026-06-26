"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useShop } from "@/contexts/ShopContext";

const C = {
  bg:       "var(--makas-bg)",
  bgSoft:   "#FDFBF7",
  surface:  "var(--makas-surface2)",
  card:     "var(--makas-surface)",
  border:   "var(--makas-border)",
  primary:  "var(--makas-ink)",
  secondary:"var(--makas-ink-secondary)",
  muted:    "var(--makas-ink-muted)",
  dim:      "#C5BEB5",
};

export default function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false);
  // Mode is driven by actual hero visibility via IntersectionObserver, not scrollY.
  // "default" until effect proves a hero is present + visible.
  const [mode, setMode]           = useState("default");
  const { lang, setLang }         = useLang();
  const tx = useT(lang);
  const pathname = usePathname();
  const shop = useShop();
  const shopSlug = shop?.slug ?? "";
  const isBookPage  = pathname?.includes("/book");
  const isStaffPage = pathname?.startsWith("/admin") || pathname?.startsWith("/barber") || pathname?.startsWith("/superadmin");

  const navLinks = [
    { label: tx.nav.services, href: "#services" },
    { label: tx.nav.team,     href: "#barbers"  },
    { label: tx.nav.reviews,  href: "#testimonials" },
  ];

  // Observe [data-hero] — if present + intersecting viewport (minus navbar height),
  // mode is "hero"; otherwise "default". Pages without a hero stay "default" forever.
  useEffect(() => {
    const el = typeof document !== "undefined" && document.querySelector("[data-hero]");
    if (!el) { setMode("default"); return; }
    setMode("hero"); // avoid flash: hero is at top of layout, assume visible on mount
    const io = new IntersectionObserver(
      ([entry]) => setMode(entry.isIntersecting ? "hero" : "default"),
      { rootMargin: "-68px 0px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);

  const isHero = mode === "hero";

  // Color tokens per mode. Hero = glassy dark over media; default = glassy cream over content.
  const navBg          = isHero ? "rgba(15,15,15,0.55)"        : "rgba(247,244,238,0.92)";
  const navBorder      = isHero ? "rgba(255,255,255,0.08)"     : "rgba(0,0,0,0.06)";
  const navText        = isHero ? "#fff"                       : C.primary;
  const navTextMuted   = isHero ? "rgba(255,255,255,0.78)"     : "#666";
  const navButtonBorder= isHero ? "rgba(255,255,255,0.22)"     : C.border;
  // Primary CTA: stays dark in default; inverts to white-on-dark over hero.
  const ctaBg          = isHero ? "#fff"                       : C.primary;
  const ctaText        = isHero ? "#111"                       : "#fff";
  // Logo mark: light variant doesn't exist yet — use glassy/transparent mark + white letter over hero.
  const logoMarkBg     = isHero ? "rgba(255,255,255,0.10)"     : C.primary;
  const logoMarkBorder = isHero ? "1px solid rgba(255,255,255,0.22)" : "none";
  // Mobile menu colors inherit current navbar mode.
  const menuBg         = isHero ? "rgba(15,15,15,0.92)"        : "rgba(247,244,238,0.98)";
  const menuBorder     = isHero ? "rgba(255,255,255,0.08)"     : C.border;

  // Body scroll lock + Escape-to-close while mobile menu open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0"
        style={{
          zIndex: 100,
          background: navBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${navBorder}`,
          transition: "background-color 220ms ease, color 220ms ease, border-color 220ms ease, backdrop-filter 220ms ease",
        }}
      >
        <div style={{ width: "min(1440px, 100%)", marginInline: "auto", paddingInline: "clamp(20px, 4vw, 32px)" }}>
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo — Link allowed to shrink so long names wrap instead of overflowing */}
            <Link
              href={shopSlug ? `/${shopSlug}` : "/"}
              className="flex items-center gap-3 group min-w-0 flex-1 md:flex-initial md:max-w-[420px]"
            >
              <div
                className="flex items-center justify-center transition-all duration-200 group-hover:opacity-90 shrink-0"
                style={{
                  width: "32px", height: "32px",
                  background: logoMarkBg, borderRadius: "6px",
                  border: logoMarkBorder,
                }}
              >
                <span className="font-display font-bold" style={{ fontSize: "14px", color: "#fff" }}>
                  {(shop?.name ?? "M")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1" style={{ display: "flex", flexDirection: "column" }}>
                <span
                  className="font-display font-light uppercase text-[11.5px] sm:text-[13px] line-clamp-2 md:truncate"
                  style={{
                    letterSpacing: "0.06em",
                    color: navText,
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                  }}
                >
                  {shop?.name ?? "MAKAS"}
                </span>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 transition-colors duration-200 rounded-md"
                  style={{ fontSize: "13px", letterSpacing: "0.02em", color: navTextMuted, fontWeight: 400 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = navText)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = navTextMuted)}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">
              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === "tr" ? "en" : "tr")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md transition-all"
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  fontWeight: 500,
                  border: `1px solid ${navButtonBorder}`,
                  color: navTextMuted,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = navText; e.currentTarget.style.borderColor = navText; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = navTextMuted; e.currentTarget.style.borderColor = navButtonBorder; }}
              >
                {lang === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}
              </button>

              <Link
                href={shopSlug ? `/${shopSlug}/barber` : "/barber"}
                className="px-4 py-2 rounded-md transition-all duration-200"
                style={{ fontSize: "13px", color: navTextMuted, letterSpacing: "0.02em" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = navText)}
                onMouseLeave={(e) => (e.currentTarget.style.color = navTextMuted)}
              >
                {tx.nav.admin}
              </Link>

              <Link
                href={shopSlug ? `/${shopSlug}/book` : "/book"}
                className="inline-flex items-center gap-1.5 transition-all duration-200"
                style={{
                  background: ctaBg,
                  color: ctaText,
                  padding: "9px 20px",
                  borderRadius: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {tx.nav.bookNow}
              </Link>
            </div>

            {/* Mobile trigger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-md transition-colors"
              style={{ color: navText, border: `1px solid ${navButtonBorder}` }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Scrim — tap to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[55] md:hidden"
              style={{ background: "rgba(17,17,17,0.32)", top: "68px" }}
              aria-hidden="true"
            />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="fixed left-0 right-0 z-[60] md:hidden"
            style={{ top: "68px", background: menuBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${menuBorder}` }}
            role="dialog"
            aria-modal="true"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 rounded-md transition-colors"
                  style={{ fontSize: "15px", color: navTextMuted, minHeight: "48px", display: "flex", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = navText)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = navTextMuted)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 pb-1 space-y-2" style={{ borderTop: `1px solid ${menuBorder}` }}>
                <button
                  onClick={() => { setLang(lang === "tr" ? "en" : "tr"); }}
                  className="w-full text-left px-4 rounded-md transition-colors"
                  style={{ fontSize: "14px", color: navTextMuted, minHeight: "48px", display: "flex", alignItems: "center" }}
                >
                  {lang === "tr" ? "🇬🇧 Switch to English" : "🇹🇷 Türkçe'ye Geç"}
                </button>
                <Link
                  href={shopSlug ? `/${shopSlug}/barber` : "/barber"}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center rounded-md transition-colors"
                  style={{ border: `1px solid ${navButtonBorder}`, color: navTextMuted, fontSize: "13px", minHeight: "48px" }}
                >
                  {tx.nav.admin}
                </Link>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile sticky bottom book bar — only on global marketing site (no shop).
          ponytail: tenant pages use richer <StickyActionBar/> with WhatsApp/Call/Maps. */}
      {!isBookPage && !isStaffPage && !shop && <div
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{
          background: "rgba(247,244,238,0.97)",
          backdropFilter: "blur(20px)",
          borderTop: `1px solid ${C.border}`,
          padding: "10px 16px",
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
        }}
      >
        <Link
          href={shopSlug ? `/${shopSlug}/book` : "/book"}
          className="flex items-center justify-center gap-2 w-full transition-all"
          style={{
            background: C.primary, color: "#fff",
            borderRadius: "10px", minHeight: "52px",
            fontSize: "15px", fontWeight: 600, letterSpacing: "0.02em",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {tx.nav.bookNow}
        </Link>
      </div>}
    </>
  );
}

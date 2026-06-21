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
  bg:       "#F7F4EE",
  bgSoft:   "#FDFBF7",
  surface:  "#EFEAE2",
  card:     "#FFFFFF",
  border:   "#E5DED3",
  primary:  "#111111",
  secondary:"#4A4A4A",
  muted:    "#8A8480",
  dim:      "#C5BEB5",
};

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
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

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

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
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? `rgba(247,244,238,0.97)` : "rgba(247,244,238,0)",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo — Link allowed to shrink so long names wrap instead of overflowing */}
            <Link
              href={shopSlug ? `/${shopSlug}` : "/"}
              className="flex items-center gap-3 group min-w-0 flex-1 md:flex-initial md:max-w-[420px]"
            >
              <div
                className="flex items-center justify-center transition-all duration-200 group-hover:opacity-90 shrink-0"
                style={{ width: "32px", height: "32px", background: C.primary, borderRadius: "6px" }}
              >
                <span className="font-display font-bold text-white" style={{ fontSize: "14px" }}>
                  {(shop?.name ?? "M")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1" style={{ display: "flex", flexDirection: "column" }}>
                <span
                  className="font-display font-light uppercase text-[11.5px] sm:text-[13px] line-clamp-2 md:truncate"
                  style={{
                    letterSpacing: "0.06em",
                    color: C.primary,
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
                  style={{ fontSize: "13px", letterSpacing: "0.02em", color: C.secondary, fontWeight: 400 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
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
                  border: `1px solid ${C.border}`,
                  color: C.secondary,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.secondary; e.currentTarget.style.borderColor = C.border; }}
              >
                {lang === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}
              </button>

              <Link
                href={shopSlug ? `/${shopSlug}/barber` : "/barber"}
                className="px-4 py-2 rounded-md transition-all duration-200"
                style={{ fontSize: "13px", color: C.secondary, letterSpacing: "0.02em" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
              >
                {tx.nav.admin}
              </Link>

              <Link
                href={shopSlug ? `/${shopSlug}/book` : "/book"}
                className="inline-flex items-center gap-1.5 transition-all duration-200"
                style={{
                  background: C.primary,
                  color: "#fff",
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
              style={{ color: C.primary, border: `1px solid ${C.border}` }}
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
            style={{ top: "68px", background: "rgba(247,244,238,0.98)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}
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
                  style={{ fontSize: "15px", color: C.secondary, minHeight: "48px", display: "flex", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 pb-1 space-y-2" style={{ borderTop: `1px solid ${C.border}` }}>
                <button
                  onClick={() => { setLang(lang === "tr" ? "en" : "tr"); }}
                  className="w-full text-left px-4 rounded-md transition-colors"
                  style={{ fontSize: "14px", color: C.secondary, minHeight: "48px", display: "flex", alignItems: "center" }}
                >
                  {lang === "tr" ? "🇬🇧 Switch to English" : "🇹🇷 Türkçe'ye Geç"}
                </button>
                <Link
                  href={shopSlug ? `/${shopSlug}/barber` : "/barber"}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center rounded-md transition-colors"
                  style={{ border: `1px solid ${C.border}`, color: C.secondary, fontSize: "13px", minHeight: "48px" }}
                >
                  {tx.nav.admin}
                </Link>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile sticky bottom book bar — hidden on booking and staff pages */}
      {!isBookPage && !isStaffPage && <div
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

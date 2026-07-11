"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, User, LogOut, Calendar, Store, Heart, Clock, MessageSquare, Settings } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useShop } from "@/contexts/ShopContext";
import { useAuth } from "@/contexts/AuthContext";

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
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef(null);
  // Mode is driven by actual hero visibility via IntersectionObserver, not scrollY.
  // "default" until effect proves a hero is present + visible.
  const [mode, setMode]           = useState("default");
  const { lang, setLang }         = useLang();
  const tx = useT(lang);
  const pathname = usePathname();
  const router = useRouter();
  const shop = useShop();
  const { user, logout } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  const shopSlug = shop?.slug ?? "";
  const isBookPage  = pathname?.includes("/book");
  const isStaffPage = pathname?.startsWith("/admin") || pathname?.startsWith("/barber") || pathname?.startsWith("/superadmin");
  const isAccountPage = pathname?.startsWith("/account");
  // Build login URL with current path as return destination (only for non-auth pages)
  const loginRedirect = !isStaffPage && pathname && pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : "";

  const navLinks = [
    { label: tx.nav.services, href: "#services" },
    { label: tx.nav.team,     href: "#barbers"  },
    { label: tx.nav.reviews,  href: "#testimonials" },
  ];

  // Observe [data-hero] — if present + intersecting viewport (minus navbar height),
  // mode is "hero"; otherwise "default". Pages without a hero stay "default" forever.
  useEffect(() => {
    const el = typeof document !== "undefined" && document.querySelector("[data-hero]");
    // eslint-disable-next-line react-compiler/react-compiler
    if (!el) { setMode("default"); return; }
    setMode("hero"); // avoid flash: hero is at top of layout, assume visible on mount
    const io = new IntersectionObserver(
      ([entry]) => setMode(entry.isIntersecting ? "hero" : "default"),
      { rootMargin: "-88px 0px 0px 0px", threshold: 0 },
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

  // Close login dropdown on outside click
  useEffect(() => {
    if (!loginOpen) return;
    const handler = (e) => { if (loginRef.current && !loginRef.current.contains(e.target)) setLoginOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [loginOpen]);

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
          zIndex: 50,
          background: navBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${navBorder}`,
          transition: "background-color 220ms ease, color 220ms ease, border-color 220ms ease, backdrop-filter 220ms ease",
        }}
      >
        <div style={{ width: "min(1440px, 100%)", marginInline: "auto", paddingInline: "clamp(24px, 5vw, 44px)" }}>
          <div className="flex items-center justify-between h-[88px]">

            {/* Logo — Link allowed to shrink so long names wrap instead of overflowing */}
            <Link
              href={shopSlug ? `/${shopSlug}` : "/"}
              className="flex items-center gap-3 group min-w-0 flex-1 md:flex-initial md:max-w-[420px]"
            >
              <div
                className="flex items-center justify-center transition-all duration-200 group-hover:opacity-90 shrink-0"
                style={{
                  width: "42px", height: "42px",
                  background: logoMarkBg, borderRadius: "8px",
                  border: logoMarkBorder,
                }}
              >
                <span className="font-display font-bold" style={{ fontSize: "18px", color: "#fff" }}>
                  {(shop?.name ?? "M")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1" style={{ display: "flex", flexDirection: "column" }}>
                <span
                  className="font-display font-light uppercase text-[12px] sm:text-[14px] line-clamp-2 md:truncate"
                  style={{
                    letterSpacing: "0.07em",
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
            {!isAccountPage && (
              <div className="hidden md:flex items-center gap-8">
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
            )}

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

              {!isAccountPage && (
                <Link
                  href={shopSlug ? `/${shopSlug}/barber` : "/barber"}
                  className="px-4 py-2 rounded-md transition-all duration-200"
                  style={{ fontSize: "13px", color: navTextMuted, letterSpacing: "0.02em" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = navText)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = navTextMuted)}
                >
                  {tx.nav.admin}
                </Link>
              )}

              {/* Auth CTA */}
              {isCustomer ? (
                /* Logged-in customer: avatar dropdown */
                <div ref={loginRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setLoginOpen(v => !v)}
                    className="flex items-center gap-2 transition-all duration-200"
                    style={{
                      background: ctaBg, color: ctaText,
                      padding: "8px 14px", borderRadius: "7px",
                      fontSize: "13px", fontWeight: 600,
                      border: "none", cursor: "pointer",
                    }}
                  >
                    <User size={14} />
                    <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.displayName?.split(" ")[0] || "Hesabım"}
                    </span>
                    <ChevronDown size={12} style={{ opacity: 0.7, transform: loginOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </button>
                  <AnimatePresence>
                    {loginOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.14 }}
                        style={{
                          position: "absolute", top: "calc(100% + 8px)", right: 0,
                          background: "var(--makas-bg)", border: "1px solid var(--makas-border)",
                          borderRadius: "10px", padding: "6px", minWidth: 180,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200,
                        }}
                      >
                        {[
                          { href: "/account?tab=profile",   Icon: User,           label: "Profil"               },
                          { href: "/account?tab=upcoming",  Icon: Calendar,       label: "Yaklaşan Randevular"  },
                          { href: "/account?tab=history",   Icon: Clock,          label: "Geçmiş"               },
                          { href: "/account?tab=favorites", Icon: Heart,          label: "Favoriler"            },
                          { href: "/account?tab=reviews",   Icon: MessageSquare,  label: "Yorumlar"             },
                          { href: "/account?tab=settings",  Icon: Settings,       label: "Ayarlar"              },
                        ].map(({ href, Icon, label }) => (
                          <Link key={href} href={href} onClick={() => setLoginOpen(false)}
                            className="flex items-center gap-2.5 rounded-[7px] px-3 py-2.5 transition-colors hover:bg-secondary/60"
                            style={{ fontSize: "13px", color: "var(--makas-ink)", textDecoration: "none" }}>
                            <Icon size={14} style={{ color: "var(--makas-ink-muted)", flexShrink: 0 }} /> {label}
                          </Link>
                        ))}
                        <div style={{ height: 1, background: "var(--makas-border)", margin: "4px 0" }} />
                        <button
                          onClick={async () => { setLoginOpen(false); await logout(); router.push("/login"); }}
                          className="flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2.5 transition-colors hover:bg-secondary/60"
                          style={{ fontSize: "13px", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                          <LogOut size={14} /> Çıkış Yap
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Not logged in: Login dropdown */
                <div ref={loginRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setLoginOpen(v => !v)}
                    className="flex items-center gap-1.5 transition-all duration-200"
                    style={{
                      background: ctaBg, color: ctaText,
                      padding: "9px 16px", borderRadius: "7px",
                      fontSize: "13px", fontWeight: 600,
                      border: "none", cursor: "pointer",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Giriş Yap
                    <ChevronDown size={13} style={{ opacity: 0.75, transform: loginOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </button>
                  <AnimatePresence>
                    {loginOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.14 }}
                        style={{
                          position: "absolute", top: "calc(100% + 8px)", right: 0,
                          background: "var(--makas-bg)", border: "1px solid var(--makas-border)",
                          borderRadius: "10px", padding: "6px", minWidth: 200,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200,
                        }}
                      >
                        <Link href={`/login${loginRedirect}`} onClick={() => setLoginOpen(false)}
                          className="flex items-center gap-2.5 rounded-[7px] px-3 py-2.5 transition-colors hover:bg-secondary/60"
                          style={{ fontSize: "13px", color: "var(--makas-ink)", textDecoration: "none" }}>
                          <User size={14} className="text-muted-foreground" /> Müşteri Girişi
                        </Link>
                        <Link href="/business/login" onClick={() => setLoginOpen(false)}
                          className="flex items-center gap-2.5 rounded-[7px] px-3 py-2.5 transition-colors hover:bg-secondary/60"
                          style={{ fontSize: "13px", color: "var(--makas-ink)", textDecoration: "none" }}>
                          <Store size={14} className="text-muted-foreground" /> İşletme Girişi
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <Link
                href={shopSlug ? `/${shopSlug}/book` : "/book"}
                className="inline-flex items-center gap-1.5 transition-all duration-200"
                style={{
                  background: isCustomer ? "var(--makas-surface2)" : ctaBg,
                  color: isCustomer ? "var(--makas-ink)" : ctaText,
                  border: isCustomer ? "1px solid var(--makas-border)" : "none",
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
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-md transition-colors"
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
              style={{ background: "rgba(17,17,17,0.32)", top: "88px" }}
              aria-hidden="true"
            />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="fixed left-0 right-0 z-[60] md:hidden"
            style={{ top: "88px", background: menuBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${menuBorder}` }}
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
              {/* Account section */}
              <div className="pb-3 space-y-1.5" style={{ borderTop: `1px solid ${menuBorder}`, paddingTop: "12px" }}>
                {isCustomer ? (
                  <>
                    <p className="px-4 text-[11px] uppercase tracking-widest font-medium" style={{ color: navTextMuted, opacity: 0.6 }}>Hesabım</p>
                    <Link href="/account" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 rounded-md transition-colors"
                      style={{ fontSize: "14px", color: navTextMuted, minHeight: "44px", textDecoration: "none" }}>
                      <User size={15} /> Profilim
                    </Link>
                    <Link href="/account?tab=upcoming" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 rounded-md transition-colors"
                      style={{ fontSize: "14px", color: navTextMuted, minHeight: "44px", textDecoration: "none" }}>
                      <Calendar size={15} /> Randevularım
                    </Link>
                    <button
                      onClick={async () => { setMenuOpen(false); await logout(); router.push("/login"); }}
                      className="flex w-full items-center gap-3 px-4 rounded-md transition-colors"
                      style={{ fontSize: "14px", color: "#ef4444", minHeight: "44px", background: "none", border: "none", cursor: "pointer" }}>
                      <LogOut size={15} /> Çıkış Yap
                    </button>
                  </>
                ) : (
                  <>
                    <p className="px-4 text-[11px] uppercase tracking-widest font-medium" style={{ color: navTextMuted, opacity: 0.6 }}>Hesap</p>
                    <Link href="/login" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 rounded-md transition-colors"
                      style={{ fontSize: "14px", color: navTextMuted, minHeight: "44px", textDecoration: "none" }}>
                      <User size={15} /> Müşteri Girişi
                    </Link>
                    <Link href={`/login${loginRedirect ? loginRedirect + "&tab=register" : "?tab=register"}`} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 rounded-md transition-colors"
                      style={{ fontSize: "14px", color: navTextMuted, minHeight: "44px", textDecoration: "none" }}>
                      <User size={15} /> Müşteri Kaydı
                    </Link>
                    <Link href="/business/login" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 rounded-md transition-colors"
                      style={{ fontSize: "14px", color: navTextMuted, minHeight: "44px", textDecoration: "none" }}>
                      <Store size={15} /> İşletme Girişi
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile sticky bottom book bar — only on global marketing site (no shop).
          ponytail: tenant pages use richer <StickyActionBar/> with WhatsApp/Call/Maps. */}
      {!isBookPage && !isStaffPage && !isAccountPage && !shop && <div
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

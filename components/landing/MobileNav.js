"use client";

// Mobile-only header controls (hidden ≥sm): profile icon + hamburger menu.
// Profile → auth entry bottom sheet. Hamburger → nav menu with "Hemen Başla",
// which opens a role chooser (customer vs salon) before any auth flow.

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { User, Menu, X, Building2, LayoutDashboard, LogOut, CalendarDays, Scissors, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { OVERLAY_TRANSITION, OVERLAY_SHADOW, OVERLAY_SHADOW_SIDE } from "@/lib/overlay";

// side: "bottom" (action sheet) | "left" (nav drawer)
// hideAt: breakpoint above which the overlay is hidden ("sm" | "md")
export function Sheet({ onClose, title, children, side = "bottom", hideAt = "sm" }) {
  const isLeft = side === "left";
  const hideCls = { sm: "sm:hidden", md: "md:hidden" }[hideAt];
  // ponytail: portal to body — header's backdrop-filter creates a containing
  // block that would otherwise trap this fixed sheet inside the navbar.
  return createPortal(
    <motion.div
      className={`fixed inset-0 z-[100] ${hideCls}`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={OVERLAY_TRANSITION}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className={`motion-safety-exempt absolute bg-background px-4 pt-2.5 pb-8 ${
          isLeft
            ? "inset-y-0 left-0 w-[82%] max-w-[320px] rounded-r-[20px] border-r border-border overflow-y-auto"
            : "inset-x-0 bottom-0 rounded-t-[20px] border-t border-border"
        }`}
        style={{ boxShadow: isLeft ? OVERLAY_SHADOW_SIDE : OVERLAY_SHADOW }}
        initial={isLeft ? { x: "-100%" } : { y: "100%" }}
        animate={isLeft ? { x: 0 } : { y: 0 }}
        exit={isLeft ? { x: "-100%" } : { y: "100%" }}
        transition={OVERLAY_TRANSITION}
        drag={isLeft ? "x" : "y"}
        dragConstraints={isLeft ? { left: 0, right: 0 } : { top: 0, bottom: 0 }}
        dragElastic={{ left: isLeft ? 0.6 : 0, right: 0, top: 0, bottom: isLeft ? 0 : 0.6 }}
        onDragEnd={(_, info) => {
          const off = isLeft ? -info.offset.x : info.offset.y;
          const vel = isLeft ? -info.velocity.x : info.velocity.y;
          if (off > 70 || vel > 400) onClose();
        }}
      >
        {!isLeft && <div className="mx-auto w-10 h-1.5 rounded-full bg-border" />}
        <div className="mt-2 mb-1 flex items-center justify-between pl-1">
          <p className="text-[15px] font-semibold text-foreground">{title}</p>
          <button onClick={onClose} aria-label="Kapat"
            className="w-11 h-11 -mr-2 flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
}

function Row({ href, onClick, icon, children, danger }) {
  const cls = `flex items-center gap-3 min-h-[48px] px-3 rounded-[12px] text-[14px] font-medium no-underline transition-colors ${
    danger ? "text-red-600 hover:bg-red-50" : "text-foreground hover:bg-secondary"
  }`;
  const inner = (
    <>
      <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${danger ? "bg-red-50" : "bg-secondary"}`}>
        {icon}
      </span>
      {children}
    </>
  );
  if (href) return <Link href={href} onClick={onClick} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={`w-full text-left ${cls}`}>{inner}</button>;
}

export default function MobileNav() {
  const { user, loaded, logout } = useAuth();
  const router = useRouter();
  const [panel, setPanel] = useState(null); // null | "profile" | "menu" | "start"

  const close = () => setPanel(null);

  // Lock page scroll behind an open sheet
  useEffect(() => {
    if (!panel) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [panel]);

  const dashLink = user && user.role !== "CUSTOMER"
    ? user.role === "SUPER_ADMIN"
      ? "/superadmin"
      : user.role === "BARBER" && user.barber?.slug && user.shop?.slug
      ? `/${user.shop.slug}/barber/${user.barber.slug}`
      : user.shop?.slug
      ? `/${user.shop.slug}/admin`
      : "/dashboard"
    : null;

  return (
    <>
      {/* Header buttons — 44px tap targets */}
      <div className="flex sm:hidden items-center gap-0.5">
        <button
          type="button"
          onClick={() => setPanel("profile")}
          aria-label="Hesap"
          className="w-11 h-11 flex items-center justify-center rounded-full text-foreground hover:bg-secondary transition-colors"
        >
          <User size={21} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          onClick={() => setPanel("menu")}
          aria-label="Menü"
          className="w-11 h-11 flex items-center justify-center rounded-full text-foreground hover:bg-secondary transition-colors"
        >
          <Menu size={21} strokeWidth={1.9} />
        </button>
      </div>

      <AnimatePresence>
        {/* ── Profile / auth entry ── */}
        {panel === "profile" && (
          <Sheet key="profile" onClose={close} title="Hesap">
            {!loaded ? null : !user ? (
              <div className="space-y-1">
                <p className="px-1 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Giriş Yap</p>
                <Row href="/login" onClick={close} icon={<User size={16} />}>
                  Müşteri Olarak Devam Et
                </Row>
                <Row href="/business/login" onClick={close} icon={<Building2 size={16} />}>
                  Salon Olarak Devam Et
                </Row>
                <div className="border-t border-border my-2" />
                <Row href="/login?tab=register" onClick={close} icon={<UserPlus size={16} />}>
                  Hesap Oluştur
                </Row>
              </div>
            ) : user.role === "CUSTOMER" ? (
              <div className="space-y-1">
                <Row href="/account" onClick={close} icon={<User size={16} />}>Profilim</Row>
                <Row href="/account" onClick={close} icon={<CalendarDays size={16} />}>Randevularım</Row>
                <div className="border-t border-border my-2" />
                <Row danger icon={<LogOut size={16} className="text-red-600" />}
                  onClick={async () => { close(); await logout(); router.replace("/"); }}>
                  Çıkış Yap
                </Row>
              </div>
            ) : (
              <div className="space-y-1">
                <Row href={dashLink} onClick={close} icon={<LayoutDashboard size={16} />}>Yönetim Paneli</Row>
                <div className="border-t border-border my-2" />
                <Row danger icon={<LogOut size={16} className="text-red-600" />}
                  onClick={async () => { close(); await logout(); router.replace("/"); }}>
                  Çıkış Yap
                </Row>
              </div>
            )}
          </Sheet>
        )}

        {/* ── Hamburger menu ── */}
        {panel === "menu" && (
          <Sheet key="menu" onClose={close} title="Menü" side="left">
            <nav className="flex flex-col">
              {[
                { href: "/salons",    label: "Salonları Keşfet" },
                { href: "/#explore",  label: "Özellikler" },
                { href: "/#pricing",  label: "Fiyat" },
                { href: "/#demo",     label: "Demo" },
                { href: "/#faq",      label: "SSS" },
                { href: "/#contact",  label: "İletişim" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} onClick={close}
                  className="flex items-center min-h-[48px] px-3 rounded-[12px] text-[15px] font-medium text-foreground hover:bg-secondary no-underline transition-colors">
                  {label}
                </Link>
              ))}
              <div className="border-t border-border my-3" />
              <button
                type="button"
                onClick={() => setPanel("start")}
                className="flex items-center justify-center min-h-[48px] rounded-full bg-foreground text-background text-[15px] font-semibold"
              >
                Hemen Başla
              </button>
            </nav>
          </Sheet>
        )}

        {/* ── Get started: role chooser ── */}
        {panel === "start" && (
          <Sheet key="start" onClose={close} title="Nasıl devam etmek istersin?">
            <div className="space-y-3 pt-1">
              <Link href="/login?redirect=/salons" onClick={close}
                className="flex items-center gap-4 rounded-[16px] border border-border bg-card p-4 no-underline hover:border-foreground/30 transition-colors">
                <span className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User size={22} className="text-foreground" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-foreground">Randevu Al</span>
                  <span className="block text-[12px] text-muted-foreground mt-0.5">Salonları keşfet, randevunu oluştur.</span>
                </span>
              </Link>
              <Link href="/business/login" onClick={close}
                className="flex items-center gap-4 rounded-[16px] border border-border bg-card p-4 no-underline hover:border-foreground/30 transition-colors">
                <span className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center shrink-0">
                  <Scissors size={22} className="text-background" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-foreground">Salonumu Yöneteyim</span>
                  <span className="block text-[12px] text-muted-foreground mt-0.5">Randevu, personel ve işletmeni yönet.</span>
                </span>
              </Link>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  );
}

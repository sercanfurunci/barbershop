"use client";

import Link from "next/link";
import Logo from "@/components/common/Logo";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Unified dashboard header. Same component for Admin and Barber.
 * Height matches LandingNavbar (68px) for a seamless cross-section feel.
 *
 *   brand          { href, label, initial }   — mobile-only brand mark
 *   lang           "tr" | "en"
 *   onLangToggle   () => void
 *   notifications  { badge, onClick, title }  — badge: number | "dot"
 *   extras         ReactNode                  — role-specific buttons before avatar
 *   userMenu       { initials, statusDot?, headerName, headerRole, items }
 *     items: [{ icon, label, action, right, rightColor, danger } | { divider: true }]
 */
export default function DashboardTopbar({
  brand,
  lang,
  onLangToggle,
  notifications,
  extras,
  userMenu,
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header className="h-[68px] flex items-center gap-3 px-5 lg:px-8 sticky top-0 z-30 bg-background/86 backdrop-blur-[12px] border-b border-border">
      {brand && (
        <Link
          href={brand.href}
          className="flex lg:hidden items-center gap-2.5 no-underline min-w-0"
          aria-label="Ana sayfaya git"
        >
          <Logo variant="dark" size={36} showWordmark={false} />
          <span className="font-display text-[17px] font-semibold text-foreground tracking-[-0.01em] truncate">
            {brand.label}
          </span>
        </Link>
      )}

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {onLangToggle && (
          <button
            onClick={onLangToggle}
            className="font-mono-custom h-11 px-2.5 text-[11px] tracking-[0.16em] text-muted-foreground hover:text-foreground hover:bg-secondary rounded-[8px] transition-colors"
          >
            {lang === "tr" ? "EN" : "TR"}
          </button>
        )}

        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Tema değiştir"
          className="w-11 h-11 flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {notifications && (
          <button
            onClick={notifications.onClick}
            title={notifications.title}
            aria-label={notifications.title ?? "Bildirimler"}
            className="relative w-11 h-11 flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Bell size={16} />
            {notifications.badge === "dot" && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-destructive" />
            )}
            {typeof notifications.badge === "number" && notifications.badge > 0 && (
              <span
                className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center leading-none"
                style={{ border: "2px solid var(--makas-bg)" }}
              >
                {notifications.badge > 9 ? "9+" : notifications.badge}
              </span>
            )}
          </button>
        )}

        {extras}

        {userMenu && (
          <div className="relative ml-1">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Kullanıcı menüsü"
              aria-expanded={open}
              className="relative w-11 h-11 bg-foreground text-background rounded-[9px] flex items-center justify-center text-[11px] font-bold tracking-[0.02em]"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {userMenu.initials}
              {userMenu.statusDot && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-full"
                  style={{
                    background: userMenu.statusDot.available ? "#22C55E" : "#9CA3AF",
                    border: "2px solid var(--makas-bg)",
                  }}
                />
              )}
            </button>

            {open && mounted &&
              createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[70]"
                    onClick={() => setOpen(false)}
                  />
                  <div
                    className="fixed top-[72px] right-5 z-[71] bg-card border border-border rounded-[14px] p-1.5 min-w-[220px] max-w-[calc(100vw-32px)]"
                    style={{ boxShadow: "var(--shadow-pop)" }}
                  >
                    {userMenu.headerName && (
                      <div className="px-3 pt-2.5 pb-3 border-b border-border mb-1">
                        <p className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                          {userMenu.headerName}
                        </p>
                        {userMenu.headerRole && (
                          <p className="font-mono-custom text-[10px] text-muted-foreground uppercase tracking-[0.12em] mt-0.5">
                            {userMenu.headerRole}
                          </p>
                        )}
                      </div>
                    )}
                    {userMenu.items.map((item, i) => {
                      if (item.divider) {
                        return <div key={i} className="h-px bg-border my-1" />;
                      }
                      const Icon = item.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => { item.action?.(); setOpen(false); }}
                          className={`flex items-center ${item.right ? "justify-between" : ""} gap-2 w-full px-2.5 py-[9px] rounded-[8px] text-[13px] min-h-9 text-left transition-colors hover:bg-secondary ${item.danger ? "text-destructive hover:bg-destructive/8" : "text-secondary-foreground hover:text-foreground"}`}
                        >
                          <span className="flex items-center gap-[9px]">
                            {Icon && <Icon size={14} />}
                            {item.label}
                          </span>
                          {item.right && (
                            <span
                              className="font-mono-custom text-[10px] uppercase tracking-[0.1em]"
                              style={{ color: item.rightColor ?? "var(--makas-ink-muted)" }}
                            >
                              {item.right}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>,
                document.body
              )}
          </div>
        )}
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { C, SHADOW } from "@/lib/adminTheme";

/**
 * Unified dashboard header. Same component for Admin and Barber.
 * Matches the landing navbar's height, blur and rhythm so the
 * dashboard reads as a continuation of the marketing surface.
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

  return (
    <header
      className="h-16 lg:h-[68px] flex items-center gap-3 px-5 lg:px-8 sticky top-0 z-30"
      style={{
        background: `${C.bg}d9`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {brand && (
        <Link
          href={brand.href}
          className="flex lg:hidden items-center gap-2.5 no-underline min-w-0"
          aria-label="Ana sayfaya git"
        >
          <div
            className="w-9 h-9 flex items-center justify-center flex-shrink-0"
            style={{
              background: C.primary,
              borderRadius: "8px",
              color: "#fff",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "-0.02em",
            }}
          >
            {brand.initial}
          </div>
          <span
            className="font-display"
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: C.primary,
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {brand.label}
          </span>
        </Link>
      )}

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {onLangToggle && (
          <button
            onClick={onLangToggle}
            className="font-mono-custom transition-colors"
            style={{
              height: "36px",
              padding: "0 10px",
              fontSize: "11px",
              letterSpacing: "0.16em",
              color: C.secondary,
              background: "transparent",
              border: "none",
              borderRadius: "8px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.secondary; }}
          >
            {lang === "tr" ? "EN" : "TR"}
          </button>
        )}

        {notifications && (
          <button
            onClick={notifications.onClick}
            title={notifications.title}
            aria-label={notifications.title ?? "Bildirimler"}
            className="relative flex items-center justify-center transition-colors"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              color: C.secondary,
              background: "transparent",
              border: "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.secondary; }}
          >
            <Bell size={16} />
            {notifications.badge === "dot" && (
              <span
                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                style={{ background: "#DC2626" }}
              />
            )}
            {typeof notifications.badge === "number" && notifications.badge > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 4px",
                  borderRadius: "8px",
                  background: "#DC2626",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  border: `2px solid ${C.bg}`,
                }}
              >
                {notifications.badge > 9 ? "9+" : notifications.badge}
              </span>
            )}
          </button>
        )}

        {extras}

        {userMenu && (
          <div style={{ position: "relative", marginLeft: "4px" }}>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Kullanıcı menüsü"
              aria-expanded={open}
              style={{
                position: "relative",
                width: "36px",
                height: "36px",
                background: C.primary,
                color: "#fff",
                borderRadius: "9px",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                boxShadow: SHADOW.card,
              }}
            >
              {userMenu.initials}
              {userMenu.statusDot && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    width: "11px",
                    height: "11px",
                    borderRadius: "50%",
                    background: userMenu.statusDot.available ? "#22C55E" : "#9CA3AF",
                    border: `2px solid ${C.bg}`,
                  }}
                />
              )}
            </button>
            {open && mounted &&
              createPortal(
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 70 }}
                    onClick={() => setOpen(false)}
                  />
                  <div
                    style={{
                      position: "fixed",
                      top: "64px",
                      right: "20px",
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: "14px",
                      padding: "6px",
                      zIndex: 71,
                      minWidth: "220px",
                      maxWidth: "calc(100vw - 32px)",
                      boxShadow: SHADOW.pop,
                    }}
                  >
                    {userMenu.headerName && (
                      <div
                        style={{
                          padding: "10px 12px 12px",
                          borderBottom: `1px solid ${C.border}`,
                          marginBottom: "4px",
                        }}
                      >
                        <div style={{ fontSize: "13px", color: C.primary, fontWeight: 600, letterSpacing: "-0.01em" }}>
                          {userMenu.headerName}
                        </div>
                        {userMenu.headerRole && (
                          <div
                            className="font-mono-custom"
                            style={{
                              fontSize: "10px",
                              color: C.muted,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              marginTop: "2px",
                            }}
                          >
                            {userMenu.headerRole}
                          </div>
                        )}
                      </div>
                    )}
                    {userMenu.items.map((item, i) => {
                      if (item.divider) {
                        return (
                          <div
                            key={i}
                            style={{ height: "1px", background: C.border, margin: "4px 0" }}
                          />
                        );
                      }
                      const Icon = item.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            item.action?.();
                            setOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: item.right ? "space-between" : "flex-start",
                            gap: "8px",
                            width: "100%",
                            padding: "9px 10px",
                            borderRadius: "8px",
                            background: "transparent",
                            border: "none",
                            fontSize: "13px",
                            color: item.danger ? "#DC2626" : C.secondary,
                            textAlign: "left",
                            minHeight: "36px",
                            transition: "background 0.12s, color 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = item.danger
                              ? "rgba(220,38,38,0.06)"
                              : C.surface;
                            if (!item.danger) e.currentTarget.style.color = C.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            if (!item.danger) e.currentTarget.style.color = C.secondary;
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            {Icon && <Icon size={14} />}
                            {item.label}
                          </span>
                          {item.right && (
                            <span
                              className="font-mono-custom"
                              style={{
                                fontSize: "10px",
                                color: item.rightColor ?? C.muted,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                              }}
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

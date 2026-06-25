"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Search } from "lucide-react";

const C = {
  bg:        "#F7F4EE",
  card:      "#FFFFFF",
  border:    "#E5DED3",
  surface:   "#EFEAE2",
  primary:   "#111111",
  secondary: "#4A4A4A",
  muted:     "#8A8480",
};

/**
 * Unified dashboard header. Same structure for Admin and Barber.
 * Right cluster (lang → bell → extras → user menu) and left brand are
 * identical; only the props differ per role.
 *
 *   brand          { href, label, initial }   — mobile-only logo link
 *   search         { placeholder }            — optional search field (sm+)
 *   lang           "tr" | "en"                — current language
 *   onLangToggle   () => void                 — switches language
 *   notifications  { badge, onClick, title }  — badge: number | "dot"
 *   extras         ReactNode                  — role-specific buttons before avatar
 *   userMenu       { initials, statusDot?, headerName, headerRole, items }
 *     items: [{ icon, label, action, right, danger } | { divider: true }]
 */
export default function DashboardTopbar({
  brand,
  search,
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
      className="h-14 flex items-center gap-4 px-5 lg:px-7 sticky top-0 z-20"
      style={{
        background: `${C.bg}e8`,
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {brand && (
        <Link
          href={brand.href}
          className="flex lg:hidden items-center gap-2"
          style={{ textDecoration: "none", minWidth: 0, overflow: "hidden" }}
          aria-label="Ana sayfaya git"
        >
          <div
            className="w-7 h-7 flex items-center justify-center"
            style={{ background: C.primary, borderRadius: "6px", flexShrink: 0 }}
          >
            <span className="font-bold text-white" style={{ fontSize: "11px" }}>
              {brand.initial}
            </span>
          </div>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: C.primary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {brand.label}
          </span>
        </Link>
      )}

      {search && (
        <div
          className="hidden sm:flex items-center gap-2 flex-1 max-w-xs px-3 h-8"
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "6px" }}
        >
          <Search size={12} style={{ color: C.muted }} />
          <input
            placeholder={search.placeholder}
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: C.primary, caretColor: C.primary }}
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        {onLangToggle && (
          <button
            onClick={onLangToggle}
            className="flex items-center gap-1"
            style={{
              fontSize: "10px",
              letterSpacing: "0.25em",
              color: C.secondary,
              height: "32px",
              padding: "0 8px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
          >
            {lang === "tr" ? "EN" : "TR"}
          </button>
        )}

        {notifications && (
          <button
            onClick={notifications.onClick}
            title={notifications.title}
            className="relative w-8 h-8 flex items-center justify-center"
            style={{ color: C.secondary, background: "none", border: "none", cursor: "pointer" }}
          >
            <Bell size={15} />
            {notifications.badge === "dot" && (
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: C.primary }}
              />
            )}
            {typeof notifications.badge === "number" && notifications.badge > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
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
                }}
              >
                {notifications.badge > 9 ? "9+" : notifications.badge}
              </span>
            )}
          </button>
        )}

        {extras}

        {userMenu && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Kullanıcı menüsü"
              style={{
                position: "relative",
                width: "36px",
                height: "36px",
                background: C.primary,
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {userMenu.initials}
              {userMenu.statusDot && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    width: "10px",
                    height: "10px",
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
                      top: "58px",
                      right: "16px",
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: "10px",
                      padding: "6px",
                      zIndex: 71,
                      minWidth: "180px",
                      maxWidth: "calc(100vw - 32px)",
                      boxShadow: "0 8px 24px rgba(17,17,17,0.12)",
                    }}
                  >
                    {userMenu.headerName && (
                      <div
                        style={{
                          padding: "8px 10px 10px",
                          borderBottom: `1px solid ${C.border}`,
                          marginBottom: "4px",
                        }}
                      >
                        <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>
                          {userMenu.headerName}
                        </div>
                        {userMenu.headerRole && (
                          <div style={{ fontSize: "10px", color: C.secondary }}>
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
                            padding: "7px 10px",
                            borderRadius: "6px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: item.danger ? "#DC2626" : C.secondary,
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = item.danger
                              ? "rgba(220,38,38,0.08)"
                              : C.surface;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {Icon && <Icon size={12} />}
                            {item.label}
                          </span>
                          {item.right && (
                            <span
                              style={{
                                fontSize: "10px",
                                color: item.rightColor ?? C.muted,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
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

"use client";

// Mobile-only sticky bottom bar. The shop page already reserves bottom safe-area
// padding (paddingBottom: 72px) so this won't cover content.
//
// ponytail: hidden on md+ via CSS — desktop has the regular CTAs in Hero/SalonInfo.

import Link from "next/link";
import { Phone, MessageCircle, MapPin, Calendar } from "lucide-react";
import { track } from "@/lib/track";
import { telHref, waHref } from "@/lib/validation";

const C = {
  card:    "var(--makas-surface)",
  border:  "var(--makas-border)",
  primary: "var(--makas-ink)",
  muted:   "var(--makas-ink-muted)",
};

export default function StickyActionBar({ shop }) {
  if (!shop) return null;
  const tel     = telHref(shop.phone);
  const wa      = waHref(shop.whatsappNumber ?? shop.phone);
  const map     = shop.latitude && shop.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`
    : shop.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`
      : null;
  const bookHref = shop.slug ? `/${shop.slug}/book` : "/book";

  const secondaryActions = [
    wa  && { href: wa,  Icon: MessageCircle, label: "WhatsApp", external: true,  onClick: () => track(shop.id, "whatsapp_click",   { source: "sticky" }) },
    tel && { href: tel, Icon: Phone,         label: "Ara",      external: false, onClick: () => track(shop.id, "call_click",       { source: "sticky" }) },
    map && { href: map, Icon: MapPin,        label: "Tarifi",   external: true,  onClick: () => track(shop.id, "directions_click", { source: "sticky" }) },
  ].filter(Boolean);

  return (
    <div
      className="md:hidden"
      style={{
        position: "fixed",
        left: 0, right: 0, bottom: 0,
        zIndex: 40,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center",
        gap: "8px", padding: "10px 16px",
        height: "64px", boxSizing: "border-box",
      }}>
        {secondaryActions.map(({ href, Icon, label, external, onClick }) => {
          const inner = (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "3px", color: C.primary,
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.02em",
              minWidth: "44px",
            }}>
              <Icon size={21} strokeWidth={1.75} />
              <span>{label}</span>
            </div>
          );
          return external
            ? <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} onClick={onClick}>{inner}</a>
            : <Link key={label} href={href} style={{ textDecoration: "none" }} onClick={onClick}>{inner}</Link>;
        })}

        <Link
          href={bookHref}
          onClick={() => track(shop.id, "book_click", { source: "sticky" })}
          style={{
            flex: 1, marginLeft: secondaryActions.length ? "4px" : "0",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            height: "44px", borderRadius: "100px",
            background: C.primary, color: "var(--makas-bg)",
            fontSize: "14px", fontWeight: 700, letterSpacing: "0.01em",
            textDecoration: "none",
          }}
        >
          <Calendar size={17} strokeWidth={2} />
          Randevu Al
        </Link>
      </div>
    </div>
  );
}

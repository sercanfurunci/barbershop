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

  return (
    <div
      className="md:hidden"
      style={{
        position: "fixed",
        left: 0, right: 0, bottom: 0,
        zIndex: 40,
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${[wa, tel, map, true].filter(Boolean).length}, 1fr)`,
        height: "62px",
      }}>
        {wa && (
          <BarBtn href={wa} Icon={MessageCircle} label="WhatsApp" external
            onClick={() => track(shop.id, "whatsapp_click", { source: "sticky" })} />
        )}
        {tel && (
          <BarBtn href={tel} Icon={Phone} label="Ara"
            onClick={() => track(shop.id, "call_click", { source: "sticky" })} />
        )}
        {map && (
          <BarBtn href={map} Icon={MapPin} label="Yol Tarifi" external
            onClick={() => track(shop.id, "directions_click", { source: "sticky" })} />
        )}
        <BarBtn href={bookHref} Icon={Calendar} label="Randevu" primary
          onClick={() => track(shop.id, "book_click", { source: "sticky" })} />
      </div>
    </div>
  );
}

function BarBtn({ href, Icon, label, external, primary, onClick }) {
  const cls = `makas-bar-btn${primary ? " is-primary" : ""}`;
  const inner = (
    <div className={cls} style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "2px", height: "100%",
      background: primary ? C.primary : "transparent",
      color: primary ? "#fff" : C.primary,
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.02em",
    }}>
      <Icon size={18} />
      <span>{label}</span>
    </div>
  );
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", height: "100%" }} onClick={onClick}>{inner}</a>;
  return <Link href={href} style={{ textDecoration: "none", display: "block", height: "100%" }} onClick={onClick}>{inner}</Link>;
}

"use client";

// Mobile-only sticky bottom bar. The shop page already reserves bottom safe-area
// padding (paddingBottom: 72px) so this won't cover content.
//
// ponytail: hidden on md+ via CSS — desktop has the regular CTAs in Hero/SalonInfo.

import Link from "next/link";
import { Phone, MessageCircle, MapPin, Calendar } from "lucide-react";

const C = {
  card:    "#FFFFFF",
  border:  "#E5DED3",
  primary: "#111111",
  muted:   "#8A8480",
};

function waHref(num) {
  if (!num) return null;
  const digits = String(num).replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.startsWith("90") ? digits : "90" + digits.replace(/^0/, "")}`;
}

export default function StickyActionBar({ shop }) {
  if (!shop) return null;
  const phone   = shop.phone;
  const address = shop.address;
  const wa      = waHref(phone);
  const map     = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
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
        gridTemplateColumns: `repeat(${[wa, phone, map, true].filter(Boolean).length}, 1fr)`,
        height: "62px",
      }}>
        {wa && (
          <BarBtn href={wa} Icon={MessageCircle} label="WhatsApp" external />
        )}
        {phone && (
          <BarBtn href={`tel:${phone}`} Icon={Phone} label="Ara" />
        )}
        {map && (
          <BarBtn href={map} Icon={MapPin} label="Yol Tarifi" external />
        )}
        <BarBtn href={bookHref} Icon={Calendar} label="Randevu" primary />
      </div>
    </div>
  );
}

function BarBtn({ href, Icon, label, external, primary }) {
  const inner = (
    <div style={{
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
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{inner}</a>;
  return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>;
}

"use client";

// MiniMap — 240px-tall Leaflet/OSM map centered on the salon.
// Single non-draggable marker. Below the map: directions, copy-address,
// and share buttons. Supports Apple Maps on iOS/macOS for directions.

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Copy, Share2, Maximize2 } from "lucide-react";

const MiniLeafletMap = dynamic(() => import("@/components/map/MiniLeafletMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center",
      color: "#9ca3af", flexDirection: "column", gap: 6,
    }}>
      <MapPin size={24} />
      <span style={{ fontSize: 12 }}>Harita yükleniyor…</span>
    </div>
  ),
});

function getNavigationUrl(lat, lng) {
  const platform = typeof navigator !== "undefined" ? navigator.platform || "" : "";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isApple =
    platform.includes("iPhone") ||
    platform.includes("iPad") ||
    platform.includes("iPod") ||
    (platform.includes("Mac") && ua.includes("Mac"));
  if (isApple) return `maps://?daddr=${lat},${lng}&dirflg=d`;
  const isAndroid = ua.includes("Android");
  if (isAndroid) return `geo:${lat},${lng}?q=${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export default function MiniMap({ shop }) {
  const [copied, setCopied] = useState(false);

  const lat = shop?.latitude;
  const lng = shop?.longitude;

  if (!lat || !lng) return null;

  const navigationUrl = getNavigationUrl(lat, lng);
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const displayAddress = shop.formattedAddress || shop.addressLine || shop.address || "";

  async function copyAddress() {
    if (!displayAddress) return;
    try {
      await navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name,
          text: displayAddress || shop.name,
          url: googleMapsUrl,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(googleMapsUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  }

  const btnStyle = {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 4px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 10,
    border: "1px solid var(--makas-border, #e5e5e5)",
    background: "var(--makas-surface, #f4f4f4)",
    color: "var(--makas-ink, #111)",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Map */}
      <div
        style={{
          height: 240,
          borderRadius: 14,
          overflow: "hidden",
          background: "#e5e5e5",
          position: "relative",
        }}
      >
        <MiniLeafletMap lat={lat} lng={lng} logo={shop.logo} name={shop.name} />
        {/* Open in full map overlay */}
        <a
          href={osmUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Haritada aç"
          style={{
            position: "absolute", top: 8, right: 8, zIndex: 500,
            width: 32, height: 32,
            background: "rgba(255,255,255,0.92)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
            color: "#111",
            textDecoration: "none",
          }}
        >
          <Maximize2 size={15} />
        </a>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <a href={navigationUrl} target="_blank" rel="noopener noreferrer" style={btnStyle}>
          <Navigation size={14} /> Yol Tarifi
        </a>
        <button type="button" onClick={copyAddress} style={btnStyle}>
          <Copy size={14} /> {copied ? "Kopyalandı" : "Adresi Kopyala"}
        </button>
        <button type="button" onClick={share} style={btnStyle}>
          <Share2 size={14} /> Paylaş
        </button>
      </div>
    </div>
  );
}

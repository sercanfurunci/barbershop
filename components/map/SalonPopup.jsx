"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MapPin, Navigation, Clock, Share2 } from "lucide-react";
import { haversine, fmtDistance } from "@/lib/geo";

function directionsUrl(lat, lng) {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  return isIOS
    ? `https://maps.apple.com/?daddr=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

const TR_MONTHS_SHORT = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function fmtFirstAvail(date, time) {
  const trNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const todayStr    = trNow.toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 3 * 60 * 60 * 1000 + 86400000).toISOString().slice(0, 10);
  const d = new Date(date + "T12:00:00");
  const prefix = date === todayStr ? "Bugün" : date === tomorrowStr ? "Yarın" : `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]}`;
  return `${prefix} ${time}`;
}

export default function SalonPopup({ salon, userLoc = null }) {
  const [fa, setFa] = useState(undefined);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(`/api/shops/first-available?shopId=${salon.id}`)
      .then(r => r.json())
      .then(d => { if (alive) setFa(d.date ? d : null); })
      .catch(() => { if (alive) setFa(null); });
    return () => { alive = false; };
  }, [salon.id]);

  const img = salon.coverImage || (Array.isArray(salon.gallery) && salon.gallery[0]) || salon.logo;
  const rating = salon.avgRating ? Number(salon.avgRating).toFixed(1) : null;
  const address = salon.formattedAddress || [salon.addressLine, salon.city].filter(Boolean).join(", ");
  const dist = (userLoc && salon.latitude != null && salon.longitude != null)
    ? fmtDistance(haversine(userLoc.lat, userLoc.lng, salon.latitude, salon.longitude))
    : null;
  const prices = salon.services?.map(s => s.price).filter(p => p > 0) ?? [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;

  // Mobile: tighter values to reveal more map underneath
  const W   = isMobile ? 230 : 260;
  const IMG = isMobile ? 85  : 110;
  const GAP = isMobile ? 5   : 8;   // marginBottom under image
  const ROW = isMobile ? 3   : 4;   // marginTop between rows
  const BTN_PRIMARY   = isMobile ? "7px 0" : "9px 0";
  const BTN_SECONDARY = isMobile ? "5px 0" : "7px 0";
  const BTN_RADIUS    = isMobile ? 8 : 10;
  const BTN_FS        = isMobile ? 12 : 13;
  const SECONDARY_FS  = isMobile ? 11 : 11;

  return (
    <div style={{ width: W }}>
      {/* Image */}
      <div style={{ position: "relative", width: "100%", height: IMG, borderRadius: BTN_RADIUS, overflow: "hidden", background: "#f4f4f4", marginBottom: GAP }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={salon.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111", color: "#fff", fontSize: 28, fontWeight: 700 }}>
            {salon.name[0]}
          </div>
        )}
        {typeof salon.openNow === "boolean" && (
          <span style={{
            position: "absolute", top: 6, left: 6,
            padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: salon.openNow ? "rgba(16,163,74,0.92)" : "rgba(255,255,255,0.9)",
            color: salon.openNow ? "#fff" : "#6b7280",
          }}>
            {salon.openNow ? "Açık" : "Kapalı"}
          </span>
        )}
      </div>

      {/* Name */}
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{salon.name}</p>

      {/* Rating */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: ROW, minHeight: 16 }}>
        {rating ? (
          <>
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{rating}</span>
            {salon.totalReviews ? <span style={{ fontSize: SECONDARY_FS, color: "#6b7280" }}>({salon.totalReviews} yorum)</span> : null}
          </>
        ) : (
          <span style={{ fontSize: SECONDARY_FS, color: "#9ca3af" }}>Henüz değerlendirme yok</span>
        )}
      </div>

      {/* Hours */}
      {(salon.todayHours != null || typeof salon.openNow === "boolean") && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: ROW }}>
          <Clock size={11} color="#6b7280" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: SECONDARY_FS, color: "#374151" }}>
            {salon.todayHours ? `Bugün ${salon.todayHours}` : "Bugün kapalı"}
          </span>
        </div>
      )}

      {/* Address */}
      {address && (
        <div style={{ display: "flex", gap: 5, marginTop: ROW }}>
          <MapPin size={11} color="#6b7280" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{
            fontSize: SECONDARY_FS, color: "#6b7280", lineHeight: 1.35,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {address}
          </span>
        </div>
      )}

      {/* Distance */}
      {dist && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: ROW }}>
          <Navigation size={10} color="#6b7280" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: SECONDARY_FS, color: "#374151", fontWeight: 500 }}>{dist} uzaklıkta</span>
        </div>
      )}

      {/* First available */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: ROW + 1, minHeight: 15 }}>
        {fa === undefined ? (
          <span style={{ fontSize: SECONDARY_FS, color: "#9ca3af" }}>Kontrol ediliyor…</span>
        ) : fa ? (
          <>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
            <span style={{ fontSize: SECONDARY_FS, fontWeight: 600, color: "#16a34a" }}>İlk müsait: {fmtFirstAvail(fa.date, fa.time)}</span>
          </>
        ) : (
          <span style={{ fontSize: SECONDARY_FS, color: "#9ca3af" }}>Müsait randevu yok</span>
        )}
      </div>

      {/* Price */}
      {minPrice && (
        <p style={{ margin: `${ROW}px 0 0`, fontSize: 12, color: "#111", fontWeight: 600 }}>
          {minPrice.toLocaleString("tr-TR")} ₺ <span style={{ color: "#6b7280", fontWeight: 400 }}>başlayan</span>
        </p>
      )}

      {/* Primary CTA */}
      <Link
        href={`/${salon.slug}`}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: isMobile ? 8 : 10, padding: BTN_PRIMARY,
          background: "#111", color: "#fff",
          borderRadius: BTN_RADIUS, fontSize: BTN_FS, fontWeight: 600, textDecoration: "none",
        }}
      >
        Randevu Al
      </Link>

      {/* Secondary: Directions + Share */}
      <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
        {salon.latitude != null && salon.longitude != null && (
          <a
            href={directionsUrl(salon.latitude, salon.longitude)}
            target="_blank" rel="noopener noreferrer"
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: BTN_SECONDARY, borderRadius: BTN_RADIUS, border: "1px solid #e5e7eb",
              fontSize: 12, fontWeight: 600, color: "#111", textDecoration: "none", background: "#fff",
            }}
          >
            <Navigation size={11} /> Yol Tarifi
          </a>
        )}
        <button
          type="button"
          onClick={async () => {
            const url = `${window.location.origin}/${salon.slug}`;
            try {
              if (navigator.share) await navigator.share({ title: salon.name, url });
              else await navigator.clipboard.writeText(url);
            } catch { /* cancelled */ }
          }}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: BTN_SECONDARY, borderRadius: BTN_RADIUS, border: "1px solid #e5e7eb",
            fontSize: 12, fontWeight: 600, color: "#111", cursor: "pointer", background: "#fff",
          }}
        >
          <Share2 size={11} /> Paylaş
        </button>
      </div>
    </div>
  );
}

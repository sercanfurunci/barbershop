"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MapPin, Navigation, Clock, Share2 } from "lucide-react";
import { haversine, fmtDistance } from "@/lib/geo";

// Apple Maps on iOS, Google Maps elsewhere. (Yandex skipped — no reliable detection.)
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

// Popup body shown when a salon marker is clicked/selected.
// Fetches first-available lazily — only when the popup is actually rendered.
export default function SalonPopup({ salon, userLoc = null }) {
  const [fa, setFa] = useState(undefined); // undefined=loading, null=none

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

  return (
    <div style={{ width: 260 }}>
      {/* 1. Image */}
      <div style={{ position: "relative", width: "100%", height: 110, borderRadius: 10, overflow: "hidden", background: "#f4f4f4", marginBottom: 8 }}>
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

      {/* 2. Name */}
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{salon.name}</p>

      {/* 3. Rating + review count */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, minHeight: 16 }}>
        {rating ? (
          <>
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{rating}</span>
            {salon.totalReviews ? <span style={{ fontSize: 11, color: "#6b7280" }}>({salon.totalReviews} yorum)</span> : null}
          </>
        ) : (
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Henüz değerlendirme yok</span>
        )}
      </div>

      {/* 4+5. Open/Closed + today's hours */}
      {salon.todayHours != null || typeof salon.openNow === "boolean" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
          <Clock size={11} color="#6b7280" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#374151" }}>
            {salon.todayHours ? `Bugün ${salon.todayHours}` : "Bugün kapalı"}
          </span>
        </div>
      ) : null}

      {/* 6. Address — clamp at two lines */}
      {address && (
        <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
          <MapPin size={11} color="#6b7280" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{
            fontSize: 11, color: "#6b7280", lineHeight: 1.35,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {address}
          </span>
        </div>
      )}

      {/* 7. Distance */}
      {dist && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
          <Navigation size={10} color="#6b7280" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#374151", fontWeight: 500 }}>{dist} uzaklıkta</span>
        </div>
      )}

      {/* 8. First available */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, minHeight: 15 }}>
        {fa === undefined ? (
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Kontrol ediliyor…</span>
        ) : fa ? (
          <>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a" }}>İlk müsait: {fmtFirstAvail(fa.date, fa.time)}</span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Müsait randevu yok</span>
        )}
      </div>

      {/* 9. Starting price */}
      {minPrice && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#111", fontWeight: 600 }}>
          {minPrice.toLocaleString("tr-TR")} ₺ <span style={{ color: "#6b7280", fontWeight: 400 }}>başlayan fiyatlarla</span>
        </p>
      )}

      {/* 10. Actions — view/book + directions + share */}
      <Link
        href={`/${salon.slug}`}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: 10, padding: "9px 0",
          background: "#111", color: "#fff",
          borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none",
        }}
      >
        Randevu Al
      </Link>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {salon.latitude != null && salon.longitude != null && (
          <a
            href={directionsUrl(salon.latitude, salon.longitude)}
            target="_blank" rel="noopener noreferrer"
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "7px 0", borderRadius: 10, border: "1px solid #e5e7eb",
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
            padding: "7px 0", borderRadius: 10, border: "1px solid #e5e7eb",
            fontSize: 12, fontWeight: 600, color: "#111", cursor: "pointer", background: "#fff",
          }}
        >
          <Share2 size={11} /> Paylaş
        </button>
      </div>
    </div>
  );
}

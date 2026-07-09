"use client";

// Rich salon card for the mobile map bottom sheet.
// Cover image + logo + rating + distance + open/closed + price + availability,
// plus action row: favorite / share / call / navigate / reserve.

import { memo, useState } from "react";
import Link from "next/link";
import { Scissors, Star, MapPin, Navigation, Heart, Share2, Phone } from "lucide-react";
import { haversine, fmtDistance } from "@/lib/geo";
import { useFirstAvailable, fmtFirstAvail } from "./useFirstAvailable";

function ActionBtn({ children, onClick, href, label, active }) {
  const cls = `w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
    active ? "border-red-300 bg-red-50 text-red-500" : "border-border bg-card text-foreground/70 hover:text-foreground"
  }`;
  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()} aria-label={label} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick?.(); }} aria-label={label} className={cls}>
      {children}
    </button>
  );
}

function MapSheetCard({ shop, userLoc, isSelected, onSelect, cardRef }) {
  const [favored, setFavored] = useState(false);
  const fa = useFirstAvailable(shop.id);

  const img = shop.coverImage || (Array.isArray(shop.gallery) && shop.gallery[0]);
  const locationStr = [shop.addressLine, shop.city].filter(Boolean).join(", ");
  const dist = (userLoc && shop.latitude && shop.longitude)
    ? fmtDistance(haversine(userLoc.lat, userLoc.lng, shop.latitude, shop.longitude))
    : null;
  const prices = shop.services?.map(s => s.price).filter(p => p > 0) ?? [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;

  const navUrl = (shop.latitude && shop.longitude)
    ? `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`
    : null;

  async function toggleFavorite() {
    const next = !favored;
    setFavored(next);
    try {
      const res = next
        ? await fetch("/api/customer/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shopId: shop.id }),
          })
        : await fetch(`/api/customer/favorites/${shop.id}`, { method: "DELETE" });
      if (!res.ok) setFavored(!next);
    } catch { setFavored(!next); }
  }

  async function share() {
    const url = `${window.location.origin}/${shop.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: shop.name, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* cancelled */ }
  }

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect?.(shop)}
      className={`flex flex-col rounded-[14px] border bg-card overflow-hidden cursor-pointer transition-all ${
        isSelected ? "border-foreground ring-2 ring-foreground makas-card-glow" : "border-border"
      }`}
      style={{ scrollMarginTop: 12, height: 240 }}
    >
      {/* Cover — 120px tall */}
      <div className="relative shrink-0 bg-secondary" style={{ height: 120 }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={shop.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors size={22} className="text-muted-foreground/30" />
          </div>
        )}
        {typeof shop.openNow === "boolean" && (
          <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
            shop.openNow ? "bg-emerald-500/90 text-white" : "bg-background/85 text-muted-foreground"
          }`}>
            {shop.openNow ? "Açık" : "Kapalı"}
          </span>
        )}
        {shop.avgRating ? (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-sm">
            <Star size={10} strokeWidth={2.5} className="text-amber-500" />
            {Number(shop.avgRating).toFixed(1)}
            {shop.totalReviews ? <span className="text-muted-foreground font-normal">({shop.totalReviews})</span> : null}
          </span>
        ) : null}
        {shop.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logo} alt="" className="absolute -bottom-3 left-3 w-8 h-8 rounded-full border-2 border-background object-cover bg-card shadow" />
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-3 pb-2 min-h-0" style={{ paddingTop: shop.logo ? 16 : 10 }}>
        <p className="shrink-0 font-semibold text-foreground text-[15px] leading-snug line-clamp-1">{shop.name}</p>

        {/* Address + distance */}
        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground shrink-0">
          {locationStr && (
            <>
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{locationStr}</span>
            </>
          )}
          {dist && (
            <span className="flex items-center gap-0.5 shrink-0 ml-auto">
              <Navigation size={9} />{dist}
            </span>
          )}
        </div>

        {/* Price + availability on one line */}
        <div className="mt-0.5 flex items-center gap-2 text-[12px] shrink-0 flex-wrap">
          {minPrice ? (
            <span className="text-foreground font-medium">
              {minPrice.toLocaleString("tr-TR")} ₺ <span className="text-muted-foreground font-normal">başlayan</span>
            </span>
          ) : (
            <span className="text-muted-foreground/50">Fiyat bilgisi yok</span>
          )}
          {fa === undefined ? null : fa ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium ml-auto shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {fmtFirstAvail(fa.date, fa.time)}
            </span>
          ) : (
            <span className="text-muted-foreground/50 ml-auto shrink-0">Müsait yok</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto pt-2 flex items-center gap-1.5">
          <ActionBtn onClick={toggleFavorite} label="Favorilere ekle" active={favored}>
            <Heart size={14} fill={favored ? "currentColor" : "none"} />
          </ActionBtn>
          <ActionBtn onClick={share} label="Paylaş"><Share2 size={14} /></ActionBtn>
          {shop.phone && (
            <ActionBtn href={`tel:${shop.phone}`} label="Ara"><Phone size={14} /></ActionBtn>
          )}
          {navUrl && (
            <ActionBtn href={navUrl} label="Yol tarifi"><Navigation size={14} /></ActionBtn>
          )}
          <Link
            href={`/${shop.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto whitespace-nowrap rounded-full bg-foreground text-background px-4 h-[38px] flex items-center text-[13px] font-semibold no-underline hover:opacity-90 transition-opacity shrink-0"
          >
            Randevu Al
          </Link>
        </div>
      </div>
    </div>
  );
}

export default memo(MapSheetCard, (prev, next) =>
  prev.shop === next.shop &&
  prev.isSelected === next.isSelected &&
  prev.userLoc === next.userLoc &&
  prev.onSelect === next.onSelect &&
  prev.cardRef === next.cardRef
);

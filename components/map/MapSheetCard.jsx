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
  const cls = `w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
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
    // ponytail: optimistic toggle; 401 (not logged in) silently reverts
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
      className={`flex flex-col rounded-[16px] border bg-card overflow-hidden cursor-pointer transition-all ${
        isSelected ? "border-foreground ring-2 ring-foreground makas-card-glow" : "border-border"
      }`}
      style={{ scrollMarginTop: 12, height: 300 }}
    >
      {/* Cover */}
      <div className="relative h-32 shrink-0 bg-secondary">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={shop.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors size={26} className="text-muted-foreground/30" />
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
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground backdrop-blur-sm">
            <Star size={11} strokeWidth={2.5} className="text-amber-500" />
            {Number(shop.avgRating).toFixed(1)}
            {shop.totalReviews ? <span className="text-muted-foreground font-normal">({shop.totalReviews})</span> : null}
          </span>
        ) : null}
        {shop.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logo} alt="" className="absolute -bottom-5 left-3 w-12 h-12 rounded-full border-2 border-background object-cover bg-card shadow-md" />
        )}
      </div>

      {/* Body — rows reserve height so every card is identical even with missing data */}
      <div className="flex flex-col flex-1 px-4 pb-4 pt-7 min-h-0">
        <p className="shrink-0 font-semibold text-foreground text-[16px] leading-snug line-clamp-1">{shop.name}</p>

        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground shrink-0" style={{ minHeight: "1.25rem" }}>
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

        <div className="mt-1.5 flex items-center gap-3 text-[13px] shrink-0" style={{ minHeight: "1.25rem" }}>
          {minPrice ? (
            <span className="text-foreground font-medium">{minPrice.toLocaleString("tr-TR")} ₺ <span className="text-muted-foreground font-normal">başlayan</span></span>
          ) : (
            <span className="text-muted-foreground/50">Fiyat bilgisi yok</span>
          )}
          {fa === undefined ? (
            <span className="text-muted-foreground/40">Kontrol ediliyor…</span>
          ) : fa ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {fmtFirstAvail(fa.date, fa.time)}
            </span>
          ) : (
            <span className="text-muted-foreground/50">Müsait randevu yok</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto pt-3 flex items-center gap-2">
          <ActionBtn onClick={toggleFavorite} label="Favorilere ekle" active={favored}>
            <Heart size={16} fill={favored ? "currentColor" : "none"} />
          </ActionBtn>
          <ActionBtn onClick={share} label="Paylaş"><Share2 size={16} /></ActionBtn>
          {shop.phone && (
            <ActionBtn href={`tel:${shop.phone}`} label="Ara"><Phone size={16} /></ActionBtn>
          )}
          {navUrl && (
            <ActionBtn href={navUrl} label="Yol tarifi"><Navigation size={16} /></ActionBtn>
          )}
          <Link
            href={`/${shop.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto whitespace-nowrap rounded-full bg-foreground text-background px-4 py-2.5 text-[13px] font-semibold no-underline hover:opacity-90 transition-opacity"
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

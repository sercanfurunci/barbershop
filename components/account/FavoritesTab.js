"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star, MapPin, Phone, X, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Sk, EmptyState, ease } from "./shared";

function FavSalonCard({ shopId, shop, onRemove }) {
  return (
    <div className="group rounded-[16px] border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
      style={{ boxShadow: "var(--shadow-card)" }}>
      {/* Cover */}
      <div className="relative h-36 bg-secondary overflow-hidden">
        {shop?.coverImage
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center"><Scissors size={24} className="text-muted-foreground/25" /></div>
        }
        <button onClick={() => onRemove(shopId)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(17,17,17,0.65)" }}>
          <X size={13} className="text-white" />
        </button>
        {shop?.logo && (
          <div className="absolute bottom-2 left-3 w-9 h-9 rounded-[8px] border-2 border-white overflow-hidden bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shop.logo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-[15px] text-foreground leading-snug line-clamp-1">{shop?.name}</p>
        {shop?.googleRating != null && (
          <div className="flex items-center gap-1.5 mt-1">
            <Star size={11} fill="#f59e0b" color="#f59e0b" strokeWidth={0} />
            <span className="text-[13px] font-semibold">{Number(shop.googleRating).toFixed(1)}</span>
            {shop?.googleTotalRatings && <span className="text-[12px] text-muted-foreground">({shop.googleTotalRatings})</span>}
          </div>
        )}
        {(shop?.addressLine || shop?.city) && (
          <p className="flex items-center gap-1 mt-1.5 text-[12px] text-muted-foreground line-clamp-1">
            <MapPin size={10} className="shrink-0" />
            {[shop.addressLine, shop.city].filter(Boolean).join(", ")}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          {shop?.slug && (
            <Link href={`/${shop.slug}`}
              className="flex-1 h-9 rounded-full bg-foreground text-background text-[13px] font-semibold flex items-center justify-center no-underline hover:opacity-90 transition-opacity">
              Randevu Al
            </Link>
          )}
          {shop?.phone && (
            <a href={`tel:${shop.phone}`}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors no-underline">
              <Phone size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FavoritesTab() {
  const [favs, setFavs] = useState(null);

  useEffect(() => {
    fetch("/api/customer/favorites")
      .then(r => r.json())
      .then(d => setFavs(Array.isArray(d) ? d : []))
      .catch(() => setFavs([]));
  }, []);

  async function remove(shopId) {
    const res = await fetch(`/api/customer/favorites/${shopId}`, { method: "DELETE" });
    if (res.ok) { setFavs(prev => prev.filter(f => f.shopId !== shopId)); toast.success("Favorilerden kaldırıldı"); }
    else toast.error("Kaldırılamadı");
  }

  if (favs === null) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-[16px] border border-border bg-card overflow-hidden animate-pulse">
            <Sk className="h-36 rounded-none" />
            <div className="p-4 space-y-2">
              <Sk className="h-4 w-36" />
              <Sk className="h-3 w-24" />
              <Sk className="h-9 w-full rounded-full mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (favs.length === 0) {
    return (
      <EmptyState icon={Heart} title="Favori salonunuz yok"
        sub="Beğendiğiniz salonları favorilere ekleyerek hızla bulun."
        action={<Link href="/salons" className="inline-flex h-11 items-center px-6 rounded-full bg-foreground text-background text-[13px] font-semibold no-underline hover:opacity-90 transition-opacity">Keşfet</Link>}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-[22px] tracking-tight text-foreground">Favori Salonlar</h2>
        <span className="text-[13px] text-muted-foreground">{favs.length} salon</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {favs.map(({ shopId, shop }, i) => (
          <motion.div key={shopId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: Math.min(i * 0.05, 0.3), ease }}>
            <FavSalonCard shopId={shopId} shop={shop} onRemove={remove} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

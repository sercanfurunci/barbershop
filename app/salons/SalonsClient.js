"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Scissors, Star, Search, X, ChevronDown, MapPin, SlidersHorizontal, Map, List, Navigation, Wifi, ParkingCircle, CreditCard, Wind, Accessibility, Baby, Tag } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { haversine, fmtDistance, sortByDistance } from "@/lib/geo";
import { useFirstAvailable, fmtFirstAvail } from "@/components/map/useFirstAvailable";
import MapBottomSheet from "@/components/map/MapBottomSheet";
import MapSheetCard from "@/components/map/MapSheetCard";
import { Sheet } from "@/components/landing/MobileNav";

// Leaflet touches `window` at import time — client-only load
const SalonMap = dynamic(() => import("@/components/map/SalonMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-secondary">
      <span className="text-muted-foreground text-sm">Harita yükleniyor…</span>
    </div>
  ),
});

const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Kocaeli"];
const POPULAR_SEARCHES = ["Saç Kesimi", "Sakal Düzeltme", "Erkek Berberi", "Kadın Kuaförü", "Keratin", "Boya", "Fön"];
const RATINGS = [
  { label: "4.5+", value: 4.5 },
  { label: "4+",   value: 4 },
];
const SORTS = [
  { label: "En Popüler",              value: "popular" },
  { label: "En Yüksek Puan",         value: "rating" },
  { label: "En Çok Değerlendirilen", value: "mostReviewed" },
  { label: "Yeni Katılanlar",         value: "newest" },
  { label: "Yakınımdakiler",          value: "nearby" },
  { label: "A-Z",                     value: "alpha" },
];

const AMENITY_CHIPS = [
  { key: "wifi",            label: "WiFi",           Icon: Wifi },
  { key: "parking",         label: "Otopark",         Icon: ParkingCircle },
  { key: "creditCard",      label: "Kredi Kartı",     Icon: CreditCard },
  { key: "airConditioning", label: "Klima",           Icon: Wind },
  { key: "disabledAccess",  label: "Engelli Erişim",  Icon: Accessibility },
  { key: "childFriendly",   label: "Çocuk Dostu",     Icon: Baby },
  { key: "hasPromotions",   label: "Kampanyalar",     Icon: Tag },
];
const SHOP_TYPES = [
  { label: "Tümü",   value: "" },
  { label: "Erkek",  value: "male" },
  { label: "Kadın",  value: "female" },
  { label: "Unisex", value: "unisex" },
];
const TAKE = 12;

// ─── Status badge ────────────────────────────────────────────────────────────

// Only real, hours-derived states: Kapalı / Yakında Kapanıyor (≤45 min to close).
// No occupancy labels until a real occupancy algorithm ships.
function StatusPill({ shop }) {
  const base = "shrink-0 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full border";
  if (shop.openNow === false) {
    return <span className={`${base} bg-secondary text-muted-foreground border-border`}>Kapalı</span>;
  }
  if (shop.openNow && shop.todayHours) {
    const end = shop.todayHours.split(" - ")[1];
    if (end) {
      const [h, m] = end.split(":").map(Number);
      const trNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const minsLeft = h * 60 + m - (trNow.getUTCHours() * 60 + trNow.getUTCMinutes());
      if (minsLeft > 0 && minsLeft <= 45) {
        return <span className={`${base} bg-orange-50 text-orange-700 border-orange-200`}>Yakında Kapanıyor</span>;
      }
    }
  }
  return null;
}

// ─── Salon card ───────────────────────────────────────────────────────────────

// Card height is fixed so all cards look identical regardless of data.
const CARD_H = 380;
const IMG_H  = 160; // px, must match h-40

// Memoized so hover/selection state changes only re-render the card wrappers
const SalonCard = memo(function SalonCard({ shop, userLoc }) {
  const img = shop.coverImage || (Array.isArray(shop.gallery) && shop.gallery[0]);
  const locationStr = [shop.addressLine, shop.city].filter(Boolean).join(", ");
  const dist = (userLoc && shop.latitude && shop.longitude)
    ? fmtDistance(haversine(userLoc.lat, userLoc.lng, shop.latitude, shop.longitude))
    : null;
  const fa = useFirstAvailable(shop.id);

  const prices = shop.services?.map(s => s.price).filter(p => p > 0) ?? [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;

  const shopTypeLabel =
    shop.shopType === "male"   ? "Erkek" :
    shop.shopType === "female" ? "Kadın" :
    shop.shopType === "child"  ? "Çocuk" :
    shop.shopType === "unisex" ? "Unisex" : null;

  return (
    <Link
      href={`/${shop.slug}`}
      className="group flex flex-col rounded-[16px] border border-border bg-card overflow-hidden no-underline hover:border-foreground/20 hover:shadow-md transition-all duration-200"
      style={{ height: CARD_H, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* ── Image ── */}
      <div className="relative shrink-0 bg-secondary overflow-hidden" style={{ height: IMG_H }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {shop.logo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={shop.logo} alt="" className="w-16 h-16 object-contain opacity-30" loading="lazy" />
              : <Scissors size={28} className="text-muted-foreground/30" />}
          </div>
        )}
        {shop.avgRating ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground backdrop-blur-sm">
            <Star size={11} strokeWidth={2.5} className="text-amber-500" />
            {Number(shop.avgRating).toFixed(1)}
            {shop.totalReviews ? <span className="text-muted-foreground font-normal">({shop.totalReviews})</span> : null}
          </div>
        ) : null}
        {shopTypeLabel ? (
          <div className="absolute top-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
            {shopTypeLabel}
          </div>
        ) : null}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 min-h-0">

        {/* Title (max 2 lines) + status */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-foreground text-[15px] leading-snug line-clamp-2 flex-1" style={{ minHeight: "2.5rem" }}>
            {shop.name}
          </p>
          <StatusPill shop={shop} />
        </div>

        {/* Address (max 1 line) */}
        <div className="flex items-center gap-1.5 mt-1.5" style={{ minHeight: "1.25rem" }}>
          {locationStr ? (
            <>
              <MapPin size={10} className="shrink-0 text-muted-foreground" />
              <p className="text-[12px] text-muted-foreground truncate flex-1">{locationStr}</p>
            </>
          ) : <span className="text-[12px] text-transparent select-none">—</span>}
          {dist && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 shrink-0">
              <Navigation size={9} />{dist}
            </span>
          )}
        </div>

        {/* Services (max 3 chips) */}
        <div className="mt-2 flex items-center gap-1 overflow-hidden" style={{ minHeight: "1.5rem" }}>
          {shop.services?.length > 0 ? (
            <>
              {shop.services.slice(0, 3).map((s) => (
                <span key={s.id} className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{s.nameTr}</span>
              ))}
              {shop.services.length > 3 && (
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">+{shop.services.length - 3}</span>
              )}
            </>
          ) : (
            <span className="text-[11px] text-transparent select-none">—</span>
          )}
        </div>

        {/* Spacer pushes footer items to the bottom */}
        <div className="flex-1" />

        {/* Rating */}
        <div className="flex items-center gap-1" style={{ minHeight: "1.25rem" }}>
          {shop.avgRating ? (
            <>
              <Star size={11} strokeWidth={2.5} className="text-amber-500" />
              <span className="text-[12px] font-semibold text-foreground">{Number(shop.avgRating).toFixed(1)}</span>
              {shop.totalReviews ? <span className="text-[11px] text-muted-foreground">({shop.totalReviews} yorum)</span> : null}
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground/50">Henüz değerlendirme yok</span>
          )}
        </div>

        {/* Price */}
        <div className="mt-1" style={{ minHeight: "1.25rem" }}>
          {minPrice ? (
            <span className="text-[12px] text-foreground font-medium">
              {minPrice.toLocaleString("tr-TR")} ₺ <span className="text-muted-foreground font-normal">başlayan</span>
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/50">Fiyat bilgisi yok</span>
          )}
        </div>

        {/* Availability */}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium" style={{ minHeight: "1.25rem" }}>
          {fa === undefined ? (
            <span className="text-muted-foreground/40">Kontrol ediliyor…</span>
          ) : fa ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-emerald-600">İlk müsait: {fmtFirstAvail(fa.date, fa.time)}</span>
            </>
          ) : (
            <span className="text-muted-foreground/50">Müsait randevu yok</span>
          )}
        </div>
      </div>
    </Link>
  );
});

function SalonCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[16px] border border-border bg-card overflow-hidden animate-pulse" style={{ height: CARD_H }}>
      <div className="shrink-0 bg-secondary" style={{ height: IMG_H }} />
      <div className="p-4 space-y-2 flex-1">
        <div className="h-4 bg-secondary rounded w-2/3" />
        <div className="h-3 bg-secondary rounded w-1/3" />
        <div className="flex gap-1 mt-2"><div className="h-5 bg-secondary rounded-full w-16" /><div className="h-5 bg-secondary rounded-full w-14" /></div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SalonsClient({
  initialShops, initialTotal,
  initialQ, initialCity, initialDistrict, initialSort,
  initialShopType, initialService, initialMinRating, initialOpenNow,
}) {
  const router = useRouter();

  const [search,    setSearch]    = useState(initialQ         || "");
  const [city,      setCity]      = useState(initialCity      || "");
  const [district,  setDistrict]  = useState(initialDistrict  || "");
  const [sort,      setSort]      = useState(initialSort      || "popular");
  const [shopType,  setShopType]  = useState(initialShopType  || "");
  const [service,   setService]   = useState(initialService   || "");
  const [minRating, setMinRating] = useState(initialMinRating || 0);
  const [openNow,   setOpenNow]   = useState(initialOpenNow   || false);

  const [shops,   setShops]   = useState(initialShops || []);
  const [total,   setTotal]   = useState(initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [skip,    setSkip]    = useState(0);
  const [hasMore, setHasMore] = useState((initialTotal || 0) > (initialShops?.length || 0));
  const [showMoreFilters, setShowMoreFilters] = useState(
    !!(initialDistrict || initialService || initialMinRating > 0)
  );
  const [viewMode, setViewMode] = useState("list");
  const [userLoc,  setUserLoc]  = useState(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [geoBannerDismissed, setGeoBannerDismissed] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [fitToken, setFitToken] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [amenities, setAmenities] = useState({});
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [hoveredShopId, setHoveredShopId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSnap, setMobileSnap] = useState(0.45);
  const [showMapFilters, setShowMapFilters] = useState(false);

  const [recentSearches, setRecentSearches] = useState([]);
  const [searchFocused,  setSearchFocused]  = useState(false);

  const debounceRef = useRef(null);
  const urlDebRef   = useRef(null);
  const selectedCardRef = useRef(null);

  const filtersRef = useRef({ search, city, district, sort, shopType, service, minRating, openNow, amenities });
  useEffect(() => {
    filtersRef.current = { search, city, district, sort, shopType, service, minRating, openNow, amenities };
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("makas_recent_searches") || "[]");
      setRecentSearches(Array.isArray(saved) ? saved.slice(0, 6) : []);
    } catch { /* ignore */ }
  }, []);

  const requestLocation = useCallback((onSuccess) => {
    if (!navigator.geolocation) { setGeoDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        setGeoDenied(false);
        onSuccess?.(loc);
      },
      () => setGeoDenied(true)
    );
  }, []);

  useEffect(() => {
    if ((sort === "nearby" || viewMode === "map") && !userLoc && !geoDenied) {
      requestLocation();
    }
  }, [sort, viewMode, userLoc, geoDenied, requestLocation]);

  // Mobile breakpoint (single Leaflet instance: fullscreen map on mobile, sticky column on desktop)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const fn = () => setIsMobile(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  // Lock page scroll behind the fullscreen mobile map
  useEffect(() => {
    if (isMobile && viewMode === "map") {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isMobile, viewMode]);

  // Marker click → highlight card + scroll it into view / center it in the carousel.
  // Slight delay lets the bottom sheet's snap animation settle first.
  useEffect(() => {
    const t = setTimeout(() => {
      selectedCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 350);
    return () => clearTimeout(t);
  }, [selectedShopId, viewMode]);

  const handleSalonSelect = useCallback((salon) => {
    setSelectedShopId(salon.id);
    // Collapsed sheet hides the cards — pop to half so the selected card shows
    setMobileSnap((s) => (s <= 0.1 ? 0.45 : s));
  }, []);

  const handleUserLocate = useCallback((loc) => setUserLoc(loc), []);

  const pushRecentSearch = useCallback((term) => {
    if (!term || term.length < 2) return;
    setRecentSearches((prev) => {
      const next = [term, ...prev.filter((s) => s !== term)].slice(0, 6);
      try { localStorage.setItem("makas_recent_searches", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  function buildApiParams(f, extraSkip = 0) {
    const sp = new URLSearchParams();
    if (f.search.trim())   sp.set("search",    f.search.trim());
    if (f.city)            sp.set("city",      f.city);
    if (f.district.trim()) sp.set("district",  f.district.trim());
    if (f.shopType)        sp.set("shopType",  f.shopType);
    if (f.service.trim())  sp.set("service",   f.service.trim());
    if (f.minRating > 0)   sp.set("minRating", String(f.minRating));
    if (f.openNow)         sp.set("openNow",   "true");
    const apiSort = f.sort === "nearby" ? "popular" : f.sort;
    if (apiSort !== "popular") sp.set("sort", apiSort);
    for (const [k, v] of Object.entries(f.amenities ?? {})) {
      if (v) sp.set(k, "true");
    }
    sp.set("take", String(TAKE));
    sp.set("skip", String(extraSkip));
    return sp;
  }

  useEffect(() => {
    if (urlDebRef.current) clearTimeout(urlDebRef.current);
    urlDebRef.current = setTimeout(() => {
      const f = filtersRef.current;
      const sp = new URLSearchParams();
      if (f.search.trim())      sp.set("q",        f.search.trim());
      if (f.city)               sp.set("city",     f.city);
      if (f.district.trim())    sp.set("district", f.district.trim());
      if (f.shopType)           sp.set("type",     f.shopType);
      if (f.service.trim())     sp.set("service",  f.service.trim());
      if (f.minRating > 0)      sp.set("rating",   String(f.minRating));
      if (f.openNow)            sp.set("open",     "true");
      if (f.sort !== "popular") sp.set("sort",     f.sort);
      const qs = sp.toString();
      router.replace(`/salons${qs ? `?${qs}` : ""}`, { scroll: false });
    }, 600);
    return () => clearTimeout(urlDebRef.current);
  }, [search, city, district, sort, shopType, service, minRating, openNow]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const f = filtersRef.current;
      setSkip(0);
      setLoading(true);
      try {
        const res = await fetch(`/api/shops?${buildApiParams(f, 0)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const rows = data.shops || [];
        setShops(rows);
        setTotal(data.total || 0);
        setHasMore(rows.length < (data.total || 0));
        setFitToken((t) => t + 1); // filter-driven change → map refits
        setFetchError(false);
      } catch { setFetchError(true); /* keep previous rows visible */ }
      finally { setLoading(false); }
      if (f.search.trim().length >= 2) pushRecentSearch(f.search.trim());
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, city, district, sort, shopType, service, minRating, openNow, amenities, retryTick, pushRecentSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    const newSkip = skip + TAKE;
    setSkip(newSkip);
    setLoading(true);
    try {
      const res = await fetch(`/api/shops?${buildApiParams(filtersRef.current, newSkip)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const rows = data.shops || [];
      setShops((prev) => [...prev, ...rows]);
      setHasMore(newSkip + rows.length < (data.total || 0));
    } catch { setFetchError(true); }
    finally { setLoading(false); }
  };

  const clearAll = () => {
    setSearch(""); setCity(""); setDistrict(""); setShopType("");
    setService(""); setMinRating(0); setOpenNow(false); setSort("popular"); setAmenities({});
    setNearbyOnly(false);
  };

  // Nearby quick filter: sort by distance + only salons within 15 km.
  // Composes with all other filters (applied client-side on the fetched rows).
  const toggleNearby = () => {
    if (nearbyOnly) { setNearbyOnly(false); return; }
    const enable = () => { setNearbyOnly(true); setSort("nearby"); };
    if (userLoc) enable();
    else requestLocation(enable);
  };

  // Distance-aware view of the fetched rows — sorting/15km filter happen once here
  const displayShops = useMemo(() => {
    let rows = shops;
    if (userLoc && (sort === "nearby" || nearbyOnly)) {
      rows = sortByDistance(rows, userLoc.lat, userLoc.lng);
    }
    if (nearbyOnly && userLoc) {
      rows = rows.filter((s) =>
        s.latitude != null && s.longitude != null &&
        haversine(userLoc.lat, userLoc.lng, s.latitude, s.longitude) <= 15
      );
    }
    return rows;
  }, [shops, userLoc, sort, nearbyOnly]);

  // "Search this area": fetch salons inside the map bounds — keeps filters,
  // doesn't move the map (fitToken untouched), no page reload.
  const handleSearchArea = useCallback(async (bounds) => {
    const sp = buildApiParams(filtersRef.current, 0);
    sp.set("take", "50");
    for (const [k, v] of Object.entries(bounds)) sp.set(k, String(v));
    setLoading(true);
    try {
      const res = await fetch(`/api/shops?${sp}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShops(data.shops || []);
      setTotal(data.total || 0);
      setHasMore(false);
    } catch { setFetchError(true); }
    finally { setLoading(false); }
  }, []);

  const toggleAmenity = (key) => setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));

  const hasActiveFilters = !!(search || city || district || shopType || service || minRating > 0 || openNow || nearbyOnly || Object.values(amenities).some(Boolean));

  return (
    <div className="min-h-dvh bg-background">
      <LandingNavbar />
      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 sm:py-12">

        {/* Mobile map is a dedicated fullscreen experience — none of the page
            chrome (header, search, filter rows) renders behind it. */}
        {!(isMobile && viewMode === "map") && (<>
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1
              className="font-display font-bold text-foreground"
              style={{ fontSize: "clamp(24px, 4vw, 40px)", letterSpacing: "-1px" }}
            >
              {city
                ? `${city}${district ? `, ${district}` : ""} Salonları`
                : search
                ? `"${search}" Sonuçları`
                : "Salonları Keşfet"}
            </h1>
            {!loading && (
              <p className="mt-1.5 text-muted-foreground text-[14px]">
                {total === 0 ? "Sonuç bulunamadı" : `${total} salon bulundu`}
              </p>
            )}
          </div>

          {/* List / Map toggle — desktop only; mobile has its own row below */}
          <div className="hidden md:flex rounded-full border border-border bg-card overflow-hidden shrink-0">
            {[{ mode: "list", Icon: List, label: "Liste" }, { mode: "map", Icon: Map, label: "Harita" }].map(({ mode, Icon, label }) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                  viewMode === mode ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-[540px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            aria-label="Salon ara"
            placeholder="Salon adı, berber, şehir, hizmet..."
            className="w-full rounded-[14px] border border-border bg-card pl-9 pr-10 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Temizle">
              <X size={15} />
            </button>
          )}

          {searchFocused && !search && (recentSearches.length > 0 || POPULAR_SEARCHES.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-[14px] border border-border bg-card shadow-lg z-20 overflow-hidden">
              {recentSearches.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Son Aramalar</p>
                    <button
                      onMouseDown={() => { setRecentSearches([]); try { localStorage.removeItem("makas_recent_searches"); } catch { /* ignore */ } }}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >Temizle</button>
                  </div>
                  {recentSearches.map((term) => (
                    <button key={`r-${term}`} onMouseDown={() => setSearch(term)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-foreground hover:bg-secondary text-left transition-colors">
                      <Search size={12} className="text-muted-foreground shrink-0" />{term}
                    </button>
                  ))}
                  {POPULAR_SEARCHES.length > 0 && <div className="border-t border-border" />}
                </>
              )}
              {POPULAR_SEARCHES.length > 0 && (
                <>
                  <p className="px-3.5 pt-2.5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Popüler</p>
                  <div className="flex flex-wrap gap-2 px-3.5 pb-3">
                    {POPULAR_SEARCHES.map((term) => (
                      <button key={`p-${term}`} onMouseDown={() => setSearch(term)}
                        className="rounded-full border border-border bg-secondary px-3 py-1 text-[12px] text-foreground hover:border-foreground/40 transition-colors">
                        {term}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Desktop filter rows (hidden on mobile) ── */}
        <div className="hidden md:flex mt-4 items-center gap-2">
          <div
            className="flex items-center gap-2 flex-1 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {["", ...CITIES].map((c) => (
              <button key={c || "__all"}
                onClick={() => setCity(c === city ? "" : c)}
                className={`shrink-0 inline-flex items-center h-8 min-w-[52px] max-w-[160px] justify-center rounded-full border px-3.5 text-[13px] font-medium cursor-pointer transition-colors ${
                  city === c ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground/80 hover:border-foreground/40"
                }`}
              >
                {c || "Tümü"}
              </button>
            ))}
            <button
              onClick={() => setOpenNow((v) => !v)}
              className={`shrink-0 h-8 rounded-full border px-3.5 text-[13px] font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                openNow ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-card text-foreground/80 hover:border-foreground/40"
              }`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${openNow ? "bg-white" : "bg-emerald-500"}`} />
              Şimdi Açık
            </button>
            <button
              onClick={toggleNearby}
              className={`shrink-0 h-8 rounded-full border px-3.5 text-[13px] font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                nearbyOnly ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-card text-foreground/80 hover:border-foreground/40"
              }`}
            >
              <MapPin size={12} />
              Yakınımda
            </button>
          </div>
          <div className="shrink-0 relative">
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sıralama"
              className="appearance-none h-8 max-w-[150px] rounded-full border border-border bg-card pl-3.5 pr-7 text-[13px] font-medium text-foreground cursor-pointer outline-none focus:border-foreground/40 truncate">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="hidden md:flex mt-2 items-center gap-2">
          <div
            className="flex items-center gap-2 flex-1 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {SHOP_TYPES.map((t) => (
              <button key={t.value}
                onClick={() => setShopType(t.value === shopType ? "" : t.value)}
                className={`shrink-0 inline-flex items-center h-8 min-w-[52px] justify-center rounded-full border px-3.5 text-[12px] font-medium cursor-pointer transition-colors ${
                  (t.value === "" && !shopType) || shopType === t.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground/80 hover:border-foreground/40"
                }`}
              >
                {t.label}
              </button>
            ))}
            <div className="flex items-center gap-2">
              {RATINGS.map((r) => (
                <button key={r.value}
                  onClick={() => setMinRating(minRating === r.value ? 0 : r.value)}
                  className={`shrink-0 h-8 rounded-full border px-3.5 text-[12px] font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                    minRating === r.value
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-border bg-card text-foreground/80 hover:border-foreground/40"
                  }`}
                >
                  <Star size={10} className={minRating === r.value ? "text-amber-500" : "text-muted-foreground"} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowMoreFilters((v) => !v)}
            className={`shrink-0 flex items-center h-8 gap-1.5 rounded-full border px-3.5 text-[12px] font-medium cursor-pointer transition-colors ${
              showMoreFilters || district || service
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground/80 hover:border-foreground/40"
            }`}
          >
            <SlidersHorizontal size={12} />
            Filtreler
          </button>
        </div>

        {/* ── Mobile filter rows (hidden on desktop) ── */}

        {/* Row 1: View Controls */}
        <div className="md:hidden mt-5 flex rounded-full border border-border bg-card overflow-hidden">
          {[{ mode: "list", Icon: List, label: "Liste" }, { mode: "map", Icon: Map, label: "Harita" }].map(({ mode, Icon, label }) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors cursor-pointer ${
                viewMode === mode ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* Row 2: Discover Controls — sort + filter button */}
        <div className="md:hidden mt-4 flex gap-2">
          <div className="relative flex-1">
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sıralama"
              className="appearance-none w-full h-11 rounded-[14px] border border-border bg-card pl-4 pr-8 text-[14px] font-semibold text-foreground cursor-pointer outline-none focus:border-foreground/40">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <button
            onClick={() => setShowMoreFilters((v) => !v)}
            className={`shrink-0 flex items-center h-11 gap-2 rounded-[14px] border px-4 text-[14px] font-semibold cursor-pointer transition-colors ${
              showMoreFilters || district || service
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtreler
          </button>
        </div>

        {/* Row 3: Location chips */}
        <div
          className="md:hidden mt-4 flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {["", ...CITIES].map((c) => (
            <button key={c || "__all"}
              onClick={() => setCity(c === city ? "" : c)}
              className={`shrink-0 inline-flex items-center h-9 min-w-[52px] justify-center rounded-full border px-4 text-[13px] font-medium cursor-pointer transition-colors ${
                city === c ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground/80"
              }`}
            >
              {c || "Tümü"}
            </button>
          ))}
          <button
            onClick={() => setOpenNow((v) => !v)}
            className={`shrink-0 h-9 rounded-full border px-4 text-[13px] font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              openNow ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-card text-foreground/80"
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${openNow ? "bg-white" : "bg-emerald-500"}`} />
            Şimdi Açık
          </button>
          <button
            onClick={toggleNearby}
            className={`shrink-0 h-9 rounded-full border px-4 text-[13px] font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              nearbyOnly ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-card text-foreground/80"
            }`}
          >
            <MapPin size={12} />
            Yakınımda
          </button>
        </div>

        {/* Row 4: Service / gender chips */}
        <div
          className="md:hidden mt-3 flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {SHOP_TYPES.map((t) => (
            <button key={t.value}
              onClick={() => setShopType(t.value === shopType ? "" : t.value)}
              className={`shrink-0 inline-flex items-center h-9 min-w-[52px] justify-center rounded-full border px-4 text-[13px] font-medium cursor-pointer transition-colors ${
                (t.value === "" && !shopType) || shopType === t.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground/80"
              }`}
            >
              {t.label}
            </button>
          ))}
          {RATINGS.map((r) => (
            <button key={r.value}
              onClick={() => setMinRating(minRating === r.value ? 0 : r.value)}
              className={`shrink-0 h-9 rounded-full border px-4 text-[13px] font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                minRating === r.value
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-border bg-card text-foreground/80"
              }`}
            >
              <Star size={11} className={minRating === r.value ? "text-amber-500" : "text-muted-foreground"} />
              {r.label}
            </button>
          ))}
        </div>

        {/* Expanded: district + service inputs + amenity chips.
            Desktop: inline block. Mobile: bottom sheet (shared Sheet). */}
        {(() => {
          const filterFields = (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className={`relative ${isMobile ? "w-full" : ""}`}>
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input value={district} onChange={(e) => setDistrict(e.target.value)}
                    aria-label="İlçe" placeholder="İlçe (ör. Darıca)"
                    className={`rounded-[12px] border border-border bg-card pl-8 pr-8 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors ${isMobile ? "w-full" : "w-44"}`} />
                  {district && <button onClick={() => setDistrict("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={12} /></button>}
                </div>
                <div className={`relative ${isMobile ? "w-full" : ""}`}>
                  <Scissors size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input value={service} onChange={(e) => setService(e.target.value)}
                    aria-label="Hizmet" placeholder="Hizmet (ör. Fade)"
                    className={`rounded-[12px] border border-border bg-card pl-8 pr-8 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors ${isMobile ? "w-full" : "w-44"}`} />
                  {service && <button onClick={() => setService("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={12} /></button>}
                </div>
              </div>

              {/* Amenity chips — wrap in sheet, scroll inline */}
              <div
                className={`flex items-center gap-2 pb-0.5 ${isMobile ? "flex-wrap" : "overflow-x-auto"}`}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {AMENITY_CHIPS.map(({ key, label, Icon }) => (
                  <button key={key} onClick={() => toggleAmenity(key)}
                    className={`shrink-0 flex items-center h-8 gap-1.5 rounded-full border px-3.5 text-[12px] font-medium cursor-pointer transition-colors ${
                      amenities[key]
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-foreground/80 hover:border-foreground/40"
                    }`}
                  >
                    <Icon size={11} />{label}
                  </button>
                ))}
              </div>
            </div>
          );

          if (!isMobile) return showMoreFilters ? <div className="mt-3">{filterFields}</div> : null;
          return (
            <AnimatePresence>
              {showMoreFilters && (
                <Sheet key="filters" onClose={() => setShowMoreFilters(false)} title="Filtreler" hideAt="md">
                  {filterFields}
                  <button
                    onClick={() => setShowMoreFilters(false)}
                    className="mt-4 w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold"
                  >
                    {total === 0 ? "Sonuçları Göster" : `Sonuçları Göster (${total})`}
                  </button>
                </Sheet>
              )}
            </AnimatePresence>
          );
        })()}

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              search        && { label: `"${search}"`,                                      clear: () => setSearch("") },
              city          && { label: city,                                                clear: () => setCity("") },
              district      && { label: `İlçe: ${district}`,                                clear: () => setDistrict("") },
              shopType      && { label: SHOP_TYPES.find(t => t.value === shopType)?.label,  clear: () => setShopType("") },
              service       && { label: `Hizmet: ${service}`,                               clear: () => setService("") },
              minRating > 0 && { label: `${minRating}+ puan`,                              clear: () => setMinRating(0) },
              openNow       && { label: "Şimdi Açık",                                       clear: () => setOpenNow(false) },
              nearbyOnly    && { label: "Yakınımda (15 km)",                               clear: () => setNearbyOnly(false) },
              ...AMENITY_CHIPS.filter(({ key }) => amenities[key]).map(({ key, label }) => ({
                label, clear: () => toggleAmenity(key),
              })),
            ].filter(Boolean).map(({ label, clear }, i) => (
              <span key={i} className="inline-flex items-center h-8 gap-1.5 rounded-full border border-border bg-secondary/60 px-3.5 text-[12px] text-foreground">
                {label}
                <button onClick={clear} className="text-muted-foreground hover:text-foreground"><X size={11} /></button>
              </span>
            ))}
            <button onClick={clearAll}
              className="inline-flex items-center h-8 rounded-full border border-border bg-card px-3.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
              Tümünü Temizle
            </button>
          </div>
        )}

        {/* Fetch failed — previous results stay visible, offer a retry */}
        {fetchError && (
          <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <p className="flex-1 text-[12px] text-amber-800">Sonuçlar güncellenemedi. Bağlantını kontrol edip tekrar dene.</p>
            <button
              onClick={() => setRetryTick((t) => t + 1)}
              className="shrink-0 rounded-full border border-amber-300 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-amber-800"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Location-denied banner — soft nudge, dismissible, never an error */}
        {viewMode === "map" && geoDenied && !geoBannerDismissed && (
          <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-border bg-secondary/60 px-3.5 py-2.5">
            <MapPin size={14} className="shrink-0 text-muted-foreground" />
            <p className="flex-1 text-[12px] text-foreground">Yakınındaki salonları keşfetmek için konumunu aç.</p>
            <button
              onClick={() => requestLocation()}
              className="shrink-0 rounded-full bg-foreground text-background px-3.5 py-1.5 text-[11px] font-semibold"
            >
              Konumu Aç
            </button>
            <button onClick={() => setGeoBannerDismissed(true)} aria-label="Kapat"
              className="shrink-0 text-muted-foreground hover:text-foreground p-1">
              <X size={13} />
            </button>
          </div>
        )}
        </>)}

        {/* Results */}
        <div className="mt-8">
          {viewMode === "map" ? (
            isMobile ? (
              /* ── Mobile: fullscreen map + draggable bottom sheet ── */
              <>
                <div className="fixed left-0 right-0 bottom-0 top-[68px] z-20">
                  <SalonMap
                    salons={displayShops}
                    userLoc={userLoc}
                    selectedSalonId={selectedShopId}
                    onSalonSelect={handleSalonSelect}
                    onUserLocate={handleUserLocate}
                    onSearchArea={handleSearchArea}
                    fitToken={fitToken}
                    padBottomFraction={0.45}
                  />
                  <button
                    onClick={() => setViewMode("list")}
                    className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-4 py-2 text-[13px] font-semibold text-foreground shadow-lg backdrop-blur"
                  >
                    <List size={14} /> Liste
                  </button>
                  <button
                    onClick={() => setShowMapFilters(true)}
                    className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-4 py-2 text-[13px] font-semibold text-foreground shadow-lg backdrop-blur"
                  >
                    <SlidersHorizontal size={13} /> Filtreler
                    {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                  {geoDenied && !geoBannerDismissed && (
                    <div className="absolute top-14 left-3 right-3 z-[1000] flex items-center gap-2 rounded-[14px] border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-lg">
                      <MapPin size={13} className="shrink-0 text-muted-foreground" />
                      <p className="flex-1 text-[12px] text-foreground leading-tight">Yakınındaki salonları keşfetmek için konumunu aç.</p>
                      <button onClick={() => requestLocation()}
                        className="shrink-0 rounded-full bg-foreground text-background px-3 py-1.5 text-[11px] font-semibold">
                        Konumu Aç
                      </button>
                      <button onClick={() => setGeoBannerDismissed(true)} aria-label="Kapat"
                        className="shrink-0 text-muted-foreground p-1">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Map filter sheet — all filtering lives here, never on the map itself */}
                <AnimatePresence>
                  {showMapFilters && (
                    <Sheet key="map-filters" onClose={() => setShowMapFilters(false)} title="Filtreler" hideAt="md">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                          aria-label="Salon ara" placeholder="Salon adı, berber, hizmet..."
                          className="w-full rounded-[12px] border border-border bg-card pl-9 pr-8 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40" />
                        {search && (
                          <button onClick={() => setSearch("")} aria-label="Temizle"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={13} /></button>
                        )}
                      </div>

                      <p className="mt-4 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Şehir</p>
                      <div className="flex flex-wrap gap-2">
                        {["", ...CITIES].map((c) => (
                          <button key={c || "__all"} onClick={() => setCity(c === city ? "" : c)}
                            className={`h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
                              city === c ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground/80"
                            }`}>
                            {c || "Tümü"}
                          </button>
                        ))}
                      </div>

                      <p className="mt-4 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Hızlı Filtreler</p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setOpenNow((v) => !v)}
                          className={`h-9 rounded-full border px-3.5 text-[13px] font-medium flex items-center gap-1.5 transition-colors ${
                            openNow ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-card text-foreground/80"
                          }`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${openNow ? "bg-white" : "bg-emerald-500"}`} />
                          Şimdi Açık
                        </button>
                        <button onClick={toggleNearby}
                          className={`h-9 rounded-full border px-3.5 text-[13px] font-medium flex items-center gap-1.5 transition-colors ${
                            nearbyOnly ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-card text-foreground/80"
                          }`}>
                          <MapPin size={12} /> Yakınımda
                        </button>
                        {RATINGS.map((r) => (
                          <button key={r.value} onClick={() => setMinRating(minRating === r.value ? 0 : r.value)}
                            className={`h-9 rounded-full border px-3.5 text-[13px] font-medium flex items-center gap-1 transition-colors ${
                              minRating === r.value ? "border-amber-500 bg-amber-50 text-amber-700" : "border-border bg-card text-foreground/80"
                            }`}>
                            <Star size={10} className={minRating === r.value ? "text-amber-500" : "text-muted-foreground"} />
                            {r.label}
                          </button>
                        ))}
                      </div>

                      <p className="mt-4 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Hizmet</p>
                      <div className="relative">
                        <Scissors size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input value={service} onChange={(e) => setService(e.target.value)}
                          aria-label="Hizmet" placeholder="Hizmet (ör. Fade)"
                          className="w-full rounded-[12px] border border-border bg-card pl-8 pr-8 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40" />
                        {service && (
                          <button onClick={() => setService("")} aria-label="Temizle"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={12} /></button>
                        )}
                      </div>

                      <div className="mt-5 flex gap-2">
                        {hasActiveFilters && (
                          <button onClick={clearAll}
                            className="h-11 rounded-full border border-border bg-card px-5 text-[13px] font-semibold text-foreground">
                            Temizle
                          </button>
                        )}
                        <button onClick={() => setShowMapFilters(false)}
                          className="flex-1 h-11 rounded-full bg-foreground text-background text-[14px] font-semibold">
                          {total === 0 ? "Sonuçları Göster" : `Sonuçları Göster (${total})`}
                        </button>
                      </div>
                    </Sheet>
                  )}
                </AnimatePresence>

                <MapBottomSheet
                  snap={mobileSnap}
                  onSnapChange={setMobileSnap}
                  header={
                    <p className="mt-1.5 text-center text-[12px] font-medium text-muted-foreground">
                      {total === 0 ? "Sonuç bulunamadı" : `${total} salon`}
                    </p>
                  }
                >
                  {mobileSnap <= 0.1 ? null : displayShops.length === 0 ? (
                    <div className="pt-10 flex flex-col items-center text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <Scissors size={26} className="text-muted-foreground/40" />
                      </div>
                      <p className="text-[15px] font-semibold text-foreground">Bu bölgede salon bulunamadı</p>
                      <p className="text-[12px] text-muted-foreground mt-1.5">Filtreleri değiştirmeyi deneyin.</p>
                      {hasActiveFilters && (
                        <button onClick={clearAll}
                          className="mt-4 rounded-full border border-border bg-card px-5 py-2 text-[13px] font-semibold text-foreground">
                          Filtreleri Temizle
                        </button>
                      )}
                    </div>
                  ) : mobileSnap < 0.9 ? (
                    /* Collapsed: horizontal snap carousel (Google Maps style) */
                    <div
                      className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 scroll-px-4 pb-2"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
                    >
                      {displayShops.map((shop, i) => (
                        <motion.div
                          key={shop.id}
                          className="snap-center shrink-0"
                          style={{ width: "85%" }}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
                        >
                          <MapSheetCard
                            shop={shop}
                            userLoc={userLoc}
                            isSelected={selectedShopId === shop.id}
                            onSelect={handleSalonSelect}
                            cardRef={selectedShopId === shop.id ? selectedCardRef : null}
                          />
                        </motion.div>
                      ))}
                      {hasMore && !loading && (
                        <div className="snap-center shrink-0 flex items-center" style={{ width: "40%" }}>
                          <button onClick={loadMore}
                            className="w-full rounded-[16px] border border-border bg-card px-4 py-6 text-[13px] font-semibold text-foreground">
                            Daha Fazla
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Expanded: vertical list */
                    <>
                      {displayShops.map((shop, i) => (
                        <motion.div
                          key={shop.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
                        >
                          <MapSheetCard
                            shop={shop}
                            userLoc={userLoc}
                            isSelected={selectedShopId === shop.id}
                            onSelect={handleSalonSelect}
                            cardRef={selectedShopId === shop.id ? selectedCardRef : null}
                          />
                        </motion.div>
                      ))}
                      {hasMore && !loading && (
                        <div className="flex justify-center py-3">
                          <button onClick={loadMore}
                            className="rounded-[14px] border border-border bg-card px-8 py-3 text-[14px] font-semibold text-foreground">
                            Daha Fazla Göster
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </MapBottomSheet>
              </>
            ) : (
              /* ── Desktop: cards | sticky map ── */
              <div className="flex gap-6 items-start">
                <div
                  className="w-[46%] order-2 shrink-0 sticky top-[92px] z-10 rounded-[20px] overflow-hidden border border-border h-[calc(100vh-120px)]"
                  style={{ boxShadow: "0 6px 28px rgba(0,0,0,0.09)" }}
                >
                  <SalonMap
                    salons={displayShops}
                    userLoc={userLoc}
                    selectedSalonId={selectedShopId}
                    hoveredSalonId={hoveredShopId}
                    onSalonSelect={handleSalonSelect}
                    onUserLocate={handleUserLocate}
                    onSearchArea={handleSearchArea}
                    fitToken={fitToken}
                  />
                </div>

                {/* Cards column — clicking a card selects + pans the map (no navigation) */}
                <div className="flex-1 order-1 w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {displayShops.length === 0 && !loading && (
                    <div className="col-span-full pt-16 flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <Scissors size={32} className="text-muted-foreground/40" />
                      </div>
                      <p className="text-[16px] font-semibold text-foreground">Salon bulunamadı</p>
                      <p className="text-[13px] text-muted-foreground mt-1.5">Filtreleri değiştirmeyi deneyin.</p>
                      {hasActiveFilters && (
                        <button onClick={clearAll}
                          className="mt-4 rounded-full border border-border bg-card px-5 py-2 text-[13px] font-semibold text-foreground hover:border-foreground/40 transition-colors">
                          Filtreleri Temizle
                        </button>
                      )}
                    </div>
                  )}
                  {displayShops.map((shop) => {
                    const isSelected = selectedShopId === shop.id;
                    return (
                      <div
                        key={shop.id}
                        ref={isSelected ? selectedCardRef : null}
                        onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedShopId(shop.id); }}
                        onMouseEnter={() => setHoveredShopId(shop.id)}
                        onMouseLeave={() => setHoveredShopId(null)}
                        className={`relative cursor-pointer transition-[transform,box-shadow] duration-300 ${isSelected ? "ring-2 ring-foreground rounded-[16px] makas-card-glow makas-card-lift" : ""}`}
                        style={{ scrollMarginTop: 100 }}
                      >
                        <SalonCard shop={shop} userLoc={userLoc} />
                        {isSelected && <span className="makas-connector" aria-hidden />}
                      </div>
                    );
                  })}
                  {hasMore && !loading && (
                    <div className="col-span-full flex justify-center py-4">
                      <button onClick={loadMore}
                        className="rounded-[14px] border border-border bg-card px-8 py-3 text-[14px] font-semibold text-foreground hover:border-foreground/40 transition-colors">
                        Daha Fazla Göster
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )

          ) : loading && displayShops.length === 0 ? (
            <>
              {/* Desktop skeleton grid */}
              <div className="hidden md:grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {Array.from({ length: 8 }).map((_, i) => <SalonCardSkeleton key={i} />)}
              </div>
              {/* Mobile skeleton carousel */}
              <div className="flex md:hidden gap-4 overflow-x-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="shrink-0" style={{ width: "85vw" }}>
                    <SalonCardSkeleton />
                  </div>
                ))}
              </div>
            </>

          ) : displayShops.length > 0 ? (
            <>
              {/* Desktop: uniform-height grid */}
              <div
                className="hidden md:grid gap-5"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  opacity: loading ? 0.55 : 1,
                  transition: "opacity 0.18s ease",
                  pointerEvents: loading ? "none" : "auto",
                }}
              >
                {displayShops.map((shop) => {
                  const isSelected = selectedShopId === shop.id;
                  return (
                    <div
                      key={shop.id}
                      ref={isSelected ? selectedCardRef : null}
                      onClick={() => setSelectedShopId(shop.id)}
                      className={isSelected ? "ring-2 ring-foreground rounded-[16px]" : ""}
                    >
                      <SalonCard shop={shop} userLoc={userLoc} />
                    </div>
                  );
                })}
              </div>

              {/* Mobile: swipeable horizontal carousel */}
              <div
                className="flex md:hidden gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scroll-px-4"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                  opacity: loading ? 0.55 : 1,
                  transition: "opacity 0.18s ease",
                  pointerEvents: loading ? "none" : "auto",
                }}
              >
                {displayShops.map((shop) => {
                  const isSelected = selectedShopId === shop.id;
                  return (
                    <div
                      key={shop.id}
                      ref={isSelected ? selectedCardRef : null}
                      onClick={() => setSelectedShopId(shop.id)}
                      className={`snap-start shrink-0 ${isSelected ? "ring-2 ring-foreground rounded-[16px]" : ""}`}
                      style={{ width: "85vw" }}
                    >
                      <SalonCard shop={shop} userLoc={userLoc} />
                    </div>
                  );
                })}
              </div>

              {hasMore && !loading && (
                <div className="mt-10 flex justify-center">
                  <button onClick={loadMore}
                    className="rounded-[14px] border border-border bg-card px-8 py-3 text-[14px] font-semibold text-foreground hover:border-foreground/40 transition-colors">
                    Daha Fazla Göster
                  </button>
                </div>
              )}
              {loading && (
                <div className="mt-3 flex justify-center">
                  <div className="h-1 w-24 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-foreground/40 rounded-full" style={{ width: "40%", animation: "pulse 1.2s ease-in-out infinite" }} />
                  </div>
                </div>
              )}
            </>

          ) : (
            <div className="mt-16 flex flex-col items-center text-center px-4">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                  <Scissors size={40} className="text-muted-foreground/40" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                  <Search size={14} className="text-muted-foreground/60" />
                </div>
              </div>
              <p className="text-[18px] font-semibold text-foreground tracking-tight">Salon bulunamadı</p>
              <p className="text-[13px] text-muted-foreground mt-2 max-w-[320px] leading-relaxed">
                {nearbyOnly
                  ? "Yakınında (15 km) salon bulunamadı. Filtreyi kapatıp tüm salonlara göz atabilirsin."
                  : openNow
                  ? "Seçilen filtrelere uyan, şu an açık salon yok. Filtreleri değiştirin veya daha sonra tekrar deneyin."
                  : search
                  ? `"${search}" için sonuç yok. Farklı bir arama terimi deneyin.`
                  : "Bu filtrelere uyan salon bulunamadı."}
              </p>
              {hasActiveFilters && (
                <button onClick={clearAll}
                  className="mt-5 rounded-full border border-border bg-card px-5 py-2 text-[13px] font-semibold text-foreground hover:border-foreground/40 transition-colors">
                  Filtreleri Temizle
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

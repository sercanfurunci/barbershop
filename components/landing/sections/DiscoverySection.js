"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  Star,
  ArrowRight,
  MapPin,
  Loader2,
} from "lucide-react";

import FadeUp from "@/components/landing/shared/FadeUp";
import Eyebrow from "@/components/shared/Eyebrow";

// ─── Skeleton cards ────────────────────────────────────────────────────────────

function SalonCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[20px] border border-border bg-card overflow-hidden animate-pulse" style={{ minHeight: 280 }}>
      <div className="h-48 bg-secondary shrink-0" />
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="h-4 bg-secondary rounded-full w-3/4" />
        <div className="h-3 bg-secondary rounded-full w-1/3 mt-0.5" />
        <div className="flex-1" />
        <div className="h-px bg-border mt-2" />
        <div className="h-3 bg-secondary rounded-full w-1/2 mt-1" />
      </div>
    </div>
  );
}

function SalonSectionSkeleton({ eyebrow, title, bg = "var(--makas-bg)" }) {
  return (
    <section style={{ background: bg, paddingTop: "clamp(56px, 8vw, 96px)", paddingBottom: "clamp(56px, 8vw, 96px)" }}>
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-8">
          {eyebrow && <div className="h-3 bg-secondary rounded-full w-20 animate-pulse mb-2" />}
          <div className="h-8 bg-secondary rounded-full w-52 animate-pulse" />
        </div>
        <div
          className="flex md:grid gap-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-6 px-6 scroll-px-6 md:mx-0 md:px-0 pb-2 md:pb-0"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", scrollbarWidth: "none" }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="snap-start shrink-0 w-[85vw] sm:w-[46%] md:w-auto md:shrink">
              <SalonCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Salon card (landing-specific, simpler than /salons full card) ────────────

function SalonCard({ shop, index = 0, distanceKm }) {
  const img = shop.coverImage || (Array.isArray(shop.gallery) && shop.gallery[0]) || null;
  const rating = shop.googleRating ? Number(shop.googleRating) : null;
  const ratingCount = shop.googleTotalRatings ?? null;

  return (
    <FadeUp delay={index * 0.06} className="h-full">
      <Link
        href={`/${shop.slug}`}
        className="group flex flex-col h-full rounded-[20px] border border-border bg-card overflow-hidden no-underline transition-all duration-300 hover:-translate-y-1"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "box-shadow 0.3s, transform 0.3s" }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}
      >
        {/* Image */}
        <div className="relative h-48 bg-secondary overflow-hidden shrink-0">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={shop.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Scissors size={32} className="text-muted-foreground/30" />
            </div>
          )}

          {/* Rating badge — Google Business only */}
          {rating ? (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[12px] font-semibold text-foreground backdrop-blur-sm">
              <Star size={11} fill="#F59E0B" className="text-amber-500" />
              {rating.toFixed(1)}
              {ratingCount ? (
                <span className="text-muted-foreground font-normal">({ratingCount})</span>
              ) : null}
            </div>
          ) : null}

          {/* Shop type badge */}
          {shop.shopType ? (
            <div className="absolute top-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm capitalize">
              {shop.shopType === "BARBER" ? "Berber" : shop.shopType === "SALON" ? "Kuaför" : shop.shopType}
            </div>
          ) : null}

          {/* Distance badge — shown only for nearby section */}
          {distanceKm != null && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[12px] font-semibold text-foreground backdrop-blur-sm">
              <MapPin size={11} className="text-blue-500" />
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-4">
          <p className="font-semibold text-foreground text-[15px] leading-snug truncate">{shop.name}</p>
          {shop.city ? (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} className="text-muted-foreground shrink-0" />
              <p className="text-[12px] text-muted-foreground truncate">{shop.city}</p>
            </div>
          ) : null}
          {shop.description ? (
            <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed flex-1">
              {shop.description}
            </p>
          ) : <div className="flex-1" />}

          {/* CTA */}
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">Randevu Al</span>
            <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Link>
    </FadeUp>
  );
}

// ─── Salon section row ────────────────────────────────────────────────────────

function SalonSection({ title, eyebrow, href, shops, bg = "var(--makas-bg)", showDistance = false }) {
  if (!shops.length) return null;
  return (
    <section style={{ background: bg, paddingTop: "clamp(56px, 8vw, 96px)", paddingBottom: "clamp(56px, 8vw, 96px)" }}>
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex items-end justify-between mb-8 gap-4">
          <FadeUp>
            {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
            <h2
              className="font-display font-bold text-foreground"
              style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.8px", lineHeight: 1.1 }}
            >
              {title}
            </h2>
          </FadeUp>
          <Link
            href={href}
            className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground no-underline hover:text-foreground transition-colors"
          >
            Tümünü gör <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile/tablet: snap carousel; desktop: grid */}
        <div
          className="flex md:grid gap-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-6 px-6 scroll-px-6 md:mx-0 md:px-0 pb-2 md:pb-0"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {shops.slice(0, 6).map((s, i) => (
            <div key={s.id} className="snap-start shrink-0 w-[85vw] sm:w-[46%] md:w-auto md:shrink">
              <SalonCard shop={s} index={i} distanceKm={showDistance && s.distance != null ? s.distance : undefined} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Scoring helper ──────────────────────────────────────────────────────────

function featuredScore(s) {
  const r = parseFloat(s.googleRating) || 0;
  const n = parseInt(s.googleTotalRatings) || 0;
  return r * 2 + Math.log(n + 1) * 1.5 + (s.coverImage ? 1 : 0);
}

// ─── Discovery ────────────────────────────────────────────────────────────────
// Renders immediately with skeletons, never waits for geolocation before showing
// content. If permission is already granted, silently fetches nearby and swaps
// the top section in with a fade once the data arrives.

export default function DiscoverySection() {
  const [popular,  setPopular]  = useState(null); // null=loading, []=empty, [...]loaded
  const [recent,   setRecent]   = useState(null);
  const [nearby,   setNearby]   = useState(null); // null=unknown, []=none, [...]found
  // "checking"=silent perm query | "idle"=CTA visible | "locating"=button spinner |
  // "located"=nearby shown | "denied"=CTA hidden
  const [geoState, setGeoState] = useState("checking");

  const nearbyRef   = useRef(null);  // DOM ref for scroll-into-view
  const locatingRef = useRef(false); // guard against duplicate requests

  const doFetchNearby = useCallback((lat, lng) => {
    fetch(`/api/shops?take=12&sort=nearest&userLat=${lat}&userLng=${lng}`)
      .then((r) => r.json())
      .then((d) => {
        locatingRef.current = false;
        const rows = (d?.shops ?? [])
          .filter((s) => s.distance != null && s.distance <= 25)
          .slice(0, 6);
        setNearby(rows);
        if (rows.length > 0) {
          setGeoState("located");
          setTimeout(() => {
            const el = nearbyRef.current;
            if (el && el.getBoundingClientRect().top > window.innerHeight) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 450);
        } else {
          setGeoState("idle");
          toast("Yakınında kayıtlı salon bulunamadı.");
        }
      })
      .catch(() => {
        locatingRef.current = false;
        setNearby([]);
        setGeoState("idle");
        toast.error("Salonlar yüklenemedi, lütfen tekrar deneyin.");
      });
  }, []);

  const requestLocation = useCallback(() => {
    if (locatingRef.current) return;

    if (!navigator.geolocation) {
      toast.error("Tarayıcınız konum özelliğini desteklemiyor.");
      setGeoState("denied");
      return;
    }

    locatingRef.current = true;
    setGeoState("locating");

    navigator.geolocation.getCurrentPosition(
      (pos) => doFetchNearby(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        locatingRef.current = false;
        if (err.code === 1 /* PERMISSION_DENIED */) {
          toast.error("Konum izni verilmedi.");
          setGeoState("denied");
        } else {
          toast.error("Konum alınamadı, lütfen tekrar deneyin.");
          setGeoState("idle");
        }
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }, [doFetchNearby]);

  useEffect(() => {
    // Popular and recent fire immediately — no dependency on geolocation
    fetch("/api/shops?take=20")
      .then((r) => r.json())
      .then((d) => {
        const shops = d?.shops ?? [];
        setPopular([...shops].sort((a, b) => featuredScore(b) - featuredScore(a)).slice(0, 6));
      })
      .catch(() => setPopular([]));

    fetch("/api/shops?take=6&sort=newest")
      .then((r) => r.json())
      .then((d) => setRecent(d?.shops ?? []))
      .catch(() => setRecent([]));

    // Silent permission check — never prompts the browser dialog
    navigator.permissions?.query({ name: "geolocation" })
      .then((p) => {
        if (p.state === "granted") {
          locatingRef.current = true;
          setGeoState("locating");
          navigator.geolocation.getCurrentPosition(
            (pos) => doFetchNearby(pos.coords.latitude, pos.coords.longitude),
            () => { locatingRef.current = false; setNearby([]); setGeoState("idle"); },
            { timeout: 10_000, maximumAge: 60_000 }
          );
        } else if (p.state === "denied") {
          setNearby([]);
          setGeoState("denied");
        } else {
          setNearby([]);
          setGeoState("idle");
        }
      })
      .catch(() => { setNearby([]); setGeoState("idle"); });
  }, [doFetchNearby]);

  const showNearby  = geoState === "located" && (nearby?.length ?? 0) > 0;
  const isLocating  = geoState === "locating";
  const showCTA     = geoState === "idle" || geoState === "locating";

  const bg1 = "var(--makas-bg)";
  const bg2 = "var(--makas-surface)";
  const bg3 = "var(--makas-bg)";

  return (
    <>
      {/* ── Top slot: skeleton → popular → nearby (crossfade) ──────────────── */}
      <div ref={nearbyRef}>
        <AnimatePresence mode="wait">
          {showNearby ? (
            <motion.div key="nearby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <SalonSection
                eyebrow="Yakınındakiler"
                title="Sana en yakın salonlar"
                href="/salons?sort=nearby"
                shops={nearby}
                bg={bg1}
                showDistance
              />
            </motion.div>
          ) : popular === null ? (
            <motion.div key="skel-pop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <SalonSectionSkeleton eyebrow="Önerilen" title="Müşterilerin tercihi" bg={bg1} />
            </motion.div>
          ) : popular.length > 0 ? (
            <motion.div key="popular" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <SalonSection eyebrow="Önerilen" title="Müşterilerin tercihi" href="/salons" shops={popular} bg={bg1} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── Slot 2: Popular (only when Nearby is at slot 1) ──────────────────── */}
      <AnimatePresence>
        {showNearby && popular?.length > 0 && (
          <motion.div key="popular-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <SalonSection eyebrow="Önerilen" title="Müşterilerin tercihi" href="/salons" shops={popular} bg={bg2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recent ───────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {recent === null ? (
          <motion.div key="skel-rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <SalonSectionSkeleton eyebrow="Yeni Katılanlar" title="Platformumuzdaki yeni salonlar" bg={showNearby ? bg3 : bg2} />
          </motion.div>
        ) : recent.length > 0 ? (
          <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <SalonSection
              eyebrow="Yeni Katılanlar"
              title="Platformumuzdaki yeni salonlar"
              href="/salons?sort=newest"
              shops={recent}
              bg={showNearby ? bg3 : bg2}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Location CTA ─────────────────────────────────────────────────────── */}
      {showCTA && (
        <section style={{ background: "var(--makas-bg)", paddingBlock: "clamp(48px, 7vw, 80px)" }}>
          <div className="mx-auto max-w-[1200px] px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[20px] border border-border bg-card px-6 py-6 sm:px-8">
                <div className="flex items-center gap-4">
                  <span className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-foreground" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-foreground">Yakınındaki salonları gör</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Konumunu paylaş, sana en yakın salonları listeleyelim.</p>
                  </div>
                </div>
                <button
                  onClick={requestLocation}
                  disabled={isLocating}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 h-10 text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLocating ? (
                    <><Loader2 size={14} className="animate-spin" />Konum alınıyor…</>
                  ) : "Konumumu Kullan"}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </>
  );
}

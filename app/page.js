"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Scissors,
  MessageCircle,
  BarChart2,
  Star,
  CheckCircle,
  ChevronDown,
  ArrowRight,
  PlayCircle,
  CreditCard,
  Users,
  Megaphone,
  Settings,
  ExternalLink,
  Search,
  MapPin,
  Smartphone,
  Bell,
  Heart,
  TrendingUp,
  Shield,
  Zap,
  Loader2,
} from "lucide-react";

import Eyebrow from "@/components/shared/Eyebrow";
import PillButton from "@/components/shared/PillButton";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Kocaeli"];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ─── Animation primitive ──────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className, style, as: Tag = "div" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Skeleton cards (shown while data is in-flight) ──────────────────────────

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

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHead({ eyebrow, title, sub, align = "center", maxWidth = 720, light = false }) {
  const alignCls = align === "left" ? "text-left" : "text-center mx-auto";
  return (
    <FadeUp className={alignCls} style={{ maxWidth }}>
      {eyebrow && (
        <div className="mb-4">
          <Eyebrow className={light ? "text-white/60" : ""}>{eyebrow}</Eyebrow>
        </div>
      )}
      <h2
        className={`font-display font-bold leading-[1.05] ${light ? "text-white" : "text-foreground"}`}
        style={{ fontSize: "clamp(32px, 5vw, 54px)", letterSpacing: "-1.5px" }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-5 leading-relaxed ${light ? "text-white/70" : "text-muted-foreground"}`}
          style={{ fontSize: "clamp(15px, 1.5vw, 18px)" }}
        >
          {sub}
        </p>
      )}
    </FadeUp>
  );
}

// ─── Hero (unified — customer discovery + business value) ─────────────────────

function Hero() {
  const [q, setQ] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/salons${params.size ? `?${params}` : ""}`);
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "var(--makas-bg)",
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
      }}
    >
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(17,17,17,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-6">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
          {/* ── Left: copy + search ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Eyebrow>Türkiye'nin berber platformu</Eyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 font-display font-bold text-foreground"
              style={{ fontSize: "clamp(38px, 5.5vw, 68px)", letterSpacing: "-2px", lineHeight: 1.0 }}
            >
              En iyi berberi bul,
              <br />
              <span style={{ color: "var(--makas-ink)", opacity: 0.85 }}>anında randevu al.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 text-muted-foreground"
              style={{ fontSize: "clamp(16px, 1.6vw, 19px)", lineHeight: 1.6, maxWidth: 480 }}
            >
              Yüzlerce salon, tek platformda. İstediğin berberi seç, uygun saati bul.
            </motion.p>

            {/* Search bar */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex gap-2"
              style={{ maxWidth: 520 }}
            >
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Salon ara"
                  placeholder="Salon adı, şehir veya hizmet..."
                  className="w-full rounded-[14px] border border-border bg-card pl-11 pr-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                />
              </div>
              <button
                type="submit"
                className="shrink-0 rounded-[14px] bg-foreground px-5 py-3.5 text-[15px] font-semibold text-background hover:opacity-85 transition-opacity"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
              >
                Ara
              </button>
            </motion.form>

            {/* City chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.32 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {CITIES.map((city) => (
                <Link
                  key={city}
                  href={`/salons?city=${encodeURIComponent(city)}`}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-foreground/70 no-underline hover:border-foreground/30 hover:text-foreground transition-colors"
                >
                  {city}
                </Link>
              ))}
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.42 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              {[
                { icon: <CheckCircle size={14} className="text-foreground" />, text: "Yüzlerce onaylı salon" },
                { icon: <Zap size={14} className="text-foreground" />, text: "Ücretsiz rezervasyon" },
                { icon: <Shield size={14} className="text-foreground" />, text: "Güvenli randevu" },
              ].map(({ icon, text }) => (
                <div key={text} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-secondary-foreground">
                  {icon}
                  {text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: dashboard preview ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <HeroPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div
        className="rounded-[24px] bg-card border border-border p-6 relative z-10"
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <Eyebrow>Bugün</Eyebrow>
            <p className="font-display text-xl font-bold text-foreground mt-1">Randevular</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
            <Calendar size={16} className="text-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          {[
            { t: "09:30", n: "Ahmet Yıldız", s: "Sakal + Saç", c: "bg-emerald-100 text-emerald-700" },
            { t: "10:15", n: "Mehmet K.",    s: "Tıraş",       c: "bg-amber-100 text-amber-700" },
            { t: "11:00", n: "Burak Demir",  s: "Saç Kesimi",  c: "bg-sky-100 text-sky-700" },
            { t: "12:30", n: "Onur Şahin",   s: "Tıraş + Yıkama", c: "bg-violet-100 text-violet-700" },
          ].map((r) => (
            <div
              key={r.t}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3.5 py-2.5"
            >
              <span className="text-[11px] font-mono-custom text-muted-foreground w-11 shrink-0">{r.t}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{r.n}</p>
                <p className="text-xs text-muted-foreground truncate">{r.s}</p>
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${r.c}`}>
                Onaylı
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
          <span>Bugün toplam</span>
          <span className="font-semibold text-foreground">12 randevu · ₺2.840</span>
        </div>
      </div>

      {/* Floating card: notification */}
      <div
        className="absolute -bottom-5 -left-8 rounded-2xl bg-foreground text-background px-4 py-3 flex items-center gap-3 z-20"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
          <Bell size={14} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-60 font-mono-custom">WhatsApp</p>
          <p className="text-xs font-semibold">Hatırlatma gönderildi</p>
        </div>
      </div>

      {/* Floating card: revenue */}
      <div
        className="absolute -top-5 -right-5 rounded-2xl bg-card border border-border px-4 py-3 flex items-center gap-3 z-20"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <TrendingUp size={14} className="text-foreground" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-mono-custom uppercase tracking-wider">Bu hafta</p>
          <p className="text-sm font-bold text-foreground">₺18.450</p>
        </div>
      </div>
    </div>
  );
}

// ─── Salon Cards ──────────────────────────────────────────────────────────────

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

        {/* Mobile/tablet: snap carousel with next-card peek; desktop: grid as before.
            gridTemplateColumns is ignored while the container is display:flex. */}
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

// ─── Discovery ────────────────────────────────────────────────────────────────
// Renders immediately with skeletons, never waits for geolocation before showing
// content. If permission is already granted, silently fetches nearby and swaps
// the top section in with a fade once the data arrives.

function featuredScore(s) {
  const r = parseFloat(s.googleRating) || 0;
  const n = parseInt(s.googleTotalRatings) || 0;
  return r * 2 + Math.log(n + 1) * 1.5 + (s.coverImage ? 1 : 0);
}

function Discovery() {
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
          // Scroll nearby section into view only if it sits below the viewport
          setTimeout(() => {
            const el = nearbyRef.current;
            if (el && el.getBoundingClientRect().top > window.innerHeight) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 450); // let the fade-in start first
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
    // Prevent duplicate in-flight requests
    if (locatingRef.current) return;

    if (!navigator.geolocation) {
      toast.error("Tarayıcınız konum özelliğini desteklemiyor.");
      setGeoState("denied");
      return;
    }

    locatingRef.current = true;
    setGeoState("locating"); // keeps CTA visible with spinner

    navigator.geolocation.getCurrentPosition(
      (pos) => doFetchNearby(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        locatingRef.current = false;
        if (err.code === 1 /* PERMISSION_DENIED */) {
          toast.error("Konum izni verilmedi.");
          setGeoState("denied");
        } else {
          // POSITION_UNAVAILABLE or TIMEOUT — restore button so user can retry
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
  const bg2 = "white";
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

// ─── Platform value section (for both audiences) ──────────────────────────────

function PlatformSection() {
  return (
    <section
      className="bg-foreground text-background"
      style={{ padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <FadeUp className="text-center mx-auto mb-14" style={{ maxWidth: 640 }}>
          <Eyebrow className="text-white/60 mb-4">Herkes için MAKAS</Eyebrow>
          <h2
            className="font-display font-bold text-white leading-[1.05]"
            style={{ fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-1.5px" }}
          >
            Hem müşteriler,<br />hem salon sahipleri için.
          </h2>
        </FadeUp>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Customers */}
          <FadeUp delay={0.05}>
            <div className="rounded-[24px] bg-white/[0.07] border border-white/10 p-8 h-full">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Search size={22} className="text-white" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-3">Müşteriler</p>
              <h3
                className="font-display font-bold text-white leading-snug mb-4"
                style={{ fontSize: "clamp(20px, 2.2vw, 26px)", letterSpacing: "-0.5px" }}
              >
                Yakınındaki en iyi salonu bul
              </h3>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: <MapPin size={15} />, text: "Şehir ve ilçeye göre salon keşfet" },
                  { icon: <Star size={15} />,   text: "Puanlara ve yorumlara göre seç" },
                  { icon: <Calendar size={15} />, text: "7/24 online randevu al" },
                  { icon: <Bell size={15} />,   text: "Hatırlatma bildirimleri" },
                  { icon: <Heart size={15} />,  text: "Favori salonlarını kaydet" },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-[14px] text-white/80">
                    <span className="text-white/50">{icon}</span>
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/salons"
                className="inline-flex items-center gap-2 rounded-[12px] bg-white text-foreground px-5 py-3 text-[14px] font-semibold no-underline hover:bg-white/90 transition-colors"
              >
                Salon Bul <ArrowRight size={14} />
              </Link>
            </div>
          </FadeUp>

          {/* Business owners */}
          <FadeUp delay={0.1}>
            <div className="rounded-[24px] bg-white/[0.07] border border-white/10 p-8 h-full">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <BarChart2 size={22} className="text-white" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-3">Salon Sahipleri</p>
              <h3
                className="font-display font-bold text-white leading-snug mb-4"
                style={{ fontSize: "clamp(20px, 2.2vw, 26px)", letterSpacing: "-0.5px" }}
              >
                Salonunuzu büyüten her şey
              </h3>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: <Calendar size={15} />,  text: "Akıllı randevu ve takvim yönetimi" },
                  { icon: <Users size={15} />,     text: "Çoklu berber ve personel yönetimi" },
                  { icon: <TrendingUp size={15} />,text: "Gelir raporları ve analizler" },
                  { icon: <MessageCircle size={15} />, text: "WhatsApp ve SMS hatırlatma" },
                  { icon: <Smartphone size={15} />, text: "Mobil uygulama (iOS + Android)" },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-[14px] text-white/80">
                    <span className="text-white/50">{icon}</span>
                    {text}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => scrollTo("contact")}
                className="inline-flex items-center gap-2 rounded-[12px] bg-white text-foreground px-5 py-3 text-[14px] font-semibold cursor-pointer border-0 hover:bg-white/90 transition-colors"
              >
                Salonunuzu Ekleyin <ArrowRight size={14} />
              </button>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── Social proof strip ───────────────────────────────────────────────────────

function SocialProofStrip() {
  return (
    <section className="border-y border-border" style={{ background: "var(--makas-bg)" }}>
      <div className="mx-auto max-w-[1200px] px-6 py-10 md:py-12">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <h3
            className="font-display text-foreground"
            style={{ fontSize: "clamp(20px, 2.4vw, 30px)", lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.5px" }}
          >
            Türkiye'nin dört bir yanından berber ve kuaförler MAKAS'ı tercih ediyor.
          </h3>
          <div className="flex flex-wrap items-center gap-6 md:gap-8">
            {[
              { value: "4.9/5", label: "salon memnuniyeti", icon: <Star size={14} fill="currentColor" className="text-foreground" /> },
              { value: "%99.9", label: "çalışma süresi" },
              { value: "1 gün", label: "kurulum" },
            ].map(({ value, label, icon }, i) => (
              <div key={label}>
                {i > 0 && <div className="hidden sm:block absolute h-5 w-px bg-border" style={{ marginLeft: "-24px" }} />}
                <div className="flex items-center gap-2">
                  {icon && <div className="flex">{[...Array(5)].map((_, j) => <Star key={j} size={13} fill="currentColor" className="text-foreground" />)}</div>}
                  <span className="font-semibold text-foreground text-sm">{value}</span>
                  <span className="text-muted-foreground text-sm">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Why different ────────────────────────────────────────────────────────────

function WhyDifferent() {
  return (
    <section
      style={{ background: "white", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[820px]">
        <SectionHead
          eyebrow="Neden MAKAS"
          title={<>Berber yazılımı,<br />nihayet doğru yapıldı.</>}
          sub="Yabancı platformlarda Türkçe çeviri gibi durmayan, telefonda da masaüstünde de doğru çalışan, berberin kendi diliyle konuşan bir sistem. Karmaşa yok, kurulum hediye, sözleşme yok."
        />
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialBand() {
  return (
    <section className="bg-foreground text-background relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 80% at 20% 30%, rgba(245,241,235,0.06) 0%, transparent 60%)" }}
      />
      <div
        className="relative mx-auto max-w-[1100px] px-6"
        style={{ paddingTop: "clamp(80px, 11vw, 128px)", paddingBottom: "clamp(80px, 11vw, 128px)" }}
      >
        <SectionHead eyebrow="Müşteri hikayeleri" title="Gerçek salonlar, gerçek sonuçlar." light />

        <div className="mt-14 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {[
            {
              quote: "Telefonla randevu trafiği yüzde 60 azaldı. Müşteriler kendi randevusunu alıyor, biz de işimize odaklanıyoruz.",
              name: "Abdurrahman Çelik",
              role: "Exclusive Salon — Darıca",
              link: "/abdurrahman",
            },
            {
              quote: "Eski sistemden geçiş 1 günde tamamlandı. Berberlerimin hepsi ilk hafta içinde rahatça kullanmaya başladı.",
              name: "Makas Demo Salon",
              role: "Örnek salon — Online inceleyin",
              link: "/demo",
            },
          ].map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-7 flex flex-col h-full">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" className="text-amber-300" />)}
                </div>
                <p className="font-display text-background leading-snug flex-1" style={{ fontSize: "clamp(17px, 1.7vw, 21px)", letterSpacing: "-0.3px" }}>
                  "{t.quote}"
                </p>
                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-background">{t.name}</p>
                    <p className="text-[12px] text-background/60">{t.role}</p>
                  </div>
                  <Link href={t.link} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-background/80 hover:text-background no-underline">
                    Ziyaret et <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features bento ───────────────────────────────────────────────────────────

const FEATURED_FEATURE = {
  eyebrow: "Randevu",
  title: "Akıllı takvim, çakışmasız randevu.",
  desc: "Berber başına çalışma saatleri, mola yönetimi, çakışma engelleme. Müşteri kendi randevusunu alıyor — sen işine bakıyorsun.",
  items: ["7/24 online rezervasyon", "Berber bazlı takvim görünümü", "Mola & izin & tatil yönetimi", "Çift rezervasyon engelleme"],
};

const SUPPORTING_FEATURES = [
  { eyebrow: "Ödeme & gelir", title: "Net hesap, net rapor.", desc: "Günlük gelir, berber bazlı performans, basit ve doğru raporlar.", Icon: CreditCard, items: ["Günlük gelir", "Berber prim takibi", "Excel'e aktarma"] },
  { eyebrow: "Müşteri", title: "Sadakat tarafı sende.", desc: "Notlar, geçmiş randevular, doğum günü — hepsi kendi sisteminde.", Icon: Users, items: ["Müşteri notları", "Randevu geçmişi", "Sık gelen etiketleri"] },
  { eyebrow: "Pazarlama", title: "WhatsApp & SMS, otomatik.", desc: "Otomatik hatırlatma, kaçırılan randevu mesajı, yorum daveti.", Icon: Megaphone, items: ["Otomatik hatırlatma", "WhatsApp şablonları", "Yorum daveti"] },
  { eyebrow: "Yönetim", title: "Kontrol senin elinde.", desc: "Çoklu kullanıcı, izin seviyeleri, mobil panel — her şey net.", Icon: Settings, items: ["Admin & berber panelleri", "Rol & izinler", "Hizmet kataloğu"] },
];

function FeaturedFeatureCard() {
  return (
    <FadeUp className="md:col-span-2">
      <div
        className="rounded-[24px] bg-card border border-border p-8 lg:p-10 flex flex-col lg:flex-row gap-8 lg:gap-10 relative overflow-hidden h-full"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(17,17,17,0.04) 0%, transparent 70%)" }} />
        <div className="relative flex-1 min-w-0 flex flex-col">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <Calendar size={22} strokeWidth={1.8} />
          </div>
          <Eyebrow className="mb-3 block">{FEATURED_FEATURE.eyebrow}</Eyebrow>
          <h3 className="font-display font-bold text-foreground leading-[1.1] mb-4" style={{ fontSize: "clamp(22px, 2.2vw, 30px)", letterSpacing: "-0.7px" }}>
            {FEATURED_FEATURE.title}
          </h3>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-6 max-w-md">{FEATURED_FEATURE.desc}</p>
          <ul className="m-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 list-none p-0 mt-auto">
            {FEATURED_FEATURE.items.map((it) => (
              <li key={it} className="flex items-start gap-2.5 text-[14px] text-secondary-foreground">
                <CheckCircle size={15} strokeWidth={2.2} className="shrink-0 mt-0.5 text-foreground" />
                {it}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative lg:w-[260px] shrink-0">
          <div className="rounded-2xl bg-background border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <Eyebrow>Bugün · Salı</Eyebrow>
              <span className="text-[11px] font-mono-custom text-muted-foreground">9 randevu</span>
            </div>
            <div className="space-y-1.5">
              {[
                { t: "09:00", n: "Ahmet Y.",  c: "border-emerald-300 bg-emerald-50" },
                { t: "09:45", n: "—",         c: "border-dashed border-border bg-transparent", empty: true },
                { t: "10:30", n: "Mehmet K.", c: "border-sky-300 bg-sky-50" },
                { t: "11:15", n: "Burak D.",  c: "border-amber-300 bg-amber-50" },
              ].map((r) => (
                <div key={r.t} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${r.c}`}>
                  <span className="text-[10.5px] font-mono-custom text-muted-foreground w-9 shrink-0">{r.t}</span>
                  <span className={`text-[12px] font-medium truncate ${r.empty ? "text-muted-foreground italic" : "text-foreground"}`}>{r.empty ? "Boş slot" : r.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

function SupportingFeatureCard({ data, delay = 0 }) {
  const { eyebrow, title, desc, Icon, items } = data;
  return (
    <FadeUp delay={delay} className="h-full">
      <div className="rounded-[24px] bg-card border border-border p-7 flex flex-col h-full hover:shadow-[var(--shadow-card)] transition-shadow">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <Eyebrow className="mb-2 block">{eyebrow}</Eyebrow>
        <h3 className="font-display text-[19px] font-bold text-foreground tracking-[-0.4px] leading-[1.2] mb-3">{title}</h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">{desc}</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 mt-auto pt-3 border-t border-border">
          {items.map((it) => (
            <li key={it} className="flex items-center gap-2.5 text-[13px] text-secondary-foreground pt-1">
              <span className="h-1 w-1 rounded-full bg-foreground/40 shrink-0" />
              {it}
            </li>
          ))}
        </ul>
      </div>
    </FadeUp>
  );
}

function FeaturesSection() {
  return (
    <section
      id="explore"
      style={{ background: "var(--color-secondary, #f4f4f4)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <SectionHead
          eyebrow="Platform"
          title="Salon yönetiminin tamamı, tek panelde."
          sub="Randevu defteri, kasa programı, müşteri yönetimi ve hatırlatma sistemini ayrı ayrı kullanmaya son."
        />
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeaturedFeatureCard />
          <SupportingFeatureCard data={SUPPORTING_FEATURES[0]} delay={0.08} />
          {SUPPORTING_FEATURES.slice(1).map((c, i) => (
            <SupportingFeatureCard key={c.eyebrow} data={c} delay={(i + 2) * 0.06} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mobile App section ───────────────────────────────────────────────────────

function MobileAppSection() {
  const features = [
    { icon: <Calendar size={18} />, title: "Randevu Al", desc: "Salonunu seç, berberi belirle, saati bul." },
    { icon: <Bell size={18} />,     title: "Hatırlatmalar", desc: "Randevundan önce otomatik bildirim." },
    { icon: <Heart size={18} />,    title: "Favoriler", desc: "Beğendiğin salonları kaydet, hızla eriş." },
    { icon: <Star size={18} />,     title: "Değerlendirme", desc: "Randevu sonrası salon ve berber puanla." },
  ];
  return (
    <section style={{ background: "white", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHead
              eyebrow="Mobil Uygulama"
              title={<>Salonun her zaman<br />cebinde.</>}
              sub="iOS ve Android için optimize edilmiş uygulamamızla randevularını yönet, salonları keşfet."
              align="left"
              maxWidth={560}
            />
            <div className="mt-10 grid grid-cols-2 gap-4">
              {features.map(({ icon, title, desc }, i) => (
                <FadeUp key={title} delay={i * 0.07}>
                  <div className="rounded-[16px] border border-border bg-card p-5">
                    <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center text-foreground mb-3">
                      {icon}
                    </div>
                    <p className="font-semibold text-foreground text-[14px] mb-1">{title}</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
            <FadeUp delay={0.3} className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-[12px] bg-foreground text-background px-5 py-3 text-[14px] font-semibold">
                <Smartphone size={16} />
                App Store'da İndir
              </div>
              <div className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-card px-5 py-3 text-[14px] font-semibold text-foreground">
                <Smartphone size={16} />
                Google Play'de İndir
              </div>
            </FadeUp>
          </div>

          {/* Phone mockup */}
          <FadeUp delay={0.15} className="relative hidden lg:flex justify-center">
            <div
              className="relative rounded-[40px] bg-foreground p-4 w-[280px]"
              style={{ boxShadow: "var(--shadow-elevated)", aspectRatio: "9/19" }}
            >
              <div className="rounded-[28px] bg-card h-full overflow-hidden relative">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-foreground z-10" />
                <div className="pt-12 px-4 pb-4 h-full flex flex-col gap-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Yakın Salonlar</p>
                  {[
                    { name: "Elite Barber", city: "Kadıköy", rating: "4.9" },
                    { name: "Royal Kuaför", city: "Beşiktaş", rating: "4.7" },
                  ].map((s) => (
                    <div key={s.name} className="rounded-[14px] border border-border bg-background p-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Scissors size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.city}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Star size={10} fill="#F59E0B" className="text-amber-500" />
                        <span className="text-[11px] font-semibold text-foreground">{s.rating}</span>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-[14px] bg-foreground p-3 flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-background">Randevunu al →</p>
                    <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Calendar size={12} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── Own Your Brand ───────────────────────────────────────────────────────────

function OwnYourBrand() {
  return (
    <section style={{ background: "var(--color-secondary, #f4f4f4)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Marka sahipliği"
          title={<>Müşterin senin.<br />Pazaryeri arada yok.</>}
          sub="Instagram'da paylaşılan link senin salonunu açar — rakip listesi değil."
        />
        <div className="mt-14 grid md:grid-cols-2 gap-5">
          <FadeUp>
            <div className="rounded-[20px] border border-border bg-card p-7">
              <Eyebrow className="mb-4 block">Pazaryeri platformları</Eyebrow>
              <div className="mb-5 rounded-xl bg-secondary px-3 py-2.5 text-xs text-muted-foreground break-all font-mono-custom">
                platform.com/s/DsJTCVXovTS21DUFJ…
              </div>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {["Müşteri senin değil, platformun markasını hatırlar", "Aynı sayfada rakip salonlar bir tık ötede", "Müşteri verisi platformun veritabanında"].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm text-secondary-foreground leading-relaxed">
                    <span className="shrink-0 text-muted-foreground">—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div className="rounded-[20px] bg-foreground text-background p-7" style={{ boxShadow: "var(--shadow-pop)" }}>
              <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-background/70 font-mono-custom">MAKAS ile</div>
              <div className="mb-5 rounded-xl bg-white/10 px-3 py-2.5 text-[13px] font-semibold text-background break-all font-mono-custom">
                senin-salonun.com
              </div>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {["Müşteri salonu — yani seni hatırlar", "Sayfanda rakip yok, sadece sen varsın", "Tüm müşteri verisi tamamen senin"].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm text-background/90 leading-relaxed">
                    <span className="shrink-0">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── Demo showcase ────────────────────────────────────────────────────────────

const DEMOS = [
  { name: "Abdurrahman Çelik Exclusive Salon", slug: "abdurrahman", tag: "Gerçek müşterimiz · Darıca, Kocaeli" },
  { name: "Makas Demo Salon",                  slug: "demo",        tag: "Sistemi inceleyin — örnek salon" },
];

function DemoShowcase() {
  return (
    <section id="demo" style={{ background: "white", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Canlı örnekler"
          title="Gerçek bir randevu deneyimi."
          sub="MAKAS üzerinde çalışan salonları kendi telefonunuzdan inceleyin."
        />
        <div className="mx-auto mt-12 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", maxWidth: 800 }}>
          {DEMOS.map(({ name, slug, tag }, i) => (
            <FadeUp key={slug} delay={i * 0.1}>
              <Link
                href={`/${slug}`}
                className="group block rounded-[20px] border border-border bg-card p-7 no-underline transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <Scissors size={18} className="text-foreground" />
                </div>
                <p className="mb-1.5 text-base font-bold text-foreground">{name}</p>
                <p className="mb-5 text-[13px] text-muted-foreground">{tag}</p>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                  Ziyaret Et <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

const PLAN_FEATURES = [
  "Sınırsız berber",
  "Sınırsız randevu",
  "Admin paneli + müşteri yönetimi",
  "Kendi salonadi.makas.tech adresi",
  "Müşteri notları + geçmiş takibi",
  "Berber performans raporları",
  "Mobil uyumlu rezervasyon sayfası",
];

const ADDONS = [
  { name: "WhatsApp hatırlatma",    detail: "100 mesaj / ay dahil, sonrası kullanım başına" },
  { name: "SMS cüzdanı",            detail: "Ön ödemeli paket — kullandıkça düşer" },
  { name: "Özel alan adı yönetimi", detail: "₺200 / yıl (alan adı ücreti hariç)" },
];

function Pricing() {
  return (
    <section id="pricing" style={{ background: "var(--makas-bg)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1100px]">
        <SectionHead eyebrow="Fiyatlandırma" title="Tek plan, net fiyat." sub="Karmaşık paket yok, gizli ücret yok. Sınırsız her şey." />
        <div className="mt-12 grid lg:grid-cols-[1fr_1.1fr] gap-6 items-stretch">
          <FadeUp>
            <div className="rounded-[24px] bg-foreground p-9 text-background flex flex-col h-full" style={{ boxShadow: "var(--shadow-pop)" }}>
              <Eyebrow className="text-background/60 mb-3 block">Standart Plan</Eyebrow>
              <div className="flex flex-wrap items-baseline gap-2 mb-6">
                <span className="text-[56px] font-display font-bold leading-none tracking-[-1.5px]">₺500</span>
                <span className="text-base opacity-75">/ ay</span>
              </div>
              <ul className="m-0 flex list-none flex-col gap-3 p-0 mb-7 flex-1">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14.5px]">
                    <CheckCircle size={16} strokeWidth={2.2} className="shrink-0 mt-0.5 opacity-90" />
                    {f}
                  </li>
                ))}
              </ul>
              <PillButton variant="secondary" size="lg" onClick={() => scrollTo("contact")} className="w-full">
                14 Gün Ücretsiz Dene
              </PillButton>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div className="rounded-[24px] border border-border bg-card p-9 flex flex-col h-full">
              <Eyebrow className="mb-4 block">Ek hizmetler</Eyebrow>
              <h3 className="font-display text-2xl font-bold text-foreground tracking-[-0.5px] mb-6">İhtiyacın olduğunda ekle.</h3>
              <ul className="m-0 flex list-none flex-col gap-5 p-0 flex-1">
                {ADDONS.map((a) => (
                  <li key={a.name} className="flex flex-col gap-1 pb-4 border-b border-border last:border-0 last:pb-0">
                    <span className="text-[15px] font-semibold text-foreground">{a.name}</span>
                    <span className="text-[13.5px] text-muted-foreground leading-relaxed">{a.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[12.5px] text-muted-foreground">Kurulum ücretsiz, istediğin zaman iptal et. KDV hariç.</p>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Kurulum ne kadar sürer?",                   a: "Genellikle 1 gün içinde kurulum tamamlanır." },
  { q: "Salonumun kendi adresi olacak mı?",         a: "Evet. Her salona özel salonadi.makas.tech adresi verilir. Kendi alan adınızı bağlamak isterseniz ek hizmet olarak sunuyoruz." },
  { q: "WhatsApp hatırlatma var mı?",               a: "Evet. İsteğe bağlı olarak WhatsApp ve SMS hatırlatma entegrasyonu eklenebilir." },
  { q: "Birden fazla berber ekleyebilir miyim?",    a: "Evet. Tüm ekip üyelerinizi sisteme ekleyebilir ve yönetebilirsiniz." },
  { q: "Müşteri bilgilerini takip edebilir miyim?", a: "Evet. Notlar, geçmiş randevular ve müşteri takibi sistemde yer alır." },
  { q: "Fiyatlandırma nasıl çalışıyor?",            a: "Aylık 500 ₺ sabit ücret. Sınırsız berber, sınırsız randevu. WhatsApp/SMS gibi ek hizmetler kullandığın kadar." },
];

function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 border-0 bg-transparent py-5 text-left text-[16px] font-semibold text-foreground tracking-[-0.2px] cursor-pointer"
      >
        <span>{q}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22, ease: "easeInOut" }} className="inline-flex shrink-0 text-muted-foreground">
          <ChevronDown size={20} strokeWidth={2.2} />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="m-0 pb-6 pr-10 text-[15px] text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(-1); // all collapsed on load
  return (
    <section id="faq" style={{ background: "white", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[820px]">
        <SectionHead eyebrow="SSS" title="Aklındaki sorulara cevap." />
        <div className="mt-12">
          {FAQS.map((f, i) => (
            <FAQItem key={f.q} q={f.q} a={f.a} isOpen={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Lead Form ────────────────────────────────────────────────────────────────

function LeadForm() {
  const [form, setForm] = useState({ businessName: "", name: "", phone: "", email: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error || "Bir hata oluştu."); setStatus("error"); }
      else setStatus("success");
    } catch {
      setErrMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
      setStatus("error");
    }
  }

  const inputClass = "w-full rounded-[12px] border border-border bg-card px-3.5 py-3 text-[15px] text-foreground outline-none focus:border-foreground/40 transition-colors";

  return (
    <section id="contact" style={{ background: "var(--makas-bg)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1100px] grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
        <FadeUp>
          <Eyebrow className="mb-4 block">İletişim</Eyebrow>
          <h2 className="font-display font-bold text-foreground leading-[1.05]" style={{ fontSize: "clamp(30px, 4.2vw, 44px)", letterSpacing: "-1.2px" }}>
            Salonunuz için<br />sistemi konuşalım.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed" style={{ fontSize: "17px" }}>
            Formu doldurun, en kısa sürede size ulaşıp salonunuza özel kurulumu başlatalım.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-secondary-foreground">
            {["Ücretsiz kurulum + ilk ay rehberlik", "Sözleşme yok, istediğin zaman iptal", "WhatsApp destek hattı"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <CheckCircle size={16} strokeWidth={2.2} className="text-foreground shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </FadeUp>

        {status === "success" ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-7 py-12 text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-600" />
            <p className="mb-1.5 text-[17px] font-semibold text-emerald-800">Mesajınızı aldık!</p>
            <p className="text-sm text-emerald-900">En kısa sürede döneceğiz.</p>
          </motion.div>
        ) : (
          <FadeUp delay={0.1}>
            <form onSubmit={submit} className="rounded-[20px] border border-border bg-card p-7 flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-business" className="mb-1.5 block text-[13px] font-medium text-foreground">Salon adı *</label>
                  <input id="lead-business" required value={form.businessName} onChange={set("businessName")} placeholder="Salon adınız" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="lead-name" className="mb-1.5 block text-[13px] font-medium text-foreground">Adınız *</label>
                  <input id="lead-name" required value={form.name} onChange={set("name")} placeholder="Adınız Soyadınız" className={inputClass} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-phone" className="mb-1.5 block text-[13px] font-medium text-foreground">Telefon *</label>
                  <input id="lead-phone" required type="tel" value={form.phone} onChange={set("phone")} placeholder="0555 123 4567" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="lead-email" className="mb-1.5 block text-[13px] font-medium text-foreground">E-posta</label>
                  <input id="lead-email" type="email" value={form.email} onChange={set("email")} placeholder="salon@email.com" className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="lead-message" className="mb-1.5 block text-[13px] font-medium text-foreground">Mesaj</label>
                <textarea id="lead-message" value={form.message} onChange={set("message")} placeholder="Salon hakkında kısaca bilgi verin..." rows={3} className={`${inputClass} resize-none`} />
              </div>
              {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-1 rounded-[12px] bg-foreground px-6 py-3.5 text-[15px] font-semibold text-background hover:opacity-85 disabled:opacity-50 transition-opacity cursor-pointer border-0"
              >
                {status === "loading" ? "Gönderiliyor…" : "Gönder"}
              </button>
            </form>
          </FadeUp>
        )}
      </div>
    </section>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background" style={{ fontFamily: "inherit" }}>
      <LandingNavbar />
      <main>
        <Hero />
        <Discovery />
        <PlatformSection />
        <SocialProofStrip />
        <WhyDifferent />
        <TestimonialBand />
        <FeaturesSection />
        <MobileAppSection />
        <OwnYourBrand />
        <DemoShowcase />
        <Pricing />
        <FAQ />
        <LeadForm />
      </main>
      <LandingFooter />
    </div>
  );
}

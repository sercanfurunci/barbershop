"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Search,
  CheckCircle,
  Zap,
  Shield,
  Bell,
  TrendingUp,
  Star,
} from "lucide-react";

import Eyebrow from "@/components/shared/Eyebrow";
import { CITIES } from "@/components/landing/data/landingData";

// ─── HeroPreview (dashboard mockup shown on the right side) ──────────────────

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

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function HeroSection() {
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

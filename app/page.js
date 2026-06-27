"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Scissors,
  MessageCircle,
  BarChart2,
  Star,
  Zap,
  CheckCircle,
  ChevronDown,
  ArrowRight,
  PlayCircle,
  CreditCard,
  Users,
  Megaphone,
  Settings,
  ExternalLink,
} from "lucide-react";

import Eyebrow from "@/components/shared/Eyebrow";
import PillButton from "@/components/shared/PillButton";
import CTAGroup from "@/components/shared/CTAGroup";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ─── Section heading (Mangomint pattern: eyebrow + giant H2) ─────────────────

function SectionHead({ eyebrow, title, sub, align = "center", maxWidth = 720, light = false }) {
  const alignCls = align === "left" ? "text-left mx-0" : "text-center mx-auto";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={alignCls}
      style={{ maxWidth }}
    >
      {eyebrow && (
        <div className={align === "left" ? "mb-4" : "mb-4"}>
          <Eyebrow className={light ? "text-white/60" : ""}>{eyebrow}</Eyebrow>
        </div>
      )}
      <h2
        className={`font-display font-bold leading-[1.05] ${light ? "text-white" : "text-foreground"}`}
        style={{
          fontSize: "clamp(34px, 5.4vw, 56px)",
          letterSpacing: "-1.6px",
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-5 leading-relaxed ${light ? "text-white/70" : "text-muted-foreground"}`}
          style={{ fontSize: "clamp(16px, 1.6vw, 19px)" }}
        >
          {sub}
        </p>
      )}
    </motion.div>
  );
}

// ─── Hero (asymmetric, Mangomint-style) ───────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 100% 0%, rgba(17,17,17,0.04) 0%, transparent 60%)",
        }}
      />
      <div
        className="relative mx-auto max-w-[1200px] px-6"
        style={{ paddingTop: "clamp(56px, 8vw, 96px)", paddingBottom: "clamp(64px, 9vw, 112px)" }}
      >
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Eyebrow>Berber & Kuaför yazılımı</Eyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 font-display font-bold text-foreground"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                letterSpacing: "-2.2px",
                lineHeight: 1.02,
              }}
            >
              Salonunuzu büyüten her şey, tek yerde.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6 max-w-[520px] text-muted-foreground"
              style={{ fontSize: "clamp(17px, 1.8vw, 20px)", lineHeight: 1.55 }}
            >
              Randevu, müşteri takibi, hatırlatma ve gelir raporları. Hızlı,
              modern, her cihazda kusursuz çalışan bir platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <PillButton variant="primary" size="lg" onClick={() => scrollTo("contact")}>
                14 Gün Ücretsiz Dene
              </PillButton>
              <button
                onClick={() => scrollTo("demo")}
                className="inline-flex items-center gap-2 text-[15px] font-medium text-foreground hover:opacity-70"
              >
                <PlayCircle size={20} strokeWidth={1.8} />
                Canlı demoyu izle
              </button>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 list-none p-0"
            >
              {["1 günde kurulum", "Sözleşme yok", "Türkçe destek"].map((t) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-2 text-[13.5px] font-medium text-secondary-foreground"
                >
                  <CheckCircle size={15} strokeWidth={2.2} className="shrink-0 text-foreground" />
                  {t}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Right — layered preview card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
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
  // ponytail: SSR-safe inline preview (not the real product, a representative card).
  // Skipped: real iframe / live mock. Add when there's a hosted public widget.
  return (
    <div className="relative">
      <div
        className="rounded-[22px] bg-card border border-border p-6 relative z-10"
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <Eyebrow>Bugün</Eyebrow>
            <p className="font-display text-xl font-bold text-foreground mt-1">
              Salih Usta — Randevular
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
            <Calendar size={16} className="text-foreground" />
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            { t: "09:30", n: "Ahmet Yıldız", s: "Sakal + Saç", c: "bg-emerald-100 text-emerald-700" },
            { t: "10:15", n: "Mehmet K.",    s: "Tıraş",         c: "bg-amber-100 text-amber-700" },
            { t: "11:00", n: "Burak Demir",  s: "Saç",            c: "bg-sky-100 text-sky-700" },
            { t: "12:30", n: "Onur Ş.",      s: "Tıraş + Yıkama", c: "bg-violet-100 text-violet-700" },
          ].map((r) => (
            <div
              key={r.t}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-3"
            >
              <span className="text-xs font-mono-custom text-muted-foreground w-12 shrink-0">
                {r.t}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{r.n}</p>
                <p className="text-xs text-muted-foreground truncate">{r.s}</p>
              </div>
              <span className={`text-[10.5px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${r.c}`}>
                Onaylı
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Bugün</span>
          <span className="font-semibold text-foreground">12 randevu • ₺2.840</span>
        </div>
      </div>

      {/* Floating mini-card */}
      <div
        className="absolute -bottom-6 -left-6 rounded-2xl bg-foreground text-background px-4 py-3.5 flex items-center gap-3 z-20"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
          <MessageCircle size={16} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider opacity-60 font-mono-custom">
            WhatsApp
          </p>
          <p className="text-xs font-semibold">Hatırlatma gönderildi</p>
        </div>
      </div>
    </div>
  );
}

// ─── Social proof strip ───────────────────────────────────────────────────────

function SocialProofStrip() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:py-14">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-center">
          <h3
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(22px, 2.6vw, 32px)",
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: "-0.6px",
            }}
          >
            Türkiye'nin dört bir yanından berber ve kuaförler MAKAS'ı seçiyor.
          </h3>
          <div className="flex flex-wrap items-center gap-6 md:gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" className="text-foreground" />
                ))}
              </div>
              <span className="font-semibold text-foreground">4.9/5</span>
              <span className="text-muted-foreground">salon memnuniyeti</span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div>
              <span className="font-semibold text-foreground">%99.9</span>
              <span className="text-muted-foreground ml-2">çalışma süresi</span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div>
              <span className="font-semibold text-foreground">1 gün</span>
              <span className="text-muted-foreground ml-2">kurulum</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── "Why we're different" plain-text band ───────────────────────────────────

function WhyDifferent() {
  return (
    <section
      className="bg-background"
      style={{ padding: "clamp(80px, 11vw, 144px) clamp(20px, 4vw, 32px)" }}
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

// ─── Dark testimonial band (full-bleed, breaks the cream) ────────────────────

function TestimonialBand() {
  return (
    <section className="bg-foreground text-background relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 20% 30%, rgba(245,241,235,0.06) 0%, transparent 60%)",
        }}
      />
      <div
        className="relative mx-auto max-w-[1100px] px-6"
        style={{ paddingTop: "clamp(80px, 11vw, 128px)", paddingBottom: "clamp(80px, 11vw, 128px)" }}
      >
        <SectionHead
          eyebrow="Müşteri hikayeleri"
          title="Türkiye'nin gerçek salonları MAKAS'ı seviyor."
          light
        />

        <div
          className="mt-14 grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {[
            {
              quote:
                "Telefonla randevu trafiği yüzde 60 azaldı. Müşteriler kendi randevusunu alıyor, biz de işimize odaklanıyoruz.",
              name: "Abdurrahman Çelik",
              role: "Exclusive Salon — Darıca",
              link: "/abdurrahman",
            },
            {
              quote:
                "Eski sistemden geçiş 1 günde tamamlandı. Berberlerimin hepsi ilk hafta içinde rahatça kullanmaya başladı.",
              name: "Makas Demo Salon",
              role: "Örnek salon — Online inceleyin",
              link: "/demo",
            },
          ].map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl bg-white/[0.06] border border-white/10 p-7 flex flex-col"
            >
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" className="text-amber-300" />
                ))}
              </div>
              <p
                className="font-display text-background leading-snug flex-1"
                style={{ fontSize: "clamp(18px, 1.8vw, 22px)", letterSpacing: "-0.3px" }}
              >
                "{t.quote}"
              </p>
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-background">{t.name}</p>
                  <p className="text-[12.5px] text-background/60">{t.role}</p>
                </div>
                <Link
                  href={t.link}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-background/80 hover:text-background"
                >
                  Ziyaret et <ExternalLink size={12} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bento feature grid (1 hero card + 4 supporting) ─────────────────────────
// 5 features in a 3-col bento: row 1 = featured spans 2 cols + 1 small.
// Row 2 = 3 equal. Linear/Stripe pattern — hero card carries a visual to make
// the asymmetry feel intentional, not lopsided.

const FEATURED = {
  eyebrow: "Randevu",
  title: "Akıllı takvim, çakışmasız randevu.",
  desc:
    "Berber başına çalışma saatleri, mola yönetimi, çakışma engelleme. Müşteri kendi randevusunu alıyor — sen işine bakıyorsun.",
  items: [
    "7/24 online rezervasyon",
    "Berber bazlı takvim görünümü",
    "Mola & izin & tatil yönetimi",
    "Çift rezervasyon engelleme",
  ],
};

const SUPPORTING = [
  {
    eyebrow: "Ödeme & gelir",
    title: "Net hesap, net rapor.",
    desc: "Günlük gelir, berber bazlı performans, basit ve doğru raporlar.",
    Icon: CreditCard,
    items: ["Günlük gelir", "Berber prim takibi", "Excel'e aktarma"],
  },
  {
    eyebrow: "Müşteri",
    title: "Sadakat tarafı sende.",
    desc: "Notlar, geçmiş randevular, doğum günü — hepsi kendi sisteminde.",
    Icon: Users,
    items: ["Müşteri notları", "Randevu geçmişi", "Sık gelen etiketleri"],
  },
  {
    eyebrow: "Pazarlama",
    title: "WhatsApp & SMS, otomatik.",
    desc: "Otomatik hatırlatma, kaçırılan randevu mesajı, yorum daveti.",
    Icon: Megaphone,
    items: ["Otomatik hatırlatma", "WhatsApp şablonları", "Yorum daveti"],
  },
  {
    eyebrow: "Yönetim",
    title: "Kontrol senin elinde.",
    desc: "Çoklu kullanıcı, izin seviyeleri, mobil panel — her şey net.",
    Icon: Settings,
    items: ["Admin & berber panelleri", "Rol & izinler", "Hizmet kataloğu"],
  },
];

function FeaturedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="md:col-span-2 md:row-span-1 rounded-3xl bg-card border border-border p-8 lg:p-10 flex flex-col lg:flex-row gap-8 lg:gap-10 relative overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Subtle decorative gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(17,17,17,0.04) 0%, transparent 70%)" }}
      />
      {/* Copy */}
      <div className="relative flex-1 min-w-0 flex flex-col">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <Calendar size={22} strokeWidth={1.8} />
        </div>
        <Eyebrow className="mb-3 block">{FEATURED.eyebrow}</Eyebrow>
        <h3
          className="font-display font-bold text-foreground leading-[1.1] mb-4"
          style={{ fontSize: "clamp(24px, 2.4vw, 32px)", letterSpacing: "-0.8px" }}
        >
          {FEATURED.title}
        </h3>
        <p className="text-[15.5px] text-muted-foreground leading-relaxed mb-6 max-w-md">
          {FEATURED.desc}
        </p>
        <ul className="m-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 list-none p-0 mt-auto">
          {FEATURED.items.map((it) => (
            <li key={it} className="flex items-start gap-2.5 text-[14px] text-secondary-foreground">
              <CheckCircle size={15} strokeWidth={2.2} className="shrink-0 mt-0.5 text-foreground" />
              {it}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual — mini schedule preview */}
      <div className="relative lg:w-[280px] shrink-0">
        <div className="rounded-2xl bg-background border border-border p-4 h-full">
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
              { t: "12:00", n: "Onur Ş.",   c: "border-violet-300 bg-violet-50" },
            ].map((r) => (
              <div
                key={r.t}
                className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${r.c}`}
              >
                <span className="text-[10.5px] font-mono-custom text-muted-foreground w-9 shrink-0">
                  {r.t}
                </span>
                <span className={`text-[12px] font-medium truncate ${r.empty ? "text-muted-foreground italic" : "text-foreground"}`}>
                  {r.empty ? "Boş slot" : r.n}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SupportingCard({ data, delay = 0 }) {
  const { eyebrow, title, desc, Icon, items } = data;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay }}
      className="rounded-3xl bg-card border border-border p-7 flex flex-col h-full transition-shadow hover:shadow-[var(--shadow-card)]"
    >
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <Eyebrow className="mb-2 block">{eyebrow}</Eyebrow>
      <h3 className="font-display text-[20px] font-bold text-foreground tracking-[-0.4px] leading-[1.2] mb-3">
        {title}
      </h3>
      <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">{desc}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 mt-auto pt-2 border-t border-border">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-center gap-2.5 text-[13px] text-secondary-foreground pt-2"
          >
            <span className="h-1 w-1 rounded-full bg-foreground/40 shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function ExploreGrid() {
  return (
    <section
      id="explore"
      className="bg-secondary"
      style={{ padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <SectionHead
          eyebrow="Platform"
          title="Salon yönetiminin tamamı, tek panelde."
          sub="Randevu defteri, kasa programı, müşteri yönetimi ve hatırlatma sistemini ayrı ayrı kullanmaya son."
        />

        {/* Bento: 3-col grid, featured spans 2 cols on row 1 */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Row 1 */}
          <FeaturedCard />
          <SupportingCard data={SUPPORTING[0]} delay={0.08} />

          {/* Row 2 */}
          {SUPPORTING.slice(1).map((c, i) => (
            <SupportingCard key={c.eyebrow} data={c} delay={(i + 2) * 0.06} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Own Your Brand ───────────────────────────────────────────────────────────

function OwnYourBrand() {
  return (
    <section
      className="bg-background"
      style={{ padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Marka sahipliği"
          title={<>Müşterin senin. Pazaryeri arada yok.</>}
          sub="Instagram'da paylaşılan link senin salonunu açar — rakip listesi değil."
        />

        <div className="mt-14 grid md:grid-cols-2 gap-5">
          {/* Pazaryeri */}
          <div className="rounded-2xl border border-border bg-card p-7 opacity-90">
            <Eyebrow className="mb-4 block">Pazaryeri platformları</Eyebrow>
            <div
              className="mb-5 rounded-lg bg-secondary px-3 py-2.5 text-xs text-muted-foreground break-all"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              platform.com/s/DsJTCVXovTS21DUFJ…
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {[
                "Müşteri senin değil, platformun markasını hatırlar",
                "Aynı sayfada rakip salonlar bir tık ötede",
                "Müşteri verisi platformun veritabanında",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-sm text-secondary-foreground leading-relaxed">
                  <span className="shrink-0 text-muted-foreground">—</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Makas */}
          <div
            className="rounded-2xl bg-foreground text-background p-7"
            style={{ boxShadow: "var(--shadow-pop)" }}
          >
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-background/70 font-mono-custom">
              MAKAS ile
            </div>
            <div
              className="mb-5 rounded-lg bg-white/10 px-3 py-2.5 text-[13px] font-semibold text-background break-all"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              senin-salonun.com
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {[
                "Müşteri salonu — yani seni hatırlar",
                "Sayfanda rakip yok, sadece sen varsın",
                "Tüm müşteri verisi tamamen senin",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-sm text-background/90 leading-relaxed">
                  <span className="shrink-0 text-background">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Demo Showcase ────────────────────────────────────────────────────────────

const DEMOS = [
  { name: "Abdurrahman Çelik Exclusive Salon", slug: "abdurrahman", tag: "Gerçek müşterimiz · Darıca, Kocaeli" },
  { name: "Makas Demo Salon",                  slug: "demo",        tag: "Sistemi inceleyin — örnek salon" },
];

function DemoShowcase() {
  return (
    <section
      id="demo"
      className="bg-secondary"
      style={{ padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Canlı örnekler"
          title="Gerçek bir randevu deneyimi."
          sub="MAKAS üzerinde çalışan salonları kendi telefonunuzdan inceleyin."
        />

        <div
          className="mx-auto mt-12 grid gap-5"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            maxWidth: 800,
          }}
        >
          {DEMOS.map(({ name, slug, tag }, i) => (
            <motion.div
              key={slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link
                href={`/${slug}`}
                className="group block rounded-2xl border border-border bg-card p-7 no-underline transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PLAN = {
  monthly: "₺500",
  features: [
    "Sınırsız berber",
    "Sınırsız randevu",
    "Admin paneli + müşteri yönetimi",
    "Kendi salonadi.makas.tech adresi",
    "Müşteri notları + geçmiş takibi",
    "Berber performans raporları",
    "Mobil uyumlu rezervasyon sayfası",
  ],
};

const ADDONS = [
  { name: "WhatsApp hatırlatma",    detail: "100 mesaj / ay dahil, sonrası kullanım başına" },
  { name: "SMS cüzdanı",            detail: "Ön ödemeli paket — kullandıkça düşer" },
  { name: "Özel alan adı yönetimi", detail: "₺200 / yıl (alan adı ücreti hariç)" },
];

function Pricing() {
  return (
    <section
      id="pricing"
      className="bg-background"
      style={{ padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Fiyatlandırma"
          title="Tek plan, net fiyat."
          sub="Karmaşık paket yok, gizli ücret yok. Sınırsız her şey."
        />

        <div className="mt-12 grid lg:grid-cols-[1fr_1.1fr] gap-6 items-stretch">
          {/* Plan card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-foreground p-9 text-background flex flex-col"
            style={{ boxShadow: "var(--shadow-pop)" }}
          >
            <Eyebrow className="text-background/60 mb-3 block">Standart Plan</Eyebrow>
            <div className="flex flex-wrap items-baseline gap-2 mb-6">
              <span className="text-[56px] font-display font-bold leading-none tracking-[-1.5px]">
                {PLAN.monthly}
              </span>
              <span className="text-base opacity-75">/ ay</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0 mb-7 flex-1">
              {PLAN.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14.5px]">
                  <CheckCircle size={16} strokeWidth={2.2} className="shrink-0 mt-0.5 opacity-90" />
                  {f}
                </li>
              ))}
            </ul>
            <PillButton
              variant="secondary"
              size="lg"
              onClick={() => scrollTo("contact")}
              className="w-full"
            >
              14 Gün Ücretsiz Dene
            </PillButton>
          </motion.div>

          {/* Add-ons */}
          <div className="rounded-3xl border border-border bg-card p-9 flex flex-col">
            <Eyebrow className="mb-4 block">Ek hizmetler</Eyebrow>
            <h3 className="font-display text-2xl font-bold text-foreground tracking-[-0.5px] mb-6">
              İhtiyacın olduğunda ekle.
            </h3>
            <ul className="m-0 flex list-none flex-col gap-5 p-0 flex-1">
              {ADDONS.map((a) => (
                <li
                  key={a.name}
                  className="flex flex-col gap-1 pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <span className="text-[15px] font-semibold text-foreground">{a.name}</span>
                  <span className="text-[13.5px] text-muted-foreground leading-relaxed">{a.detail}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[12.5px] text-muted-foreground">
              Kurulum ücretsiz, istediğin zaman iptal et. KDV hariç.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

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
        className="flex w-full items-center justify-between gap-4 border-0 bg-transparent py-5 text-left text-[17px] font-semibold text-foreground tracking-[-0.2px]"
        style={{ cursor: "pointer" }}
      >
        <span>{q}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="inline-flex shrink-0 text-muted-foreground"
        >
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
  const [open, setOpen] = useState(0);
  return (
    <section
      id="faq"
      className="bg-background"
      style={{ padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[820px]">
        <SectionHead eyebrow="SSS" title="Aklındaki sorulara cevap." />
        <div className="mt-12">
          {FAQS.map((f, i) => (
            <FAQItem
              key={f.q}
              q={f.q}
              a={f.a}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Lead Form ────────────────────────────────────────────────────────────────

function LeadForm() {
  const [form, setForm] = useState({
    businessName: "",
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrMsg(data.error || "Bir hata oluştu.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
      setStatus("error");
    }
  }

  const inputClass =
    "w-full rounded-[10px] border border-border bg-card px-3.5 py-3 text-base text-foreground outline-none focus:border-foreground transition-colors";

  return (
    <section
      id="contact"
      className="bg-secondary"
      style={{ padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[1100px] grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
        <div>
          <Eyebrow className="mb-4 block">İletişim</Eyebrow>
          <h2
            className="font-display font-bold text-foreground leading-[1.05]"
            style={{ fontSize: "clamp(32px, 4.6vw, 48px)", letterSpacing: "-1.4px" }}
          >
            Salonunuz için<br />sistemi konuşalım.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed" style={{ fontSize: "17px" }}>
            Formu doldurun, en kısa sürede size ulaşıp salonunuza özel kurulumu
            başlatalım.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-secondary-foreground">
            {[
              "Ücretsiz kurulum + ilk ay rehberlik",
              "Sözleşme yok, istediğin zaman iptal",
              "WhatsApp destek hattı",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <CheckCircle size={16} strokeWidth={2.2} className="text-foreground shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-7 py-12 text-center"
          >
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-600" />
            <p className="mb-1.5 text-[17px] font-semibold text-emerald-800">
              Mesajınızı aldık!
            </p>
            <p className="text-sm text-emerald-900">En kısa sürede döneceğiz.</p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            onSubmit={submit}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-8"
          >
            <Field label="Salon Adı *">
              <input
                className={inputClass}
                placeholder="Örnek: Ahmet Berber Salonu"
                value={form.businessName}
                onChange={set("businessName")}
                required
              />
            </Field>

            <Field label="İsim *">
              <input
                className={inputClass}
                placeholder="Adınız Soyadınız"
                value={form.name}
                onChange={set("name")}
                required
              />
            </Field>

            <Field label="Telefon *">
              <input
                className={inputClass}
                placeholder="0532 000 00 00"
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                required
              />
            </Field>

            <Field label="E-posta">
              <input
                className={inputClass}
                placeholder="ornek@mail.com"
                type="email"
                value={form.email}
                onChange={set("email")}
              />
            </Field>

            <Field label="Mesaj">
              <textarea
                className={inputClass}
                style={{ minHeight: 100, resize: "vertical" }}
                placeholder="Salonunuz, ihtiyaçlarınız veya sorularınız..."
                value={form.message}
                onChange={set("message")}
              />
            </Field>

            {status === "error" && (
              <p className="text-[13px] text-destructive">{errMsg}</p>
            )}

            <PillButton
              variant="primary"
              size="lg"
              type="submit"
              disabled={status === "loading"}
              className="w-full"
            >
              {status === "loading" ? "Gönderiliyor…" : "Bana Ulaşın"}
            </PillButton>
          </motion.form>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-secondary-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Sticky Mobile CTA ────────────────────────────────────────────────────────

function StickyMobileCTA() {
  return (
    <div
      className="makas-sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-border pb-safe-sm px-3.5 pt-2.5"
      style={{
        background: "color-mix(in oklab, var(--makas-bg) 92%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <PillButton variant="primary" size="md" onClick={() => scrollTo("contact")} className="w-full">
        14 Gün Ücretsiz Dene
      </PillButton>
      <style>{`@media (min-width: 768px) { .makas-sticky-cta { display: none !important; } }`}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div
      className="min-h-dvh bg-background"
      style={{ fontFamily: "inherit" }}
    >
      <style>{`@media (max-width: 767px){ body{ padding-bottom: calc(76px + env(safe-area-inset-bottom)); } }`}</style>
      <LandingNavbar />
      <main>
        <Hero />
        <SocialProofStrip />
        <WhyDifferent />
        <TestimonialBand />
        <ExploreGrid />
        <OwnYourBrand />
        <DemoShowcase />
        <Pricing />
        <FAQ />
        <LeadForm />
      </main>
      <LandingFooter />
      <StickyMobileCTA />
    </div>
  );
}

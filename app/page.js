"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  Scissors,
  DollarSign,
  MessageCircle,
  BarChart2,
  Star,
  Building2,
  Zap,
  Layers,
  ExternalLink,
  CheckCircle,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:       "#F8F6F2",
  card:     "#FFFFFF",
  border:   "rgba(17,17,17,0.08)",
  primary:  "#111111",
  secondary:"#57514B",
  muted:    "#6E6760",

  surface:  "#F1EEE8",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

// MAKAS mark. `variant="dark"` = black mark on light bg; "light" = white mark on dark bg.
function MakasMark({ size, variant = "dark", className }) {
  const src = variant === "dark" ? "/logo-dark.svg" : "/logo-light.svg";
  return (
    <img
      src={src}
      alt="MAKAS"
      className={className}
      {...(size ? { width: size, height: size } : {})}
      style={{ display: "block" }}
    />
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(248,246,242,0.85)",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <nav
        className="h-[68px] md:h-[76px]"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3.5 md:gap-4">
          <MakasMark variant="dark" className="block h-9 w-9 md:h-12 md:w-12" />
          <span
            className="font-display text-[22px] md:text-[26px]"
            style={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: C.primary,
              lineHeight: 1,
            }}
          >
            MAKAS
          </span>
        </div>

        {/* CTAs — desktop: both, mobile: only primary */}
        <div className="hidden sm:flex" style={{ gap: 10 }}>
          <button
            onClick={() => scrollTo("demo")}
            style={{
              padding: "8px 16px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: "transparent",
              color: C.secondary,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Demo Gör
          </button>
          <button
            onClick={() => scrollTo("contact")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 8,
              background: C.primary,
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            İletişime Geç
          </button>
        </div>
        <button
          onClick={() => scrollTo("contact")}
          className="sm:hidden"
          style={{
            padding: "8px 14px",
            border: "none",
            borderRadius: 8,
            background: C.primary,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          İletişim
        </button>
      </nav>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      style={{
        padding: "96px 24px 80px",
        maxWidth: 1100,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        <motion.p
          variants={fade}
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 20,
            background: C.surface,
            color: C.secondary,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 24,
          }}
        >
          Premium berber teknolojisi
        </motion.p>

        <motion.h1
          variants={fade}
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 800,
            letterSpacing: "-2px",
            lineHeight: 1.08,
            color: C.primary,
            marginBottom: 20,
            whiteSpace: "pre-line",
          }}
        >
          {"Boş koltukları azaltın.\nRandevularınızı otomatik yönetin."}
        </motion.h1>

        <motion.p
          variants={fade}
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: C.muted,
            maxWidth: 560,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Telefon trafiğini azaltın, müşterileriniz online randevu alsın.
        </motion.p>

        <motion.div
          variants={fade}
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
        >
          <button
            onClick={() => scrollTo("contact")}
            style={{
              padding: "14px 28px",
              borderRadius: 10,
              background: C.primary,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Demo Talep Et
          </button>
          <button
            onClick={() => scrollTo("contact")}
            style={{
              padding: "14px 28px",
              borderRadius: 10,
              background: "transparent",
              color: C.primary,
              fontSize: 15,
              fontWeight: 600,
              border: `1.5px solid ${C.border}`,
              cursor: "pointer",
            }}
          >
            İletişime Geç
          </button>
        </motion.div>

        <motion.p
          variants={fade}
          style={{
            fontSize: 13,
            color: C.muted,
            marginTop: 14,
          }}
        >
          Kurulum ve demo için bizimle iletişime geçin.
        </motion.p>

        <motion.ul
          variants={fade}
          style={{
            listStyle: "none",
            padding: 0,
            margin: "32px auto 0",
            maxWidth: 720,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px 22px",
          }}
        >
          {[
            "1 günde kurulum",
            "Size özel salon adresi",
            "WhatsApp destek hattı",
            "Mobil uyumlu kullanım",
          ].map((t) => (
            <li
              key={t}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
                color: C.secondary,
                fontWeight: 500,
              }}
            >
              <CheckCircle size={15} strokeWidth={2.2} style={{ color: C.primary, flexShrink: 0 }} />
              {t}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  { Icon: Zap,       title: "Kurulum",            desc: "Salonunuza özel sisteminizi kuruyoruz." },
  { Icon: Scissors,  title: "Özelleştirme",       desc: "Hizmetlerinizi, berberlerinizi ve çalışma saatlerinizi ayarlıyoruz." },
  { Icon: Calendar,  title: "Kullanıma Başlayın", desc: "Müşterileriniz online randevu almaya başlıyor." },
];

function HowItWorks() {
  return (
    <section id="how" style={{ padding: "72px 24px 40px", background: C.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1px", color: C.primary, marginBottom: 10 }}>
            Nasıl Çalışır
          </h2>
          <p style={{ fontSize: 15, color: C.muted, maxWidth: 520, margin: "0 auto" }}>
            Üç adımda salonunuz yayında.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {STEPS.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -3, boxShadow: "0 10px 28px rgba(17,17,17,0.08)" }}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "26px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                position: "relative",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 18, right: 20,
                fontSize: 12, fontWeight: 700, letterSpacing: "0.18em",
                color: C.muted,
              }}>
                0{i + 1}
              </span>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: C.surface,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.primary,
              }}>
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.primary, letterSpacing: "-0.3px" }}>
                {title}
              </h3>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6 }}>
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: Calendar,      title: "Online Randevu",       desc: "7/24 müşterileriniz randevu alabilir" },
  { Icon: CalendarDays,  title: "Takvim Yönetimi",      desc: "Tüm ekibinizin programı tek ekranda" },
  { Icon: Scissors,      title: "Berber Yönetimi",      desc: "Berber profilleri, çalışma saatleri" },
  { Icon: DollarSign,    title: "Hizmet & Fiyat",       desc: "Hizmetlerinizi ve fiyatlarınızı kolayca yönetin" },
  { Icon: MessageCircle, title: "SMS/WhatsApp",          desc: "Otomatik randevu hatırlatmaları" },
  { Icon: BarChart2,     title: "Gelir Takibi",         desc: "Günlük, haftalık gelir raporları" },
  { Icon: Star,          title: "Otomatik Yorum",       desc: "Randevu sonrası SMS ile yorum daveti" },
  { Icon: Building2,     title: "Müşteri Yönetimi",     desc: "Notlar, geçmiş randevular, telefon takibi" },
];

function Features() {
  return (
    <section
      style={{
        padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 32px)",
        background: C.surface,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: "center",
            fontSize: "clamp(24px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-1px",
            color: C.primary,
            marginBottom: 48,
          }}
        >
          Berberinizi büyüten her şey
        </motion.h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "24px 20px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: C.surface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Icon size={20} color={C.primary} />
              </div>
              <p style={{ fontWeight: 600, fontSize: 15, color: C.primary, marginBottom: 6 }}>
                {title}
              </p>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why us ───────────────────────────────────────────────────────────────────

const WHY = [
  { Icon: Star,   title: "Premium Tasarım",  desc: "Her salon için özel, şık bir web sitesi" },
  { Icon: Zap,    title: "Hızlı Randevu",    desc: "Müşteri 3 adımda randevusunu tamamlar" },
  { Icon: Layers, title: "Kolay Yönetim",    desc: "Teknik bilgi gerektirmez, her şey sezgisel" },
];

function WhyUs() {
  return (
    <section style={{ padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 32px)", maxWidth: 1100, margin: "0 auto" }}>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: "center",
          fontSize: "clamp(24px, 4vw, 40px)",
          fontWeight: 700,
          letterSpacing: "-1px",
          color: C.primary,
          marginBottom: 48,
        }}
      >
        Neden MAKAS?
      </motion.h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
        }}
      >
        {WHY.map(({ Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            style={{ textAlign: "center", padding: "32px 24px" }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: C.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Icon size={24} color="#fff" />
            </div>
            <p style={{ fontWeight: 700, fontSize: 17, color: C.primary, marginBottom: 8 }}>
              {title}
            </p>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Own Your Brand ───────────────────────────────────────────────────────────

function OwnYourBrand() {
  return (
    <section style={{ padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 32px)", background: C.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h2 style={{
            fontSize: "clamp(26px, 4.2vw, 44px)", fontWeight: 700,
            letterSpacing: "-1px", color: C.primary, marginBottom: 14, lineHeight: 1.15,
          }}>
            Kendi markan. Kendi sistemin.<br />Kendi müşterin.
          </h2>
          <p style={{
            fontSize: 16, color: C.muted, lineHeight: 1.65,
            maxWidth: 620, margin: "0 auto",
          }}>
            Instagram'da paylaşıldığında müşteri başka platformu değil, <strong style={{ color: C.primary, fontWeight: 700 }}>seni</strong> görür.
          </p>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
        }}>
          {/* Marketplace */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "26px 24px",
              opacity: 0.78,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>
              Pazaryeri Platformları
            </div>
            <div style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12, color: "#7a7a7a",
              padding: "10px 12px", background: C.surface, borderRadius: 8,
              wordBreak: "break-all", marginBottom: 16,
            }}>
              platform.com/s/DsJTCVXovTS21DUFJ…
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Müşteri senin değil, platformun markasını hatırlar",
                "Aynı sayfada rakip salonlar bir tık ötede",
                "Müşteriler platformun veritabanında — sen değil",
              ].map((t) => (
                <li key={t} style={{ display: "flex", gap: 10, fontSize: 14, color: C.secondary, lineHeight: 1.5 }}>
                  <span style={{ color: "#9a9a9a", fontWeight: 700, flexShrink: 0 }}>—</span>{t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Makas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{
              background: C.primary,
              borderRadius: 16,
              padding: "26px 24px",
              color: "#fff",
              boxShadow: "0 12px 40px rgba(17,17,17,0.18)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", marginBottom: 14 }}>
              Makas ile
            </div>
            <div style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13, color: "#fff",
              padding: "10px 12px", background: "rgba(255,255,255,0.08)", borderRadius: 8,
              wordBreak: "break-all", marginBottom: 16, fontWeight: 600,
            }}>
              senin-salonun.com
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Müşteri salonu değil, seni hatırlar",
                "Rakip yok — sayfanda sadece sen varsın",
                "Müşteri verisi ve geçmişi tamamen senin",
              ].map((t) => (
                <li key={t} style={{ display: "flex", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.92)", lineHeight: 1.5 }}>
                  <span style={{ color: "#fff", fontWeight: 700, flexShrink: 0 }}>✓</span>{t}
                </li>
              ))}
            </ul>
          </motion.div>
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
      style={{
        padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 32px)",
        background: C.surface,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h2
            style={{
              fontSize: "clamp(24px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-1px",
              color: C.primary,
              marginBottom: 12,
            }}
          >
            Örnek salonlarımıza göz atın
          </h2>
          <p style={{ fontSize: 15, color: C.muted }}>
            Gerçek salonlar, gerçek randevu deneyimi
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            maxWidth: 760,
            margin: "0 auto",
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
                style={{
                  display: "block",
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "28px 24px",
                  textDecoration: "none",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(17,17,17,0.10)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: C.surface,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                    fontSize: 22,
                  }}
                >
                  ✂️
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, color: C.primary, marginBottom: 6 }}>
                  {name}
                </p>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{tag}</p>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.primary,
                  }}
                >
                  Ziyaret Et <ExternalLink size={13} />
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
  { name: "WhatsApp hatırlatma", detail: "100 mesaj / ay dahil, sonrası kullanım başına" },
  { name: "SMS cüzdanı",          detail: "Ön ödemeli paket — kullandıkça düşer" },
  { name: "Özel alan adı yönetimi", detail: "₺200 / yıl (alan adı ücreti hariç)" },
];

function Pricing() {
  return (
    <section id="pricing" style={{ padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 32px)", background: C.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1px", color: C.primary, marginBottom: 12 }}>
            Tek plan, net fiyat
          </h2>
          <p style={{ fontSize: 15, color: C.muted, maxWidth: 560, margin: "0 auto" }}>
            Karmaşık paket yok, gizli ücret yok. Sınırsız her şey.
          </p>
        </motion.div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            style={{
              background: C.primary, color: "#F8F6F2",
              borderRadius: 16, padding: "36px 32px",
              display: "flex", flexDirection: "column", gap: 22,
              width: "100%", maxWidth: 460,
              boxShadow: "0 12px 40px rgba(17,17,17,0.18)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1px" }}>{PLAN.monthly}</span>
              <span style={{ fontSize: 14, opacity: 0.75 }}>/ ay</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {PLAN.features.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                  <CheckCircle size={15} strokeWidth={2.2} style={{ flexShrink: 0, opacity: 0.9 }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => scrollTo("contact")}
              style={{
                marginTop: 4, padding: "14px 18px", borderRadius: 10,
                background: "#F8F6F2", color: C.primary,
                fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                minHeight: 48,
              }}
            >
              14 Gün Ücretsiz Dene
            </button>
          </motion.div>
        </div>

        {/* Add-ons */}
        <div style={{
          marginTop: 40,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "22px 24px",
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>
            Ek hizmetler
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {ADDONS.map((a) => (
              <li key={a.name} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{a.name}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{a.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: C.muted, marginTop: 18 }}>
          Fiyata KDV dahil değildir. Kurulum ücretsiz, istediğin zaman iptal et.
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Kurulum ne kadar sürer?",                  a: "Genellikle 1 gün içinde kurulum tamamlanır." },
  { q: "Salonumun kendi adresi olacak mı?",        a: "Evet. Her salona özel salonadi.makas.tech adresi verilir. Kendi alan adınızı bağlamak isterseniz ek hizmet olarak sunuyoruz." },
  { q: "WhatsApp hatırlatma var mı?",              a: "Evet. İsteğe bağlı olarak WhatsApp ve SMS hatırlatma entegrasyonu eklenebilir." },
  { q: "Birden fazla berber ekleyebilir miyim?",   a: "Evet. Tüm ekip üyelerinizi sisteme ekleyebilir ve yönetebilirsiniz." },
  { q: "Müşteri bilgilerini takip edebilir miyim?",a: "Evet. Notlar, geçmiş randevular ve müşteri takibi sistemde yer alır." },
  { q: "Fiyatlandırma nasıl çalışıyor?",           a: "Aylık 500 ₺ sabit ücret. Sınırsız berber, sınırsız randevu. WhatsApp/SMS gibi ek hizmetler kullandığın kadar." },
];

function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          padding: "18px 22px",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          color: C.primary,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "-0.2px",
          minHeight: 56,
        }}
      >
        <span>{q}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          style={{ display: "inline-flex", color: C.secondary, flexShrink: 0 }}
        >
          <ChevronDown size={20} strokeWidth={2.2} />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <p style={{
          padding: "0 22px 20px",
          margin: 0,
          fontSize: 15,
          color: C.muted,
          lineHeight: 1.65,
        }}>
          {a}
        </p>
      </motion.div>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" style={{ padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 32px)", background: C.bg }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1px", color: C.primary, marginBottom: 10 }}>
            Sıkça Sorulan Sorular
          </h2>
          <p style={{ fontSize: 15, color: C.muted }}>
            Aklınızdaki sorulara cevaplar.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

// ─── Closing CTA ──────────────────────────────────────────────────────────────

function ClosingCTA() {
  return (
    <section style={{ padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 32px)", background: C.bg }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "clamp(40px, 7vw, 72px) clamp(28px, 5vw, 64px)",
          background: C.primary,
          color: "#F8F6F2",
          borderRadius: 22,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(17,17,17,0.18)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(248,246,242,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <p style={{
          position: "relative",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          opacity: 0.7,
          marginBottom: 14,
        }}>
          Hazır mısınız?
        </p>
        <h2 style={{
          position: "relative",
          fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: 800,
          letterSpacing: "-1.2px",
          lineHeight: 1.15,
          marginBottom: 16,
        }}>
          Salonunuzu dijitale taşıyın.
        </h2>
        <p style={{
          position: "relative",
          fontSize: "clamp(15px, 1.6vw, 18px)",
          opacity: 0.78,
          maxWidth: 560,
          margin: "0 auto 32px",
          lineHeight: 1.6,
        }}>
          Randevularınızı kolayca yönetin, müşteri kaybını azaltın.
        </p>
        <div style={{
          position: "relative",
          display: "flex", gap: 12,
          justifyContent: "center", flexWrap: "wrap",
        }}>
          <button
            onClick={() => scrollTo("contact")}
            style={{
              padding: "14px 28px",
              borderRadius: 10,
              background: "#F8F6F2",
              color: C.primary,
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
              minHeight: 48,
            }}
          >
            Demo Talep Et <ArrowRight size={16} />
          </button>
          <button
            onClick={() => scrollTo("contact")}
            style={{
              padding: "14px 28px",
              borderRadius: 10,
              background: "transparent",
              color: "#F8F6F2",
              fontSize: 15,
              fontWeight: 600,
              border: "1.5px solid rgba(248,246,242,0.32)",
              cursor: "pointer",
              minHeight: 48,
            }}
          >
            Bizimle İletişime Geç
          </button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Sticky Mobile CTA ────────────────────────────────────────────────────────

function StickyMobileCTA() {
  return (
    <div
      style={{
        position: "fixed",
        left: 0, right: 0, bottom: 0,
        padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
        background: "rgba(248,246,242,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderTop: `1px solid ${C.border}`,
        zIndex: 40,
      }}
      className="makas-sticky-cta"
    >
      <button
        onClick={() => scrollTo("contact")}
        style={{
          width: "100%",
          padding: "14px 18px",
          borderRadius: 10,
          background: C.primary,
          color: "#fff",
          fontSize: 16,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
        }}
      >
        Demo Talep Et
      </button>
      <style>{`
        @media (min-width: 768px) { .makas-sticky-cta { display: none !important; } }
      `}</style>
    </div>
  );
}

// ─── Lead Form ────────────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 16,
  background: C.card,
  color: C.primary,
  outline: "none",
  boxSizing: "border-box",
};

function LeadForm() {
  const [form, setForm] = useState({
    businessName: "",
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
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

  return (
    <section
      id="contact"
      style={{
        padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 32px)",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <h2
            style={{
              fontSize: "clamp(22px, 4vw, 36px)",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: C.primary,
              marginBottom: 10,
            }}
          >
            Salonunuz için böyle bir sistem ister misiniz?
          </h2>
          <p style={{ fontSize: 15, color: C.muted }}>
            Formu doldurun, en kısa sürede size ulaşalım.
          </p>
        </motion.div>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 14,
              padding: "32px 28px",
              textAlign: "center",
            }}
          >
            <CheckCircle size={40} color="#16A34A" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, fontSize: 17, color: "#15803D", marginBottom: 6 }}>
              Mesajınızı aldık!
            </p>
            <p style={{ fontSize: 14, color: "#166534" }}>
              En kısa sürede döneceğiz.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={submit}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.secondary, marginBottom: 6 }}>
                Salon Adı *
              </label>
              <input
                style={inputStyle}
                placeholder="Örnek: Ahmet Berber Salonu"
                value={form.businessName}
                onChange={set("businessName")}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.secondary, marginBottom: 6 }}>
                İsim *
              </label>
              <input
                style={inputStyle}
                placeholder="Adınız Soyadınız"
                value={form.name}
                onChange={set("name")}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.secondary, marginBottom: 6 }}>
                Telefon *
              </label>
              <input
                style={inputStyle}
                placeholder="0532 000 00 00"
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.secondary, marginBottom: 6 }}>
                E-posta
              </label>
              <input
                style={inputStyle}
                placeholder="ornek@mail.com"
                type="email"
                value={form.email}
                onChange={set("email")}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.secondary, marginBottom: 6 }}>
                Mesaj
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                placeholder="Salonunuz, ihtiyaçlarınız veya sorularınız..."
                value={form.message}
                onChange={set("message")}
              />
            </div>

            {status === "error" && (
              <p style={{ fontSize: 13, color: C.primary }}>{errMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                padding: "14px",
                borderRadius: 10,
                background: status === "loading" ? C.secondary : C.primary,
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                border: "none",
                cursor: status === "loading" ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {status === "loading" ? "Gönderiliyor…" : "Bana Ulaşın"}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      style={{
        background: C.primary,
        color: "#F8F6F2",
        padding: "48px 24px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 32,
          marginBottom: 40,
        }}
      >
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3.5" style={{ marginBottom: 10 }}>
            <MakasMark variant="light" className="block h-10 w-10" />
            <span className="font-display" style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1 }}>MAKAS</span>
          </div>
          <p style={{ fontSize: 13, color: "rgba(248,246,242,0.6)", lineHeight: 1.6 }}>
            Premium berber çözümleri
          </p>
        </div>

        {/* Links */}
        <div>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: "rgba(248,246,242,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Gezinti
          </p>
          {[
            { label: "Nasıl Çalışır", id: "how" },
            { label: "Özellikler", id: "features" },
            { label: "Demo",       id: "demo" },
            { label: "Fiyatlandırma", id: "pricing" },
            { label: "SSS",        id: "faq" },
            { label: "İletişim",   id: "contact" },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                display: "block",
                background: "none",
                border: "none",
                color: "rgba(248,246,242,0.7)",
                fontSize: 14,
                cursor: "pointer",
                padding: "3px 0",
                marginBottom: 4,
                textAlign: "left",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Contact */}
        <div>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: "rgba(248,246,242,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            İletişim
          </p>
          <a
            href="mailto:sercanfurunci41@gmail.com"
            style={{ display: "block", color: "rgba(248,246,242,0.7)", fontSize: 14, textDecoration: "none", marginBottom: 6 }}
          >
            sercanfurunci41@gmail.com
          </a>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(248,246,242,0.1)",
          paddingTop: 24,
          textAlign: "center",
          fontSize: 13,
          color: "rgba(248,246,242,0.4)",
        }}
      >
        <span>© 2026 MAKAS. Tüm hakları saklıdır.</span>
        <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
        <a href="/gizlilik" style={{ color: "inherit", textDecoration: "none", opacity: 0.7 }}>Gizlilik</a>
        <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
        <a href="/kullanim-kosullari" style={{ color: "inherit", textDecoration: "none", opacity: 0.7 }}>Kullanım Koşulları</a>
        <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
        <a href="/cerez-politikasi" style={{ color: "inherit", textDecoration: "none", opacity: 0.7 }}>Çerezler</a>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100dvh", fontFamily: "inherit", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <style>{`@media (max-width: 767px){ body{ padding-bottom: 76px; } }`}</style>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <WhyUs />
        <OwnYourBrand />
        <DemoShowcase />
        <Pricing />
        <FAQ />
        <LeadForm />
        <ClosingCTA />
      </main>
      <Footer />
      <StickyMobileCTA />
    </div>
  );
}

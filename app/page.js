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
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: C.primary,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "-0.5px",
            }}
          >
            M
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.5px",
              color: C.primary,
            }}
          >
            MAKAS
          </span>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10 }}>
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
          {"Berberiniz için\npremium randevu sistemi."}
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
          Müşterileriniz kolayca randevu alsın, ekibinizi yönetin, gelirlerinizi takip edin.
        </motion.p>

        <motion.div
          variants={fade}
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
        >
          <button
            onClick={() => scrollTo("demo")}
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
            Demo Gör
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
      </motion.div>
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
  { Icon: Star,          title: "Müşteri Yorumları",    desc: "Google yorumları entegrasyonu" },
  { Icon: Building2,     title: "Çoklu Şube",           desc: "Birden fazla lokasyon desteği" },
];

function Features() {
  return (
    <section
      style={{
        padding: "80px 24px",
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
    <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
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

// ─── Demo Showcase ────────────────────────────────────────────────────────────

const DEMOS = [
  { name: "Abdurrahman Çelik Exclusive Salon", slug: "abdurrahman", tag: "Klasik berber deneyimi" },
  { name: "Fade Zone",  slug: "fadezone",     tag: "Modern fade & skin cut uzmanı" },
  { name: "Royal Cut",  slug: "royalcut",     tag: "Premium saç & sakal bakımı" },
];

function DemoShowcase() {
  return (
    <section
      id="demo"
      style={{
        padding: "80px 24px",
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
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
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
        padding: "80px 24px",
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                background: "#fff",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.primary,
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              M
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.5px" }}>MAKAS</span>
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
            { label: "Özellikler", id: "features" },
            { label: "Demo",       id: "demo" },
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
        © 2026 MAKAS. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "inherit" }}>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <WhyUs />
        <DemoShowcase />
        <LeadForm />
      </main>
      <Footer />
    </div>
  );
}

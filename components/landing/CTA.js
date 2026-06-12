"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { ArrowRight, Phone, Calendar, Clock, Shield } from "lucide-react";

const C = {
  bg:       "#F6F3EE",
  card:     "#FFFFFF",
  border:   "#E5DFD6",
  surface:  "#EFEAE2",
  primary:  "#111111",
  secondary:"#44403C",
  muted:    "#6B7280",
  red:      "#C62828",
};

export default function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const { lang } = useLang();
  const tx = useT(lang);

  const FEATURES = lang === "tr"
    ? [
        { icon: Calendar, title: "7/24 Online Randevu",    desc: "İstediğiniz zaman, saniyeler içinde" },
        { icon: Clock,    title: "Anında Onay",             desc: "SMS ve e-posta ile bildirim" },
        { icon: Shield,   title: "Ücretsiz İptal",          desc: "24 saat öncesine kadar" },
      ]
    : [
        { icon: Calendar, title: "24/7 Online Booking",    desc: "Book anytime in seconds" },
        { icon: Clock,    title: "Instant Confirmation",   desc: "SMS and email notification" },
        { icon: Shield,   title: "Free Cancellation",      desc: "Up to 24 hours before" },
      ];

  return (
    <section ref={ref} style={{ background: C.bg }}>
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, #E5DFD6, transparent)" }}
      />

      {/* Main CTA block */}
      <div
        className="relative overflow-hidden"
        style={{ background: C.red }}
      >
        {/* Subtle texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
            opacity: 0.05,
            mixBlendMode: "multiply",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left: headline + CTAs */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2.5 mb-6"
              >
                <div style={{ width: "20px", height: "2px", background: "rgba(255,255,255,0.4)", borderRadius: "1px" }} />
                <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                  {tx.cta.sectionLabel}
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display font-light leading-none mb-8"
                style={{ fontSize: "clamp(44px, 7vw, 100px)", letterSpacing: "-0.025em", lineHeight: 0.92 }}
              >
                <span style={{ color: "#fff", display: "block" }}>{tx.cta.title[0]}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic", display: "block" }}>{tx.cta.title[1]}</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link
                  href="/book"
                  className="group inline-flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    background: "#fff",
                    color: C.red,
                    padding: "14px 32px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F6F3EE")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  {tx.cta.bookButton}
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a
                  href="tel:+902121234567"
                  className="inline-flex items-center justify-center gap-2 transition-all"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    padding: "14px 24px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                >
                  <Phone size={14} />
                  {tx.cta.callButton}
                </a>
              </motion.div>
            </div>

            {/* Right: trust signals */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="lg:col-span-5 space-y-3"
            >
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="flex items-center gap-4 p-4"
                  style={{ background: "rgba(0,0,0,0.12)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  >
                    <Icon size={18} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>{title}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "1px" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>

          {/* Trust pills row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap gap-x-8 gap-y-2 mt-12 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            {tx.cta.trust.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div style={{ width: "4px", height: "4px", background: "rgba(255,255,255,0.3)", borderRadius: "50%" }} />
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.03em" }}>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

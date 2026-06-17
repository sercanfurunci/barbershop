"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { ArrowRight } from "lucide-react";

const C = {
  bg:       "#FFFFFF",
  border:   "#E5DFD6",
  primary:  "#111111",
  secondary:"#44403C",
  muted:    "#6B7280",
  red:      "#C62828",
};

export default function Services({ services = [] }) {
  const { lang } = useLang();
  const tx = useT(lang);

  return (
    <section id="services" style={{ background: C.bg, position: "relative" }}>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #E5DFD6 30%, #E5DFD6 70%, transparent)" }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-20 lg:py-28">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 lg:mb-16"
        >
          <h2 className="font-display font-light" style={{
            fontSize: "clamp(40px, 5.5vw, 72px)",
            color: C.primary,
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
            marginBottom: "20px",
            textWrap: "balance",
          }}>
            {tx.services.title[0]}{" "}
            <span style={{ fontStyle: "italic", color: C.red }}>{tx.services.title[1]}</span>
          </h2>
          <p style={{ fontSize: "15px", color: C.secondary, lineHeight: 1.7, maxWidth: "440px" }}>
            {tx.services.subtitle}
          </p>
        </motion.div>

        {/* Editorial service rows */}
        <div>
          <div style={{ height: "1px", background: C.border }} />

          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href="/book" className="group block" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: "32px",
                    padding: "28px 0",
                    paddingLeft: "0",
                    borderBottom: `1px solid ${C.border}`,
                    transition: "padding-left 0.25s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.paddingLeft = "12px"; }}
                  onMouseLeave={e => { e.currentTarget.style.paddingLeft = "0"; }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "14px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <h3 className="font-display font-light" style={{
                        fontSize: "clamp(24px, 3.2vw, 42px)",
                        color: C.primary,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.05,
                      }}>
                        {service.name[lang]}
                      </h3>
                      {service.popular && (
                        <span style={{
                          fontSize: "10px",
                          color: C.red,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}>
                          {tx.services.popular}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: C.muted, lineHeight: 1.6 }}>
                      {service.description[lang]} · {service.duration} {tx.services.min}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                    <span className="font-display font-light" style={{
                      fontSize: "clamp(22px, 2.8vw, 34px)",
                      color: C.primary,
                      letterSpacing: "-0.02em",
                    }}>
                      ₺{service.price.toLocaleString()}
                    </span>
                    <ArrowRight
                      size={16}
                      className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
                      style={{ color: C.red, flexShrink: 0 }}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-12"
        >
          <p style={{ fontSize: "13px", color: C.muted, lineHeight: 1.5 }}>
            {tx.services.footer}
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 group flex-shrink-0"
            style={{ fontSize: "14px", color: C.red, fontWeight: 500, textDecoration: "none" }}
          >
            {tx.services.cta}
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

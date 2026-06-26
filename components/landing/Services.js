"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useShop } from "@/contexts/ShopContext";
import { ArrowRight } from "lucide-react";

const C = {
  bg:       "var(--makas-bg)",
  bgSoft:   "#FDFBF7",
  surface:  "var(--makas-surface2)",
  card:     "var(--makas-surface)",
  border:   "var(--makas-border)",
  primary:  "var(--makas-ink)",
  secondary:"var(--makas-ink-secondary)",
  muted:    "var(--makas-ink-muted)",
  dim:      "#C5BEB5",
};

export default function Services({ services = [] }) {
  const { lang } = useLang();
  const tx = useT(lang);
  const shop = useShop();
  const bookHref = shop?.slug ? `/${shop.slug}/book` : "/book";
  if (!services.length) return null;

  return (
    <section id="services" style={{ background: C.bg, position: "relative" }}>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--makas-border) 30%, var(--makas-border) 70%, transparent)" }} />

      <div style={{
        width: "min(1280px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(20px, 4vw, 32px)",
        paddingBlock: "clamp(48px, 6vw, 80px)",
      }}>

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
            <span style={{ fontStyle: "italic", color: C.muted }}>{tx.services.title[1]}</span>
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: "24px",
                  padding: "24px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "14px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <h3 className="line-clamp-2" style={{
                      fontSize: "clamp(17px, 2vw, 22px)",
                      fontWeight: 600,
                      color: C.primary,
                      letterSpacing: "-0.015em",
                      lineHeight: 1.2,
                      textWrap: "balance",
                      margin: 0,
                    }}>
                      {service.name[lang]}
                    </h3>
                    {service.popular && (
                      <span style={{
                        fontSize: "10px",
                        color: C.primary,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        flexShrink: 0,
                        background: "rgba(17,17,17,0.06)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}>
                        {tx.services.popular}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: 13, color: C.muted, flexWrap: "wrap" }}>
                    {service.duration && (
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {service.duration} {tx.services.min}
                      </span>
                    )}
                    {service.price != null && (
                      <span style={{
                        fontWeight: 600, color: C.primary,
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        ₺{service.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {service.description?.[lang] && (
                    <p className="line-clamp-2" style={{
                      fontSize: "13px", color: C.muted, lineHeight: 1.55, marginTop: 6,
                    }}>
                      {service.description[lang]}
                    </p>
                  )}
                </div>

                <Link
                  href={`${bookHref}?service=${service.id}`}
                  className="makas-cta makas-cta-outline"
                  aria-label={`${service.name[lang]} — ${tx.services.cta}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.primary,
                    fontSize: 13, fontWeight: 600,
                    textDecoration: "none",
                    flexShrink: 0,
                    minHeight: 40,
                  }}
                >
                  {tx.services.cta}
                  <ArrowRight size={14} />
                </Link>
              </div>
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
            href={bookHref}
            className="inline-flex items-center gap-2 group flex-shrink-0"
            style={{ fontSize: "14px", color: C.primary, fontWeight: 500, textDecoration: "none" }}
          >
            {tx.services.cta}
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

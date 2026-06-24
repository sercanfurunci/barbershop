"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useShop } from "@/contexts/ShopContext";
import { ArrowRight } from "lucide-react";

const C = {
  bg:       "#F7F4EE",
  bgSoft:   "#FDFBF7",
  surface:  "#EFEAE2",
  card:     "#FFFFFF",
  border:   "#E5DED3",
  primary:  "#111111",
  secondary:"#4A4A4A",
  muted:    "#8A8480",
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
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #E5DED3 30%, #E5DED3 70%, transparent)" }} />

      <div style={{
        width: "min(1440px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(20px, 4vw, 32px)",
        paddingBlock: "clamp(72px, 10vw, 120px)",
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
              <Link href={bookHref} className="group block" style={{ textDecoration: "none" }}>
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
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "14px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <h3 className="line-clamp-2" style={{
                        fontSize: "clamp(18px, 2.2vw, 26px)",
                        fontWeight: 600,
                        color: C.primary,
                        letterSpacing: "-0.015em",
                        lineHeight: 1.2,
                        textWrap: "balance",
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
                    {(service.description?.[lang] || service.duration) && (
                      <p className="line-clamp-2" style={{ fontSize: "13px", color: C.muted, lineHeight: 1.6 }}>
                        {[
                          service.description?.[lang],
                          service.duration ? `${service.duration} ${tx.services.min}` : null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                    {service.price != null && (
                      <span style={{
                        fontSize: "clamp(18px, 2.2vw, 24px)",
                        fontWeight: 600,
                        color: C.primary,
                        letterSpacing: "-0.015em",
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        ₺{service.price.toLocaleString()}
                      </span>
                    )}
                    <ArrowRight
                      size={16}
                      className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
                      style={{ color: C.primary, flexShrink: 0 }}
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

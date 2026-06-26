"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useShop } from "@/contexts/ShopContext";
import { ArrowRight, Phone } from "lucide-react";

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

export default function CTA() {
  const { lang } = useLang();
  const tx = useT(lang);
  const shop = useShop();
  const bookHref = shop?.slug ? `/${shop.slug}/book` : "/book";

  return (
    <section style={{ background: C.surface, position: "relative", overflow: "hidden" }}>
      <div style={{
        width: "min(1100px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(20px, 4vw, 32px)",
        paddingBlock: "clamp(72px, 10vw, 120px)",
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Left: headline */}
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-light"
            style={{
              fontSize: "clamp(40px, 5.5vw, 72px)",
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              textWrap: "balance",
              margin: 0,
            }}
          >
            <span style={{ color: C.primary, display: "block" }}>{tx.cta.title[0]}</span>
            <span style={{ color: C.muted, fontStyle: "italic", display: "block" }}>
              {tx.cta.title[1]}
            </span>
          </motion.h2>

          {/* Right: CTAs + trust */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={bookHref}
                className="group inline-flex items-center justify-center gap-2"
                style={{
                  background: C.primary,
                  color: "#fff",
                  padding: "17px 32px",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                  whiteSpace: "nowrap",
                  minHeight: "52px",
                  boxSizing: "border-box",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {tx.cta.bookButton}
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="tel:+905373305973"
                className="inline-flex items-center justify-center gap-2"
                style={{
                  color: C.secondary,
                  padding: "17px 24px",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: 500,
                  border: `1px solid ${C.border}`,
                  background: C.bgSoft,
                  textDecoration: "none",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  minHeight: "52px",
                  boxSizing: "border-box",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primary; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.secondary; e.currentTarget.style.borderColor = C.border; }}
              >
                <Phone size={15} />
                {tx.cta.callButton}
              </a>
            </div>

            <div
              className="flex flex-wrap gap-x-6 gap-y-2 pt-5"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
              {tx.cta.trust.map(item => (
                <div key={item} className="flex items-center gap-2">
                  <div style={{ width: "3px", height: "3px", background: C.dim, borderRadius: "50%", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: C.muted, letterSpacing: "0.03em" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

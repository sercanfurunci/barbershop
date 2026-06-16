"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { Clock, ArrowRight } from "lucide-react";

const C = {
  bg:       "#FFFFFF",
  card:     "#FFFFFF",
  border:   "#E5DFD6",
  surface:  "#EFEAE2",
  primary:  "#111111",
  secondary:"#44403C",
  muted:    "#6B7280",
  red:      "#C62828",
};

const CATEGORY_COLORS = {
  cuts:    { bg: "#EFF6FF", text: "#1E3A8A", border: "#BFDBFE" },
  beard:   { bg: "#FFFBEB", text: "#78350F", border: "#FDE68A" },
  combo:   { bg: "#FEF2F2", text: "#7F1D1D", border: "#FECACA" },
  premium: { bg: "#F5F3FF", text: "#4C1D95", border: "#DDD6FE" },
};

const CATEGORY_LABELS = {
  tr: { cuts: "Kesim", beard: "Sakal", combo: "Kombo", premium: "Premium" },
  en: { cuts: "Cut",   beard: "Beard", combo: "Combo", premium: "Premium" },
};

// Fixed badge height so the badge column is always the same regardless of popular badge presence
const BADGE_H = "20px";
const badgeBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: BADGE_H,
  padding: "0 8px",
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export default function Services({ services = [] }) {
  const { lang } = useLang();
  const tx = useT(lang);

  return (
    <section id="services" className="relative" style={{ background: C.bg }}>
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #E5DFD6, transparent)" }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-24 lg:py-28">

        {/* Section header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div style={{ width: "20px", height: "2px", background: C.red, borderRadius: "1px" }} />
              <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.red, fontWeight: 500 }}>
                {tx.services.sectionLabel}
              </span>
            </div>
            <h2
              className="font-display font-light"
              style={{ fontSize: "clamp(36px, 5vw, 60px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.05 }}
            >
              {tx.services.title[0]}{" "}
              <span style={{ fontStyle: "italic", color: C.red }}>{tx.services.title[1]}</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-3 items-start lg:items-end"
          >
            <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.65, maxWidth: "340px" }}>
              {tx.services.subtitle}
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 transition-all duration-200 group"
              style={{ fontSize: "13px", color: C.red, fontWeight: 500, letterSpacing: "0.02em" }}
            >
              {tx.services.cta}
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Services grid — align-items:stretch (CSS grid default) + flex-col cards = equal row heights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, i) => {
            const cat = CATEGORY_COLORS[service.category] || CATEGORY_COLORS.cuts;
            const catLabel = CATEGORY_LABELS[lang]?.[service.category] || service.category;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.05 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col"
              >
                <Link href="/book" className="flex flex-col flex-1 group">
                  <div
                    className="flex flex-col flex-1 transition-all duration-200"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: "12px",
                      padding: "24px",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(198,40,40,0.35)"; e.currentTarget.style.background = "#FAFAF8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                  >
                    {/* ── HEADER ROW ──
                        Icon (44×44) + badge column (always 44px: 20px popular + 4px gap + 20px category)
                        Using visibility:hidden on popular placeholder keeps column height constant.   */}
                    <div className="flex items-start justify-between mb-5" style={{ minHeight: "44px" }}>
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: "44px", height: "44px", background: C.surface, borderRadius: "10px", fontSize: "20px" }}
                      >
                        {service.icon}
                      </div>

                      <div className="flex flex-col items-end" style={{ gap: "4px" }}>
                        {/* Popular badge — always rendered; invisible when not popular so height is preserved */}
                        <span
                          style={{
                            ...badgeBase,
                            borderRadius: "20px",
                            background: `${C.red}18`,
                            color: C.red,
                            border: `1px solid ${C.red}40`,
                            visibility: service.popular ? "visible" : "hidden",
                          }}
                        >
                          {tx.services.popular}
                        </span>

                        {/* Category badge — always visible */}
                        <span
                          style={{
                            ...badgeBase,
                            borderRadius: "4px",
                            background: cat.bg,
                            color: cat.text,
                            border: `1px solid ${cat.border}`,
                          }}
                        >
                          {catLabel}
                        </span>
                      </div>
                    </div>

                    {/* ── NAME ── */}
                    <h3
                      className="font-display transition-colors duration-200"
                      style={{ fontSize: "20px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: "8px" }}
                    >
                      {service.name[lang]}
                    </h3>

                    {/* ── DESCRIPTION — clamped to 2 lines for consistent card height ── */}
                    <p
                      className="line-clamp-2"
                      style={{ fontSize: "13px", color: C.secondary, lineHeight: 1.6 }}
                    >
                      {service.description[lang]}
                    </p>

                    {/* ── SPACER — pushes footer to bottom ── */}
                    <div style={{ flex: 1, minHeight: "16px" }} />

                    {/* ── FOOTER — price and duration always on same baseline ── */}
                    <div
                      className="flex items-center justify-between pt-4"
                      style={{ borderTop: `1px solid ${C.border}` }}
                    >
                      <div className="flex items-center gap-1.5" style={{ color: C.muted }}>
                        <Clock size={12} />
                        <span style={{ fontSize: "12px" }}>{service.duration} {tx.services.min}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-light" style={{ fontSize: "22px", color: C.primary, letterSpacing: "-0.02em" }}>
                          ₺{service.price.toLocaleString()}
                        </span>
                        <ArrowRight
                          size={14}
                          style={{ color: C.red, opacity: 0 }}
                          className="group-hover:opacity-100 transition-opacity duration-200 translate-x-[-4px] group-hover:translate-x-0"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-8"
          style={{ fontSize: "12px", color: C.muted, letterSpacing: "0.04em" }}
        />
      </div>
    </section>
  );
}

"use client";

// Single-open accordion. Uses native <details> so search engines + assistive
// tech see all answers; we just intercept clicks to enforce single-open and
// animate the disclosure height.

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";

const C = {
  bg:       "var(--makas-bg)",
  card:     "var(--makas-surface)",
  border:   "var(--makas-border)",
  primary:  "var(--makas-ink)",
  secondary:"var(--makas-ink-secondary)",
  muted:    "var(--makas-ink-muted)",
};

export default function FAQ() {
  const { lang } = useLang();
  const tx = useT(lang);
  const faq = tx.faq;
  const [open, setOpen] = useState(null);

  if (!faq?.items?.length) return null;

  return (
    <section id="faq" style={{ background: C.bg, position: "relative" }}>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--makas-border) 30%, var(--makas-border) 70%, transparent)" }} />

      <div style={{
        width: "min(900px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(20px, 4vw, 32px)",
        paddingBlock: "clamp(48px, 7vw, 84px)",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: "clamp(28px, 4vw, 44px)", textAlign: "center" }}
        >
          <div className="font-mono-custom" style={{
            fontSize: "10px", color: C.muted, letterSpacing: "0.16em",
            textTransform: "uppercase", marginBottom: "14px",
          }}>
            {faq.sectionLabel}
          </div>
          <h2
            className="font-display font-light"
            style={{
              fontSize: "clamp(36px, 4.5vw, 56px)",
              color: C.primary,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              textWrap: "balance",
            }}
          >
            {faq.title[0]}<span style={{ fontStyle: "italic" }}>{faq.title[1]}</span>
          </h2>
          {faq.subtitle && (
            <p style={{
              marginTop: "14px",
              fontSize: "14px", color: C.muted, lineHeight: 1.6,
              maxWidth: "440px", marginInline: "auto",
            }}>
              {faq.subtitle}
            </p>
          )}
        </motion.div>

        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(17,17,17,0.04)",
        }}>
          {faq.items.map((item, i) => (
            <FAQItem
              key={i}
              item={item}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
              isLast={i === faq.items.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ item, isOpen, onToggle, isLast }) {
  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid ${C.border}` }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          padding: "20px clamp(20px, 3vw, 28px)",
          background: "transparent",
          border: "none",
          textAlign: "left",
          minHeight: "64px",
          color: C.primary,
          transition: "background 0.18s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(17,17,17,0.025)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          fontSize: "15px",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          lineHeight: 1.4,
        }}>
          {item.q}
        </span>
        <span style={{
          flexShrink: 0,
          width: "28px", height: "28px",
          borderRadius: "999px",
          background: isOpen ? C.primary : "transparent",
          border: `1px solid ${isOpen ? C.primary : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isOpen ? "#fff" : C.secondary,
          transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
        }}>
          <Plus size={14} strokeWidth={2} />
        </span>
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <p style={{
            padding: "0 clamp(20px, 3vw, 28px) 22px",
            fontSize: "14px",
            color: C.secondary,
            lineHeight: 1.7,
            letterSpacing: "-0.005em",
            maxWidth: "640px",
          }}>
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

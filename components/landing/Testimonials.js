"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { testimonials } from "@/lib/data";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const C = {
  bg:       "#070707",
  card:     "#0f0f14",
  border:   "rgba(255,255,255,0.07)",
  surface:  "#16161e",
  primary:  "#F0EDE8",
  secondary:"#6b6870",
  muted:    "#2e2d35",
  red:      "#CC1A1A",
};

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState(0);
  const { lang } = useLang();
  const tx = useT(lang);

  const go = (dir) => setActive((a) => (a + dir + testimonials.length) % testimonials.length);

  return (
    <section id="testimonials" ref={ref} style={{ background: C.bg }}>
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
      />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-24 lg:py-32">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-16"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div style={{ width: "20px", height: "2px", background: C.red, borderRadius: "1px" }} />
              <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.red, fontWeight: 500 }}>
                {tx.testimonials.sectionLabel}
              </span>
            </div>
            <h2
              className="font-display font-light"
              style={{ fontSize: "clamp(32px, 4.5vw, 52px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {lang === "tr" ? "Müşterilerimiz" : "Our Clients"}{" "}
              <span style={{ fontStyle: "italic", color: C.red }}>
                {lang === "tr" ? "anlatıyor" : "speak"}
              </span>
            </h2>
          </div>

          {/* Overall rating summary */}
          <div
            className="flex items-center gap-6 px-6 py-4 shrink-0"
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px" }}
          >
            <div className="text-center">
              <div className="font-display font-light" style={{ fontSize: "36px", color: C.primary, lineHeight: 1, letterSpacing: "-0.02em" }}>4.9</div>
              <div className="flex gap-0.5 justify-center mt-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={C.red} style={{ color: C.red }} />)}
              </div>
            </div>
            <div style={{ width: "1px", height: "40px", background: C.border }} />
            <div>
              <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>400+ {lang === "tr" ? "değerlendirme" : "reviews"}</div>
              <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>Google · Facebook</div>
            </div>
          </div>
        </motion.div>

        {/* Testimonial cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.07 }}
              style={{
                display: "flex",
                flexDirection: "column",
                background: i === active ? "#141420" : C.card,
                border: `1px solid ${i === active ? "rgba(204,26,26,0.2)" : C.border}`,
                borderRadius: "12px",
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => setActive(i)}
            >
              {/* Stars — fixed height row */}
              <div className="flex gap-0.5 mb-4">
                {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={C.red} style={{ color: C.red }} />)}
              </div>

              {/* Quote — clamped to 4 lines for equal card heights */}
              <p
                className="line-clamp-4"
                style={{ fontSize: "13px", color: C.secondary, lineHeight: 1.65 }}
              >
                &ldquo;{item.text[lang]}&rdquo;
              </p>

              {/* Spacer — pushes author to bottom of card */}
              <div style={{ flex: 1, minHeight: "16px" }} />

              {/* Author — always on same baseline */}
              <div className="flex items-center gap-3" style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
                <div
                  className="flex items-center justify-center font-bold text-white shrink-0"
                  style={{ width: "36px", height: "36px", background: C.red, borderRadius: "8px", fontSize: "12px" }}
                >
                  {item.avatar}
                </div>
                <div>
                  <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, lineHeight: 1.3 }}>{item.name}</div>
                  <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.04em", lineHeight: 1.3 }}>{item.role[lang]}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

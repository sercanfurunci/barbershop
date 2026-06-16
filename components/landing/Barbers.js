"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { Star, ArrowRight } from "lucide-react";

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

export default function Barbers({ barbers = [] }) {
  const { lang } = useLang();
  const tx = useT(lang);

  return (
    <section id="barbers" style={{ background: C.bg }}>
      <div
        className="absolute left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #E5DFD6, transparent)" }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-24 lg:py-32">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div style={{ width: "20px", height: "2px", background: C.red, borderRadius: "1px" }} />
              <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.red, fontWeight: 500 }}>
                {tx.barbers.sectionLabel}
              </span>
            </div>
            <h2
              className="font-display font-light"
              style={{ fontSize: "clamp(36px, 5vw, 60px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.05 }}
            >
              {tx.barbers.title[0]}{" "}
              <span style={{ fontStyle: "italic", color: C.red }}>{tx.barbers.title[1]}</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-3 items-start lg:items-end"
          >
            <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.65, maxWidth: "320px" }}>
              {tx.barbers.subtitle}
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 group transition-all"
              style={{ fontSize: "13px", color: C.red, fontWeight: 500 }}
            >
              {tx.barbers.cta}
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Barbers grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {barbers.map((barber, i) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
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
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(198,40,40,0.3)"; e.currentTarget.style.background = "#FAFAF8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                >
                  {/* Avatar row — fixed 52px avatar + fixed-height availability badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="flex items-center justify-center font-bold text-white shrink-0"
                      style={{
                        width: "52px", height: "52px",
                        background: `linear-gradient(135deg, ${C.red}, #7f1d1d)`,
                        borderRadius: "12px",
                        fontSize: "15px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {barber.avatar}
                    </div>
                    <div
                      className="flex items-center gap-1"
                      style={{
                        height: "24px",
                        padding: "0 8px",
                        background: barber.available ? "#F0FDF4" : "#F3F4F6",
                        borderRadius: "20px",
                        border: `1px solid ${barber.available ? "#BBF7D0" : "#E5E7EB"}`,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: barber.available ? "#16a34a" : "#9CA3AF" }}
                      />
                      <span style={{ fontSize: "10px", color: barber.available ? "#166534" : "#6B7280", fontWeight: 500 }}>
                        {barber.available
                          ? (lang === "tr" ? "Müsait" : "Available")
                          : (lang === "tr" ? "İzinli" : "Off")}
                      </span>
                    </div>
                  </div>

                  {/* Name + title — fixed structure */}
                  <div className="mb-3">
                    <h3 className="font-display font-light" style={{ fontSize: "20px", color: C.primary, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: "4px" }}>
                      {barber.name}
                    </h3>
                    <p style={{ fontSize: "11px", color: C.red, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
                      {barber.title[lang]}
                    </p>
                  </div>

                  {/* Bio — clamped to 2 lines for equal row height */}
                  <p
                    className="line-clamp-2"
                    style={{ fontSize: "12px", color: C.secondary, lineHeight: 1.6, marginBottom: "16px" }}
                  >
                    {barber.bio[lang]}
                  </p>

                  {/* Specialties — always 2 tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {barber.specialties[lang].slice(0, 2).map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          background: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: "4px",
                          color: C.secondary,
                          letterSpacing: "0.03em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Spacer — pushes footer to bottom */}
                  <div style={{ flex: 1, minHeight: "16px" }} />

                  {/* Footer: rating + exp — always on same baseline */}
                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star size={11} fill={C.red} style={{ color: C.red }} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>{barber.rating}</span>
                      <span style={{ fontSize: "11px", color: C.muted }}>· {barber.reviews} {tx.barbers.reviews}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: C.muted }}>
                      {barber.yearsExp} {tx.barbers.yearsExp}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

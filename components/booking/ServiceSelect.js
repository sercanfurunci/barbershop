"use client";

import { motion } from "framer-motion";
import { services } from "@/lib/data";
import { Clock, Check } from "lucide-react";

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

const CATEGORY_COLORS = {
  cuts:    { bg: "rgba(59,130,246,0.08)",  text: "#60a5fa",  border: "rgba(59,130,246,0.15)"  },
  beard:   { bg: "rgba(245,158,11,0.08)",  text: "#fbbf24",  border: "rgba(245,158,11,0.15)"  },
  combo:   { bg: "rgba(204,26,26,0.08)",   text: "#f87171",  border: "rgba(204,26,26,0.15)"   },
  premium: { bg: "rgba(167,139,250,0.08)", text: "#a78bfa",  border: "rgba(167,139,250,0.15)" },
};

const CATEGORY_LABELS = {
  tr: { cuts: "Kesim", beard: "Sakal", combo: "Kombo", premium: "Premium" },
  en: { cuts: "Cut",   beard: "Beard", combo: "Combo", premium: "Premium" },
};

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

export default function ServiceSelect({ selected, onSelect, lang = "tr", tx }) {
  const s1 = tx?.booking?.step1 ?? {};

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div style={{ width: "20px", height: "2px", background: C.red, borderRadius: "1px" }} />
          <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.red, fontWeight: 500 }}>
            {s1.eyebrow}
          </span>
        </div>
        <h1
          className="font-display font-light"
          style={{ fontSize: "clamp(32px, 4.5vw, 48px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "10px" }}
        >
          {s1.title?.[0]}{" "}
          <span style={{ fontStyle: "italic", color: C.red }}>{s1.title?.[1]}</span>
        </h1>
        <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.6 }}>{s1.subtitle}</p>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, i) => {
          const isSelected = selected?.id === service.id;
          const cat = CATEGORY_COLORS[service.category] || CATEGORY_COLORS.cuts;
          const catLabel = CATEGORY_LABELS[lang]?.[service.category] || service.category;

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
              <button
                onClick={() => onSelect(service)}
                className="flex flex-col flex-1 text-left relative"
                style={{
                  background: isSelected ? "#141420" : C.card,
                  border: `1px solid ${isSelected ? "rgba(204,26,26,0.35)" : C.border}`,
                  borderRadius: "12px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "rgba(204,26,26,0.3)";
                    e.currentTarget.style.background = "#121218";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.background = C.card;
                  }
                }}
              >
                {/* Selected check mark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 flex items-center justify-center"
                    style={{ width: "20px", height: "20px", background: C.red, borderRadius: "50%", zIndex: 1 }}
                  >
                    <Check size={10} color="#fff" />
                  </motion.div>
                )}

                {/* ── HEADER ROW — icon (44×44) + badge column (always 44px) ── */}
                <div className="flex items-start justify-between mb-5" style={{ minHeight: "44px" }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: "44px", height: "44px", background: C.surface, borderRadius: "10px", fontSize: "20px" }}
                  >
                    {service.icon}
                  </div>

                  <div className="flex flex-col items-end" style={{ gap: "4px" }}>
                    {/* Popular badge — always rendered; invisible when not popular */}
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
                      {tx?.services?.popular ?? "Popüler"}
                    </span>

                    {/* Category badge */}
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
                  className="font-display"
                  style={{
                    fontSize: "20px",
                    color: isSelected ? C.red : C.primary,
                    fontWeight: 300,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                    marginBottom: "8px",
                  }}
                >
                  {service.name[lang]}
                </h3>

                {/* ── DESCRIPTION — clamped to 2 lines ── */}
                <p
                  className="line-clamp-2"
                  style={{ fontSize: "13px", color: C.secondary, lineHeight: 1.6 }}
                >
                  {service.description[lang]}
                </p>

                {/* ── SPACER ── */}
                <div style={{ flex: 1, minHeight: "16px" }} />

                {/* ── FOOTER ── */}
                <div
                  className="flex items-center justify-between pt-4"
                  style={{ borderTop: `1px solid ${C.border}` }}
                >
                  <div className="flex items-center gap-1.5" style={{ color: C.muted }}>
                    <Clock size={12} />
                    <span style={{ fontSize: "12px" }}>{service.duration} {tx?.services?.min ?? "dk"}</span>
                  </div>
                  <span className="font-display font-light" style={{ fontSize: "22px", color: C.primary, letterSpacing: "-0.02em" }}>
                    ₺{service.price.toLocaleString()}
                  </span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center mt-6" style={{ fontSize: "12px", color: C.muted }}>{s1.hint}</p>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Star, Check } from "lucide-react";

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

export default function BarberSelect({ selected, onSelect, onBack, lang = "tr", tx }) {
  const s2 = tx?.booking?.step2 ?? {};
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    apiFetch("/api/barbers").then((data) => {
      setBarbers(data.map((b) => ({
        ...b,
        name:    b.nameTr,
        title:   { tr: b.titleTr, en: b.titleEn },
        bio:     { tr: b.bioTr,   en: b.bioEn   },
        reviews: b.reviewCount,
      })));
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div style={{ width: "20px", height: "2px", background: C.red, borderRadius: "1px" }} />
          <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.red, fontWeight: 500 }}>
            {s2.eyebrow}
          </span>
        </div>
        <h1
          className="font-display font-light"
          style={{ fontSize: "clamp(32px, 4.5vw, 48px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "10px" }}
        >
          {s2.title?.[0]}{" "}
          <span style={{ fontStyle: "italic", color: C.red }}>{s2.title?.[1]}</span>
        </h1>
        <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.6 }}>{s2.subtitle}</p>
      </div>

      {/* No preference option */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onClick={() => onSelect({ id: "any", name: s2.noPreference ?? "En İyi Uygun", title: { tr: "Otomatik", en: "Auto-assigned" } })}
        className="w-full text-left flex items-center gap-4 mb-6"
        style={{
          background: selected?.id === "any" ? "#141420" : C.card,
          border: `1px solid ${selected?.id === "any" ? "rgba(204,26,26,0.35)" : C.border}`,
          borderRadius: "12px",
          padding: "20px 24px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (selected?.id !== "any") {
            e.currentTarget.style.borderColor = "rgba(204,26,26,0.25)";
            e.currentTarget.style.background = "#121218";
          }
        }}
        onMouseLeave={(e) => {
          if (selected?.id !== "any") {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.background = C.card;
          }
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: "48px", height: "48px",
            background: C.surface,
            borderRadius: "10px",
            fontSize: "20px",
            border: `1px dashed ${selected?.id === "any" ? C.red : "rgba(255,255,255,0.15)"}`,
          }}
        >
          ✦
        </div>
        <div className="flex-1">
          <div style={{ fontSize: "14px", color: C.primary, fontWeight: 500, marginBottom: "2px" }}>{s2.noPreference}</div>
          <div style={{ fontSize: "12px", color: C.secondary }}>{s2.noPreferenceDesc}</div>
        </div>
        {selected?.id === "any" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center shrink-0"
            style={{ width: "22px", height: "22px", background: C.red, borderRadius: "50%" }}
          >
            <Check size={11} color="#fff" />
          </motion.div>
        )}
      </motion.button>

      {/* Barbers grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {barbers.map((barber, i) => {
          const isSelected = selected?.id === barber.id;
          return (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
            <button
              onClick={() => onSelect(barber)}
              className="relative text-left flex flex-col flex-1"
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
              {/* Avatar row — fixed 52px avatar + fixed-height availability badge */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="flex items-center justify-center font-bold text-white shrink-0"
                  style={{
                    width: "52px", height: "52px",
                    background: `linear-gradient(135deg, ${C.red}, #9a1212)`,
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
                    background: barber.available ? "rgba(34,197,94,0.08)" : "rgba(82,82,91,0.15)",
                    borderRadius: "20px",
                    border: `1px solid ${barber.available ? "rgba(34,197,94,0.15)" : "rgba(82,82,91,0.2)"}`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: barber.available ? "#22c55e" : "#52525b" }}
                  />
                  <span style={{ fontSize: "10px", color: barber.available ? "#22c55e" : C.secondary, fontWeight: 500 }}>
                    {barber.available
                      ? (lang === "tr" ? "Müsait" : "Available")
                      : (lang === "tr" ? "İzinli" : "Off")}
                  </span>
                </div>
              </div>

              {/* Name + title */}
              <div className="mb-3">
                <h3
                  className="font-display font-light"
                  style={{ fontSize: "18px", color: isSelected ? C.red : C.primary, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: "4px" }}
                >
                  {barber.name}
                </h3>
                <p style={{ fontSize: "11px", color: C.red, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
                  {barber.title[lang]}
                </p>
              </div>

              {/* Bio — clamped to 2 lines */}
              <p
                className="line-clamp-2"
                style={{ fontSize: "12px", color: C.secondary, lineHeight: 1.6 }}
              >
                {barber.bio[lang]}
              </p>

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
                  <span style={{ fontSize: "11px", color: C.muted }}>· {barber.reviews}</span>
                </div>
                <span style={{ fontSize: "11px", color: C.muted }}>
                  {barber.yearsExp} {tx?.barbers?.yearsExp ?? "yıl"}
                </span>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 flex items-center justify-center"
                  style={{ width: "22px", height: "22px", background: C.red, borderRadius: "50%" }}
                >
                  <Check size={11} color="#fff" />
                </motion.div>
              )}
            </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

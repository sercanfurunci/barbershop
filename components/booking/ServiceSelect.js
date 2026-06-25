"use client";

import { motion } from "framer-motion";
import { Clock, Check } from "lucide-react";

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

const CATEGORY_LABELS = {
  tr: { all: "Tümü", cuts: "Kesim", beard: "Sakal", combo: "Kombo", premium: "Premium" },
  en: { all: "All",  cuts: "Cut",   beard: "Beard", combo: "Combo", premium: "Premium" },
};

const CATEGORY_COLORS = {
  cuts:    { bg: "#EFF6FF", text: "#1E3A8A", border: "#BFDBFE" },
  beard:   { bg: "#FFFBEB", text: "#78350F", border: "#FDE68A" },
  combo:   { bg: "#FEF2F2", text: "#7F1D1D", border: "#FECACA" },
  premium: { bg: "#F5F3FF", text: "#4C1D95", border: "#DDD6FE" },
};

const CAT_ORDER = ["cuts", "beard", "combo", "premium"];

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px" }}>
      <div style={{ width: "42px", height: "42px", background: C.surface, borderRadius: "10px", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: "14px", width: "55%", background: C.surface, borderRadius: "4px", marginBottom: "6px" }} />
        <div style={{ height: "10px", width: "35%", background: C.surface, borderRadius: "4px" }} />
      </div>
      <div style={{ width: "44px", height: "16px", background: C.surface, borderRadius: "4px" }} />
    </div>
  );
}

export default function ServiceSelect({ services, loaded, selected, onSelect, lang = "tr", tx, compact = false }) {
  const s1 = tx?.booking?.step1 ?? {};

  return (
    <div style={compact ? { padding: "12px 16px 16px" } : {}}>
      {/* Header — hidden in compact (mobile) mode */}
      {!compact && (
        <div style={{ marginBottom: "14px" }}>
          <h1
            className="font-display font-light"
            style={{ fontSize: "clamp(26px, 4vw, 40px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "5px" }}
          >
            {s1.title?.[0]}{" "}
            <span style={{ fontStyle: "italic", color: C.primary }}>{s1.title?.[1]}</span>
          </h1>
          <p style={{ fontSize: "13px", color: C.muted }}>{s1.subtitle}</p>
        </div>
      )}

      {/* Service list */}
      <div style={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.border}` }}>
        {!loaded ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: C.card, borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
              <SkeletonRow />
            </div>
          ))
        ) : services.length === 0 ? (
          <div style={{ background: C.card, padding: "32px 16px", textAlign: "center", fontSize: "13px", color: C.muted }}>
            {lang === "tr" ? "Henüz hizmet eklenmemiş" : "No services available"}
          </div>
        ) : (
          services.map((service, i) => {
            const isSelected = selected?.id === service.id;
            const catColor = CATEGORY_COLORS[service.category] ?? CATEGORY_COLORS.cuts;
            const catLabel = CATEGORY_LABELS[lang]?.[service.category] ?? service.category;
            return (
              <motion.button
                key={service.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.035 }}
                onClick={() => onSelect(service)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  width: "100%", textAlign: "left",
                  padding: "13px 16px",
                  background: isSelected ? "#FEF2F2" : C.card,
                  borderLeft: `3px solid ${isSelected ? C.primary : "transparent"}`,
                  borderBottom: i < services.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  minHeight: "68px",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: "42px", height: "42px", flexShrink: 0,
                  background: isSelected ? `${C.primary}18` : C.surface,
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "19px",
                  transition: "background 0.15s",
                }}>
                  {service.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                    <span style={{
                      fontSize: "14px", fontWeight: 500,
                      color: isSelected ? C.primary : C.primary,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {service.name[lang]}
                    </span>
                    {service.popular && (
                      <span style={{
                        fontSize: "8px", fontWeight: 700, letterSpacing: "0.06em",
                        color: C.primary, background: `${C.primary}15`,
                        padding: "1px 5px", borderRadius: "3px", flexShrink: 0,
                        textTransform: "uppercase",
                      }}>
                        {tx?.services?.popular ?? "Popüler"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={10} style={{ color: C.muted, flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", color: C.muted }}>
                      {service.duration} {lang === "tr" ? "dk" : "min"}
                    </span>
                    <span style={{
                      fontSize: "9px", fontWeight: 500,
                      color: catColor.text, background: catColor.bg,
                      border: `1px solid ${catColor.border}`,
                      padding: "0 5px", height: "16px",
                      display: "inline-flex", alignItems: "center",
                      borderRadius: "3px",
                    }}>
                      {catLabel}
                    </span>
                  </div>
                </div>

                {/* Price + check */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: isSelected ? C.primary : C.primary, letterSpacing: "-0.01em" }}>
                    {service.price == null ? "Sorulur" : `₺${service.price.toLocaleString()}`}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ width: "18px", height: "18px", background: C.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Check size={10} color="#fff" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

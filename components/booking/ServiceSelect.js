"use client";

import { motion } from "framer-motion";
import { Clock, Check } from "lucide-react";

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
      <div className="bg-secondary" style={{ width: "42px", height: "42px", borderRadius: "10px", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="bg-secondary" style={{ height: "14px", width: "55%", borderRadius: "4px", marginBottom: "6px" }} />
        <div className="bg-secondary" style={{ height: "10px", width: "35%", borderRadius: "4px" }} />
      </div>
      <div className="bg-secondary" style={{ width: "44px", height: "16px", borderRadius: "4px" }} />
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
            className="font-display font-light text-foreground"
            style={{ fontSize: "clamp(26px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "5px" }}
          >
            {s1.title?.[0]}{" "}
            <span className="text-foreground" style={{ fontStyle: "italic" }}>{s1.title?.[1]}</span>
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>{s1.subtitle}</p>
        </div>
      )}

      {/* Service list */}
      <div className="border-border" style={{ borderRadius: "12px", overflow: "hidden", borderWidth: "1px", borderStyle: "solid" }}>
        {!loaded ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`bg-card ${i < 4 ? "border-b border-border" : ""}`}>
              <SkeletonRow />
            </div>
          ))
        ) : services.length === 0 ? (
          <div className="bg-card text-muted-foreground" style={{ padding: "32px 16px", textAlign: "center", fontSize: "13px" }}>
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
                className={`${i < services.length - 1 ? "border-b border-border" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  width: "100%", textAlign: "left",
                  padding: "13px 16px",
                  background: isSelected ? "#FEF2F2" : "var(--makas-surface)",
                  borderLeft: `3px solid ${isSelected ? "var(--makas-ink)" : "transparent"}`,
                  cursor: "pointer",
                  transition: "background 0.15s",
                  minHeight: "68px",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: "42px", height: "42px", flexShrink: 0,
                  background: isSelected ? "rgba(17,17,17,0.09)" : "var(--makas-surface2)",
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
                    <span className="text-foreground" style={{
                      fontSize: "14px", fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {service.name[lang]}
                    </span>
                    {service.popular && (
                      <span className="text-foreground" style={{
                        fontSize: "8px", fontWeight: 700, letterSpacing: "0.06em",
                        background: "rgba(17,17,17,0.08)",
                        padding: "1px 5px", borderRadius: "3px", flexShrink: 0,
                        textTransform: "uppercase",
                      }}>
                        {tx?.services?.popular ?? "Popüler"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={10} className="text-muted-foreground" style={{ flexShrink: 0 }} />
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>
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
                  <span className="text-foreground" style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                    {service.price == null ? "Sorulur" : `₺${service.price.toLocaleString()}`}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-foreground"
                      style={{ width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Check size={10} className="text-background" />
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

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Check } from "lucide-react";

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

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: C.card }}>
      <div style={{ width: "46px", height: "46px", background: C.surface, borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: "14px", width: "48%", background: C.surface, borderRadius: "4px", marginBottom: "6px" }} />
        <div style={{ height: "10px", width: "32%", background: C.surface, borderRadius: "4px" }} />
      </div>
      <div style={{ width: "50px", height: "20px", background: C.surface, borderRadius: "20px" }} />
    </div>
  );
}

export default function BarberSelect({ barbers, loaded, selected, onSelect, onBack, lang = "tr", tx, compact = false }) {
  const s2 = tx?.booking?.step2 ?? {};

  const anyOption = {
    id: "any",
    name: s2.noPreference ?? "Tercih Yok",
    title: { tr: "Otomatik Atama", en: "Auto-assigned" },
    isSpecial: true,
  };

  const allItems = loaded ? [anyOption, ...barbers] : [];

  return (
    <div style={compact ? { padding: "12px 16px 16px" } : {}}>
      {/* Header — hidden in compact (mobile) mode */}
      {!compact && (
        <div style={{ marginBottom: "14px" }}>
          <h1
            className="font-display font-light"
            style={{ fontSize: "clamp(26px, 4vw, 40px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "5px" }}
          >
            {s2.title?.[0]}{" "}
            <span style={{ fontStyle: "italic", color: C.primary }}>{s2.title?.[1]}</span>
          </h1>
          <p style={{ fontSize: "13px", color: C.muted }}>{s2.subtitle}</p>
        </div>
      )}

      {/* Barber list */}
      <div style={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.border}` }}>
        {!loaded ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <SkeletonRow />
            </div>
          ))
        ) : (
          allItems.map((barber, i) => {
            const isSelected = selected?.id === barber.id;
            const isAny = barber.id === "any";
            const selectArg = isAny
              ? { id: "any", name: s2.noPreference ?? "Tercih Yok", title: { tr: "Otomatik", en: "Auto-assigned" } }
              : barber;

            return (
              <motion.button
                key={barber.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.28 }}
                onClick={() => onSelect(selectArg)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  width: "100%", textAlign: "left",
                  padding: "14px 16px",
                  background: isSelected ? C.surface : C.card,
                  borderLeft: `3px solid ${isSelected ? C.primary : "transparent"}`,
                  borderBottom: i < allItems.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  minHeight: "72px",
                }}
              >
                {/* Avatar */}
                {isAny ? (
                  <div style={{
                    width: "46px", height: "46px", flexShrink: 0,
                    background: isSelected ? `${C.primary}18` : C.surface,
                    borderRadius: "50%",
                    border: `1.5px dashed ${isSelected ? C.primary : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "17px",
                    transition: "all 0.15s",
                  }}>
                    ✦
                  </div>
                ) : barber.profilePhoto ? (
                  <Image
                    src={barber.profilePhoto}
                    alt={barber.name || ""}
                    width={46} height={46}
                    sizes="46px"
                    style={{
                      flexShrink: 0,
                      borderRadius: "50%", objectFit: "cover",
                      border: `2px solid ${isSelected ? C.primary : C.border}`,
                    }}
                  />
                ) : (
                  <div style={{
                    width: "46px", height: "46px", flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.primary}, #7f1d1d)`,
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: "13px",
                    letterSpacing: "0.04em",
                  }}>
                    {barber.avatar}
                  </div>
                )}

                {/* Name + title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "14px", fontWeight: 500,
                    color: isSelected ? C.primary : C.primary,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: "2px",
                  }}>
                    {barber.name}
                  </div>
                  <div style={{
                    fontSize: isAny ? "11px" : "10px",
                    color: isAny ? C.muted : C.primary,
                    letterSpacing: isAny ? 0 : "0.07em",
                    textTransform: isAny ? "none" : "uppercase",
                    fontWeight: isAny ? 400 : 500,
                  }}>
                    {barber.title[lang]}
                  </div>
                </div>

                {/* Right side */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0 }}>
                  {!isAny && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <Star size={10} fill={C.primary} style={{ color: C.primary }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: C.primary }}>{barber.rating}</span>
                        <span style={{ fontSize: "10px", color: C.muted }}>({barber.reviews})</span>
                      </div>
                      <div style={{
                        fontSize: "9px", fontWeight: 600, letterSpacing: "0.03em",
                        color: barber.available ? "#166534" : "#6B7280",
                        background: barber.available ? "#F0FDF4" : "#F3F4F6",
                        border: `1px solid ${barber.available ? "#BBF7D0" : "#E5E7EB"}`,
                        padding: "2px 8px", borderRadius: "20px",
                      }}>
                        {barber.available
                          ? (lang === "tr" ? "Müsait" : "Available")
                          : (lang === "tr" ? "İzinli" : "Off")}
                      </div>
                    </>
                  )}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ width: "20px", height: "20px", background: C.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginTop: isAny ? 0 : "-2px" }}
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

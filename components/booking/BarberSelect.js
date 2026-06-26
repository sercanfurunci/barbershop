"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Check } from "lucide-react";

function SkeletonRow() {
  return (
    <div className="bg-card" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
      <div className="bg-secondary" style={{ width: "46px", height: "46px", borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="bg-secondary" style={{ height: "14px", width: "48%", borderRadius: "4px", marginBottom: "6px" }} />
        <div className="bg-secondary" style={{ height: "10px", width: "32%", borderRadius: "4px" }} />
      </div>
      <div className="bg-secondary" style={{ width: "50px", height: "20px", borderRadius: "20px" }} />
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
            className="font-display font-light text-foreground"
            style={{ fontSize: "clamp(26px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "5px" }}
          >
            {s2.title?.[0]}{" "}
            <span className="text-foreground" style={{ fontStyle: "italic" }}>{s2.title?.[1]}</span>
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>{s2.subtitle}</p>
        </div>
      )}

      {/* Barber list */}
      <div className="border-border" style={{ borderRadius: "12px", overflow: "hidden", borderWidth: "1px", borderStyle: "solid" }}>
        {!loaded ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={i < 3 ? "border-b border-border" : ""}>
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
                className={i < allItems.length - 1 ? "border-b border-border" : ""}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  width: "100%", textAlign: "left",
                  padding: "14px 16px",
                  background: isSelected ? "var(--makas-surface2)" : "var(--makas-surface)",
                  borderLeft: `3px solid ${isSelected ? "var(--makas-ink)" : "transparent"}`,
                  cursor: "pointer",
                  transition: "background 0.15s",
                  minHeight: "72px",
                }}
              >
                {/* Avatar */}
                {isAny ? (
                  <div style={{
                    width: "46px", height: "46px", flexShrink: 0,
                    background: isSelected ? "rgba(17,17,17,0.09)" : "var(--makas-surface2)",
                    borderRadius: "50%",
                    border: `1.5px dashed ${isSelected ? "var(--makas-ink)" : "var(--makas-border)"}`,
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
                      border: `2px solid ${isSelected ? "var(--makas-ink)" : "var(--makas-border)"}`,
                    }}
                  />
                ) : (
                  <div style={{
                    width: "46px", height: "46px", flexShrink: 0,
                    background: `linear-gradient(135deg, var(--makas-ink), #7f1d1d)`,
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
                  <div className="text-foreground" style={{
                    fontSize: "14px", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: "2px",
                  }}>
                    {barber.name}
                  </div>
                  <div style={{
                    fontSize: isAny ? "11px" : "10px",
                    color: isAny ? "var(--makas-ink-muted)" : "var(--makas-ink)",
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
                        <Star size={10} fill="var(--makas-ink)" style={{ color: "var(--makas-ink)" }} />
                        <span className="text-foreground" style={{ fontSize: "12px", fontWeight: 600 }}>{barber.rating}</span>
                        <span className="text-muted-foreground" style={{ fontSize: "10px" }}>({barber.reviews})</span>
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
                      className="bg-foreground"
                      style={{ width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginTop: isAny ? 0 : "-2px" }}
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

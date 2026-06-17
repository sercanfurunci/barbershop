"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { Star, Scissors, ArrowRight } from "lucide-react";

const C = {
  bg:       "#F6F3EE",
  card:     "#FFFFFF",
  border:   "rgba(17,17,17,0.06)",
  surface:  "#F1EEE8",
  primary:  "#111111",
  secondary:"#44403C",
  muted:    "#78716C",
  red:      "#C62828",
  dimRed:   "rgba(198,40,40,0.08)",
};

function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function Barbers({ barbers = [] }) {
  const { lang } = useLang();
  const tx = useT(lang);

  return (
    <section id="barbers" style={{ background: C.bg, position: "relative" }}>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #E5DFD6 30%, #E5DFD6 70%, transparent)" }} />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 32px 64px" }}>

        {/* Header */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}
          className="lg:flex-row lg:items-end lg:justify-between"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2
              className="font-display font-light"
              style={{
                fontSize: "clamp(36px, 4vw, 56px)",
                color: C.primary,
                letterSpacing: "-0.03em",
                lineHeight: 0.95,
              }}
            >
              {tx.barbers.title[0]}{" "}
              <span style={{ fontStyle: "italic", color: C.red }}>{tx.barbers.title[1]}</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ fontSize: "13px", color: C.muted, lineHeight: 1.65, maxWidth: "280px" }}
            className="lg:text-right"
          >
            {tx.barbers.subtitle}
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {barbers.map((barber, i) => (
            <BarberCard key={barber.id} barber={barber} lang={lang} tx={tx} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}
        >
          <Link
            href="/book"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
              color: C.red,
              textDecoration: "none",
              transition: "gap 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.gap = "10px"; }}
            onMouseLeave={e => { e.currentTarget.style.gap = "6px"; }}
          >
            {lang === "tr" ? "Berberinizi Seçin" : "Choose Your Barber"}
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function BarberCard({ barber, lang, tx, index }) {
  const name        = barber.name;
  const title       = barber.title?.[lang] ?? barber.title?.tr ?? "";
  const bio         = barber.bio?.[lang] ?? barber.bio?.tr ?? "";
  const specialties = Array.isArray(barber.specialties?.[lang])
    ? barber.specialties[lang]
    : Array.isArray(barber.specialties)
    ? barber.specialties
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{ height: "100%" }}
    >
      <div
        className="group"
        style={{
          background: C.card,
          borderRadius: "14px",
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.25s, transform 0.25s",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)";
          e.currentTarget.style.transform = "translateY(-4px)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* ── Image ── */}
        <div style={{ position: "relative", height: "300px", flexShrink: 0, background: "#1a1210", overflow: "hidden" }}>
          {barber.profilePhoto ? (
            <img
              src={barber.profilePhoto}
              alt={name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
                display: "block",
                transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
              }}
              className="group-hover:scale-[1.04]"
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(160deg, #2a2420 0%, #1a1210 60%, #0e0b09 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg viewBox="0 0 200 240" style={{ width: 72, opacity: 0.15 }} fill="none">
                <ellipse cx="100" cy="64" rx="42" ry="46" fill="#fff" />
                <path d="M18 240c0-49 36.6-88.7 82-88.7S182 191 182 240H18z" fill="#fff" />
              </svg>
            </div>
          )}

          {/* Initials badge — top left */}
          <div style={{
            position: "absolute", top: "10px", left: "10px",
            width: "32px", height: "32px",
            background: C.red,
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.04em",
          }}>
            {initials(name)}
          </div>

          {/* Availability badge — top right */}
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            display: "flex", alignItems: "center", gap: "4px",
            padding: "3px 8px", borderRadius: "20px",
            background: barber.available ? "rgba(21,128,61,0.88)" : "rgba(107,114,128,0.82)",
            backdropFilter: "blur(6px)",
          }}>
            <div style={{
              width: "4px", height: "4px", borderRadius: "50%",
              background: barber.available ? "#86efac" : "#d1d5db",
            }} />
            <span style={{ fontSize: "9px", fontWeight: 500, color: "#fff", letterSpacing: "0.04em" }}>
              {barber.available ? (lang === "tr" ? "Müsait" : "Available") : (lang === "tr" ? "İzinli" : "Off")}
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>

          {/* Name */}
          <h3
            className="font-display font-light"
            style={{ fontSize: "18px", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "3px" }}
          >
            {name}
          </h3>

          {/* Title */}
          <p style={{ fontSize: "9px", color: C.red, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: "10px" }}>
            {title}
          </p>

          {/* Bio */}
          {bio && (
            <p className="line-clamp-2" style={{ fontSize: "12px", color: C.secondary, lineHeight: 1.6, marginBottom: "12px" }}>
              {bio}
            </p>
          )}

          {/* Specialty tags */}
          {specialties.length > 0 && (
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "12px" }}>
              {specialties.slice(0, 3).map(s => (
                <span key={s} style={{
                  fontSize: "10px", padding: "2px 8px",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: "4px",
                  color: C.secondary,
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Star size={11} fill={C.red} style={{ color: C.red, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: C.primary }}>{barber.rating}</span>
              <span style={{ fontSize: "11px", color: C.muted }}>
                · {barber.reviews > 0 ? barber.reviews : 0} {tx.barbers.reviews}
              </span>
            </div>

            {barber.yearsExp > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Scissors size={10} style={{ color: C.muted, flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: C.muted }}>{barber.yearsExp} {tx.barbers.yearsExp}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

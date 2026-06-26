"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useShop } from "@/contexts/ShopContext";
import { Star, Scissors, ArrowRight } from "lucide-react";

const C = {
  bg:       "var(--makas-bg)",
  bgSoft:   "#FDFBF7",
  surface:  "var(--makas-surface2)",
  card:     "var(--makas-surface)",
  border:   "var(--makas-border)",
  primary:  "var(--makas-ink)",
  secondary:"var(--makas-ink-secondary)",
  muted:    "var(--makas-ink-muted)",
  dimRed:   "rgba(17,17,17,0.08)",
};

function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function Barbers({ barbers: initialBarbers = [] }) {
  const [barbers, setBarbers] = useState(initialBarbers);
  const { lang } = useLang();
  const tx = useT(lang);
  const shop = useShop();
  const bookHref = shop?.slug ? `/${shop.slug}/book` : "/book";
  if (!barbers.length) return null;

  // Lazily fetch profile photos from the CDN-cached public API.
  // Not in SSR payload to keep initial HTML small (~150–200 KB per photo).
  useEffect(() => {
    if (!shop?.id) return;
    fetch(`/api/barbers?shopId=${shop.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!Array.isArray(data)) return;
        const photoMap = new Map(data.map(b => [b.id, b.profilePhoto ?? null]));
        setBarbers(prev => prev.map(b => ({ ...b, profilePhoto: photoMap.get(b.id) ?? null })));
      })
      .catch(() => {});
  }, [shop?.id]);

  return (
    <section id="barbers" style={{ background: C.bg, position: "relative" }}>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--makas-border) 30%, var(--makas-border) 70%, transparent)" }} />

      <div style={{
        width: "min(1280px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(20px, 4vw, 32px)",
        paddingBlock: "clamp(48px, 7vw, 84px)",
      }}>

        {/* Header */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "36px" }}
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
              <span style={{ fontStyle: "italic", color: C.primary }}>{tx.barbers.title[1]}</span>
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

        {/* Layout — adaptive by count:
              1   → single 320px card, centered
              2/3 → fixed col count at 280px each, centered
              4+  → auto-fit (240–280px), centered
            Mobile is always a horizontal snap carousel.
            Centering uses `width: fit-content; margin-inline: auto` so cards
            never stretch to fill the section width. */}
        <style>{`
          .barbers-track {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-padding-inline: clamp(20px, 4vw, 32px);
            padding-inline: clamp(20px, 4vw, 32px);
            margin-inline: calc(-1 * clamp(20px, 4vw, 32px));
            -webkit-overflow-scrolling: touch;
          }
          .barbers-track::-webkit-scrollbar { display: none; }
          .barbers-track { scrollbar-width: none; }
          .barbers-track > * {
            flex: 0 0 82vw;
            min-width: 82vw;
            max-width: 320px;
            scroll-snap-align: start;
          }
          @media (min-width: 768px) {
            .barbers-track {
              display: grid;
              grid-template-columns: ${
                barbers.length === 1
                  ? "minmax(240px, 320px)"
                  : "repeat(2, minmax(240px, 280px))"
              };
              gap: 20px;
              overflow: visible;
              padding-inline: 0;
              margin-inline: auto;
              width: fit-content;
              max-width: 100%;
              justify-content: center;
            }
            .barbers-track > * { flex: initial; min-width: 0; max-width: none; }
          }
          @media (min-width: 1024px) {
            .barbers-track {
              grid-template-columns: ${
                barbers.length === 1
                  ? "minmax(240px, 320px)"
                  : barbers.length === 2
                    ? "repeat(2, minmax(240px, 280px))"
                    : barbers.length === 3
                      ? "repeat(3, minmax(240px, 280px))"
                      : "repeat(auto-fit, minmax(240px, 280px))"
              };
            }
          }
        `}</style>
        <div className="barbers-track">
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
            href={bookHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
              color: C.primary,
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
          boxShadow: `0 1px 2px rgba(17,17,17,0.04), 0 0 0 1px ${C.border}`,
          transition: "box-shadow 0.25s, transform 0.25s",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 12px 36px rgba(17,17,17,0.10), 0 0 0 1px ${C.border}`;
          e.currentTarget.style.transform = "translateY(-4px)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = `0 1px 2px rgba(17,17,17,0.04), 0 0 0 1px ${C.border}`;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* ── Image ── */}
        <div style={{ position: "relative", aspectRatio: "4 / 5", flexShrink: 0, background: C.surface, overflow: "hidden" }}>
          {barber.profilePhoto ? (
            <Image
              src={barber.profilePhoto}
              alt={name}
              fill
              sizes="(max-width: 767px) 82vw, (max-width: 1023px) 50vw, 280px"
              style={{ objectFit: "cover", objectPosition: "center center" }}
              className="group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(160deg, ${C.bgSoft} 0%, ${C.surface} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg viewBox="0 0 200 240" style={{ width: 72, opacity: 0.18 }} fill="none">
                <ellipse cx="100" cy="64" rx="42" ry="46" fill="var(--makas-ink)" />
                <path d="M18 240c0-49 36.6-88.7 82-88.7S182 191 182 240H18z" fill="var(--makas-ink)" />
              </svg>
            </div>
          )}

          {/* Initials badge — top left */}
          <div style={{
            position: "absolute", top: "10px", left: "10px",
            width: "32px", height: "32px",
            background: C.primary,
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
            style={{ fontSize: "16px", color: C.primary, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.25, marginBottom: "3px" }}
          >
            {name}
          </h3>

          {/* Title */}
          <p style={{ fontSize: "9px", color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: "10px" }}>
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
              <Star size={11} fill={C.primary} style={{ color: C.primary, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: C.primary }}>{barber.rating}</span>
              <span style={{ fontSize: "11px", color: C.muted }}>
                · {barber.reviews > 0 ? barber.reviews : 0} {tx.barbers.reviews}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {barber.completedCount > 0 && (
                <span style={{ fontSize: "11px", color: C.muted, fontWeight: 600 }}>
                  {barber.completedCount}+ {lang === "tr" ? "tamamlanan" : "completed"}
                </span>
              )}
              {barber.yearsExp > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Scissors size={10} style={{ color: C.muted, flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: C.muted }}>{barber.yearsExp} {tx.barbers.yearsExp}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

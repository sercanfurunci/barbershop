"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useShop } from "@/contexts/ShopContext";
import { Star, ArrowRight } from "lucide-react";

const C = {
  bg:       "var(--makas-bg)",
  bgSoft:   "#FDFBF7",
  surface:  "var(--makas-surface2)",
  card:     "var(--makas-surface)",
  border:   "var(--makas-border)",
  primary:  "var(--makas-ink)",
  secondary:"var(--makas-ink-secondary)",
  muted:    "var(--makas-ink-muted)",
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

  // Lazy-fetch CDN-cached profile photos. Not in SSR payload to keep HTML small.
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
        paddingBlock: "clamp(40px, 5vw, 64px)",
      }}>

        {/* Header */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}
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
                fontSize: "clamp(32px, 3.6vw, 48px)",
                color: C.primary,
                letterSpacing: "-0.03em",
                lineHeight: 1,
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

        {/* Fresha-style avatar row. Mobile = horizontal snap scroll; desktop
            = flex row with even spacing, never wraps until count ≥ 6 (then
            spills to a second row via flex-wrap). */}
        <style>{`
          .barbers-row {
            display: flex;
            gap: clamp(16px, 2.5vw, 28px);
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-padding-inline: clamp(20px, 4vw, 32px);
            padding-inline: clamp(20px, 4vw, 32px);
            margin-inline: calc(-1 * clamp(20px, 4vw, 32px));
            -webkit-overflow-scrolling: touch;
          }
          .barbers-row::-webkit-scrollbar { display: none; }
          .barbers-row { scrollbar-width: none; }
          .barbers-row > * {
            flex: 0 0 40vw;
            max-width: 200px;
            min-width: 140px;
            scroll-snap-align: start;
          }
          @media (min-width: 768px) {
            .barbers-row {
              overflow: visible;
              padding-inline: 0;
              margin-inline: 0;
              justify-content: center;
              flex-wrap: wrap;
            }
            .barbers-row > * {
              flex: 1 1 0;
              max-width: 220px;
              min-width: 0;
            }
          }
        `}</style>
        <div className="barbers-row">
          {barbers.map((barber, i) => (
            <BarberAvatar key={barber.id} barber={barber} lang={lang} tx={tx} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginTop: "36px", display: "flex", justifyContent: "center" }}
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

function BarberAvatar({ barber, lang, tx, index }) {
  const name  = barber.name;
  const title = barber.title?.[lang] ?? barber.title?.tr ?? "";
  const href  = `/barber/${barber.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className="group"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {/* Circular avatar with availability dot */}
        <div style={{
          position: "relative",
          width: "clamp(120px, 14vw, 160px)",
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          overflow: "hidden",
          background: C.surface,
          border: `1px solid ${C.border}`,
          marginBottom: 14,
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        className="group-hover:scale-[1.03] group-hover:shadow-lg"
        >
          {barber.profilePhoto ? (
            <Image
              src={barber.profilePhoto}
              alt={name}
              fill
              sizes="(max-width: 767px) 40vw, 160px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(160deg, ${C.bgSoft} 0%, ${C.surface} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 500, color: C.muted, letterSpacing: "0.05em",
            }}>
              {initials(name)}
            </div>
          )}

          {/* Availability dot — bottom right */}
          <span
            aria-label={barber.available ? (lang === "tr" ? "Müsait" : "Available") : (lang === "tr" ? "İzinli" : "Off")}
            title={barber.available ? (lang === "tr" ? "Müsait" : "Available") : (lang === "tr" ? "İzinli" : "Off")}
            style={{
              position: "absolute",
              bottom: 6, right: 6,
              width: 16, height: 16,
              borderRadius: "50%",
              background: barber.available ? "#16a34a" : "#9ca3af",
              border: "3px solid var(--makas-bg)",
            }}
          />
        </div>

        {/* Name */}
        <h3 style={{
          fontSize: 15,
          color: C.primary,
          fontWeight: 600,
          letterSpacing: "-0.005em",
          lineHeight: 1.25,
          margin: 0,
          marginBottom: 3,
        }}>
          {name}
        </h3>

        {/* Role */}
        {title && (
          <p style={{
            fontSize: 11,
            color: C.muted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 600,
            margin: 0,
            marginBottom: 8,
          }}>
            {title}
          </p>
        )}

        {/* Rating + reviews */}
        {barber.rating > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, color: C.secondary }}>
            <Star size={11} fill={C.primary} style={{ color: C.primary }} />
            <span style={{ fontWeight: 600, color: C.primary }}>{barber.rating}</span>
            {barber.reviews > 0 && (
              <span style={{ color: C.muted }}>· {barber.reviews} {tx.barbers.reviews}</span>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
}

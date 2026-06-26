"use client";

import { motion } from "framer-motion";
import { testimonials } from "@/lib/data";
import { useLang } from "@/contexts/LanguageContext";
import { Star } from "lucide-react";

const C = {
  bg:       "var(--makas-bg)",
  bgSoft:   "#FDFBF7",
  surface:  "var(--makas-surface2)",
  card:     "var(--makas-surface)",
  border:   "var(--makas-border)",
  primary:  "var(--makas-ink)",
  secondary:"var(--makas-ink-secondary)",
  muted:    "var(--makas-ink-muted)",
  dim:      "#C5BEB5",
};

const GoogleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Testimonials({ googleReviews = null }) {
  const { lang } = useLang();
  // ponytail: SSR-provided. No client fetch, no loading skeleton.
  const isGoogle      = !!(googleReviews?.reviews?.length);
  const items         = isGoogle ? googleReviews.reviews : testimonials;
  if (!items.length) return null;
  const displayRating = isGoogle ? googleReviews.rating?.toFixed(1) : "4.9";
  const displayTotal  = isGoogle ? `${googleReviews.totalRatings}+` : "400+";

  const getText = (item) =>
    isGoogle ? item.text : (typeof item.text === "object" ? item.text[lang] : item.text);
  const getRole = (item) =>
    isGoogle ? item.relativeTime : (typeof item.role === "object" ? item.role[lang] : item.role);

  return (
    <section id="testimonials" style={{ background: C.bg }}>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--makas-border) 30%, var(--makas-border) 70%, transparent)" }} />

      <div style={{
        width: "min(1440px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(20px, 4vw, 32px)",
        paddingBlock: "clamp(56px, 7vw, 88px)",
      }}>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-display font-light" style={{
              fontSize: "clamp(40px, 5.5vw, 72px)",
              color: C.primary,
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              textWrap: "balance",
            }}>
              {lang === "tr" ? "Müşterilerimiz" : "Our Clients"}{" "}
              <span style={{ fontStyle: "italic", color: C.primary }}>
                {lang === "tr" ? "anlatıyor" : "speak"}
              </span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="shrink-0"
          >
            <div className="flex items-baseline gap-2 mb-1">
              <span style={{
                fontSize: "34px", fontWeight: 600, color: C.primary,
                lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
              }}>
                {displayRating}
              </span>
              <span style={{ color: C.primary, fontSize: "18px", lineHeight: 1 }}>★</span>
            </div>
            <div style={{ fontSize: "12px", color: C.muted }}>
              {displayTotal} {lang === "tr" ? "Google değerlendirmesi" : "Google reviews"}
            </div>
          </motion.div>
        </div>

        {/* Layout:
            mobile  — horizontal snap slider, cards 78vw
            tablet  — 2-col grid
            desktop — up to 4 columns, each capped at ~300px */}
        {items.length > 0 && (
          <>
            <style>{`
              .testimonials-track {
                display: flex;
                gap: 16px;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                scroll-padding-inline: clamp(20px, 4vw, 32px);
                padding-inline: clamp(20px, 4vw, 32px);
                margin-inline: calc(-1 * clamp(20px, 4vw, 32px));
                -webkit-overflow-scrolling: touch;
              }
              .testimonials-track::-webkit-scrollbar { display: none; }
              .testimonials-track { scrollbar-width: none; }
              .testimonials-track > * {
                flex: 0 0 78vw;
                max-width: 340px;
                scroll-snap-align: start;
              }
              @media (min-width: 768px) {
                .testimonials-track {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 16px;
                  overflow: visible;
                  padding-inline: 0;
                  margin-inline: 0;
                }
                .testimonials-track > * { flex: initial; max-width: none; }
              }
              @media (min-width: 1024px) {
                .testimonials-track {
                  grid-template-columns: repeat(${Math.min(items.length, 4)}, minmax(0, 1fr));
                  gap: 16px;
                  max-width: ${items.length <= 2 ? `${items.length * 360}px` : "none"};
                  margin-inline: ${items.length <= 2 ? "auto" : 0};
                }
              }
            `}</style>
            <div className="testimonials-track">
              {items.slice(0, 4).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: "100%" }}
                >
                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: "12px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      minHeight: "160px",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "rgba(17,17,17,0.25)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-3">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11}
                          fill={s <= (item.rating ?? 5) ? C.primary : "transparent"}
                          style={{ color: C.primary }}
                        />
                      ))}
                    </div>

                    {/* Quote — clamp 4 lines for denser rows */}
                    <p className="line-clamp-4" style={{
                      fontSize: "14px",
                      color: C.secondary,
                      lineHeight: 1.55,
                      flex: 1,
                      marginBottom: "14px",
                    }}>
                      &ldquo;{getText(item)}&rdquo;
                    </p>

                    {/* Author */}
                    <div
                      className="flex items-center gap-3"
                      style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}
                    >
                      {item.profilePhoto ? (
                        <img
                          src={item.profilePhoto}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          style={{
                            width: "32px", height: "32px",
                            borderRadius: "7px", objectFit: "cover", flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "7px",
                          background: C.primary, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 700, color: "#fff",
                        }}>
                          {item.avatar || item.name?.[0]}
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: "13px", color: C.primary, fontWeight: 600,
                          letterSpacing: "-0.005em",
                          lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: "10px", color: C.muted, marginTop: "1px" }}>
                          {getRole(item)}
                        </div>
                      </div>
                      {isGoogle && (
                        <div style={{ flexShrink: 0 }}>
                          <GoogleIcon />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

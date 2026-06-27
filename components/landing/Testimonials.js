"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { testimonials } from "@/lib/data";
import { useLang } from "@/contexts/LanguageContext";
import { Star, X } from "lucide-react";

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
  const displayRating = isGoogle ? googleReviews?.rating?.toFixed(1) : "4.9";
  const displayTotal  = isGoogle ? `${googleReviews?.totalRatings}+` : "400+";

  const getText = (item) =>
    isGoogle ? item.text : (typeof item.text === "object" ? item.text[lang] : item.text);
  const getRole = (item) =>
    isGoogle ? item.relativeTime : (typeof item.role === "object" ? item.role[lang] : item.role);

  // Modal state — one shared <dialog> for whichever card was opened.
  const dialogRef    = useRef(null);
  const closeBtnRef  = useRef(null);
  const [active, setActive] = useState(null);
  const open  = useCallback((item) => setActive(item), []);
  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (active && !d.open) {
      d.showModal();
      requestAnimationFrame(() => closeBtnRef.current?.focus({ preventScroll: true }));
    }
    if (!active && d.open) d.close();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [active]);

  if (!items.length) return null;

  return (
    <section id="testimonials" style={{ background: C.bg }}>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--makas-border) 30%, var(--makas-border) 70%, transparent)" }} />

      <div style={{
        width: "min(1280px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(20px, 4vw, 32px)",
        paddingBlock: "clamp(40px, 5vw, 64px)",
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
            className="shrink-0 testimonial-rating-block"
          >
            {/* App Store-style: big number on the left, stars + count
                stacked on the right. Desktop falls back to the original
                compact inline form. */}
            <span className="testimonial-rating-num" style={{
              fontWeight: 600, color: C.primary,
              lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums",
            }}>
              {displayRating}
            </span>
            <div className="testimonial-rating-stack">
              <div className="testimonial-rating-stars flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14}
                    fill={s <= Math.round(Number(displayRating) || 5) ? C.primary : "transparent"}
                    style={{ color: C.primary }}
                  />
                ))}
              </div>
              <div className="testimonial-rating-count" style={{ color: C.muted }}>
                {displayTotal} {lang === "tr" ? "Google değerlendirmesi" : "Google reviews"}
              </div>
            </div>
          </motion.div>
        </div>

        {/* mobile = horizontal snap slider; tablet = 2 cols; desktop = 3
            cols max, wider cards with more breathing room. */}
        {items.length > 0 && (
          <>
            <style>{`
              /* ── Header rating block ──────────────────────────────────
                 Desktop default: small inline. Mobile: App Store layout —
                 large number on left, stars + count stacked on right. */
              .testimonial-rating-block { display: flex; align-items: baseline; gap: 8px; }
              .testimonial-rating-num   { font-size: 34px; }
              .testimonial-rating-stack { display: flex; align-items: baseline; gap: 8px; }
              .testimonial-rating-stars { display: none; }
              .testimonial-rating-count { font-size: 12px; }

              /* ── Card meta toggling ────────────────────────────────────
                 Mobile shows inline meta row, desktop shows avatar footer. */
              .testimonial-stars-desktop { display: flex; }
              .testimonial-author-footer { display: flex; }

              .testimonials-track {
                display: flex;
                align-items: stretch;
                gap: 16px;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                scroll-padding-inline: clamp(20px, 4vw, 32px);
                padding-inline: clamp(20px, 4vw, 32px);
                padding-block: 4px;
                margin-inline: calc(-1 * clamp(20px, 4vw, 32px));
                -webkit-overflow-scrolling: touch;
              }
              .testimonials-track::-webkit-scrollbar { display: none; }
              .testimonials-track { scrollbar-width: none; }
              .testimonials-track > * {
                flex: 0 0 min(82vw, 340px);
                scroll-snap-align: center;
                display: flex;
                flex-direction: column;
              }

              /* Mobile keeps the desktop card layout — header rating block
                 still uses the App Store stack (big number + stars/count). */
              @media (max-width: 767px) {
                .testimonial-rating-block { align-items: center; gap: 14px; }
                .testimonial-rating-num   { font-size: 56px; }
                .testimonial-rating-stack { flex-direction: column; align-items: flex-start; gap: 4px; }
                .testimonial-rating-stars { display: flex; }
                .testimonial-rating-count { font-size: 13px; }
              }

              @media (min-width: 768px) {
                .testimonials-track {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 20px;
                  overflow: visible;
                  padding-inline: 0;
                  margin-inline: 0;
                  align-items: stretch;
                }
                .testimonials-track > * { flex: initial; max-width: none; }
              }
              @media (min-width: 1024px) {
                .testimonials-track {
                  grid-template-columns: repeat(${Math.min(items.length, 4)}, minmax(0, 1fr));
                  gap: 18px;
                }
              }
            `}</style>
            <div className="testimonials-track">
              {items.slice(0, 4).map((item, i) => (
                <TestimonialCard
                  key={i}
                  i={i}
                  item={item}
                  lang={lang}
                  isGoogle={isGoogle}
                  text={getText(item)}
                  role={getRole(item)}
                  onOpen={() => open(item)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Full-review modal — opened from any card's "Read more" button. */}
      <style>{`
        .testimonial-modal::backdrop {
          background: rgba(17,17,17,0.55);
          backdrop-filter: blur(2px);
        }
      `}</style>
      <dialog
        ref={dialogRef}
        className="testimonial-modal"
        onClose={close}
        onClick={(e) => { if (e.target === dialogRef.current) close(); }}
        aria-label={lang === "tr" ? "Tam değerlendirme" : "Full review"}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          padding: 0,
          width: "min(92vw, 560px)",
          maxHeight: "82dvh",
          borderRadius: 16,
          color: C.primary,
          margin: "auto",
          boxShadow: "0 24px 60px rgba(17,17,17,0.25)",
        }}
      >
        {active && (
          <div style={{
            display: "flex", flexDirection: "column",
            padding: "22px 22px 20px", gap: 14, maxHeight: "82dvh",
          }}>
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14}
                    fill={s <= (active.rating ?? 5) ? C.primary : "transparent"}
                    style={{ color: C.primary }}
                  />
                ))}
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={close}
                aria-label={lang === "tr" ? "Kapat" : "Close"}
                style={{
                  width: 34, height: 34, borderRadius: 999,
                  background: "transparent", color: C.secondary,
                  border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{
              fontSize: "15px", color: C.secondary,
              lineHeight: 1.7, margin: 0,
              whiteSpace: "pre-wrap", overflowY: "auto",
            }}>
              &ldquo;{getText(active)}&rdquo;
            </p>

            <div
              className="flex items-center gap-3"
              style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}
            >
              {active.profilePhoto ? (
                <img
                  src={active.profilePhoto}
                  alt={active.name}
                  referrerPolicy="no-referrer"
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: C.primary, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                }}>
                  {active.avatar || active.name?.[0]}
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, color: C.primary, fontWeight: 600 }}>
                  {active.name}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                  {getRole(active)}
                </div>
              </div>
              {isGoogle && <GoogleIcon />}
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}

// ponytail: per-card local state so each card can independently detect
// overflow with a single ResizeObserver. The shared modal lives at section
// level — cards just shout up via onOpen.
function TestimonialCard({ i, item, lang, isGoogle, text, role, onOpen }) {
  const quoteRef = useRef(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = quoteRef.current;
    if (!el) return;
    const check = () => setTruncated(el.scrollHeight - el.clientHeight > 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  const C_ = C;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", flex: 1 }}
    >
      <div
        className="testimonial-card"
        style={{
          background: C_.card,
          border: `1px solid ${C_.border}`,
          borderRadius: "12px",
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: "180px",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "rgba(17,17,17,0.25)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = C_.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div className="testimonial-stars-desktop flex gap-0.5 mb-3">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={11}
              fill={s <= (item.rating ?? 5) ? C_.primary : "transparent"}
              style={{ color: C_.primary }}
            />
          ))}
        </div>

        {/* Quote + optional "Read more" — sits right above the author row
            so they read as one block. Empty space (if any) falls below. */}
        <div style={{
          display: "flex", flexDirection: "column",
          marginBottom: "14px",
        }}>
          <p ref={quoteRef} className="line-clamp-4 testimonial-quote" style={{
            fontSize: "13px",
            color: C_.secondary,
            lineHeight: 1.55,
            margin: 0,
          }}>
            &ldquo;{text}&rdquo;
          </p>
          {truncated && (
            <button
              type="button"
              onClick={onOpen}
              className="testimonial-readmore"
              style={{
                alignSelf: "flex-start",
                marginTop: 8,
                padding: 0,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: C_.primary,
                letterSpacing: "0.01em",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {lang === "tr" ? "Devamını oku" : "Read more"}
            </button>
          )}
        </div>

        {/* Desktop author footer with avatar (hidden on mobile — meta-inline
            carries name + date above). Sits right after the quote so the
            avatar+name reads as part of the testimonial, not floating. */}
        <div
          className="testimonial-author-footer flex items-center gap-3"
          style={{ paddingTop: "4px", marginTop: "auto" }}
        >
          {item.profilePhoto ? (
            <img
              className="testimonial-avatar"
              src={item.profilePhoto}
              alt={item.name}
              referrerPolicy="no-referrer"
              style={{
                width: "34px", height: "34px",
                borderRadius: "50%", objectFit: "cover", flexShrink: 0,
              }}
            />
          ) : (
            <div className="testimonial-avatar" style={{
              width: "34px", height: "34px", borderRadius: "50%",
              background: C_.primary, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700, color: "#fff",
            }}>
              {item.avatar || item.name?.[0]}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="testimonial-author-name" style={{
              fontSize: "13px", color: C_.primary, fontWeight: 600,
              letterSpacing: "-0.005em",
              lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {item.name}
            </div>
            <div style={{
              fontSize: "11px", color: C_.muted, marginTop: "2px",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {role}
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
  );
}

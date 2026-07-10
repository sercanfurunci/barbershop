"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Calendar, ArrowLeft, Sparkles } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const C = {
  bg:        "var(--makas-bg)",
  bgSoft:    "#FDFBF7",
  card:      "var(--makas-surface)",
  surface:   "var(--makas-surface2)",
  border:    "var(--makas-border)",
  primary:   "var(--makas-ink)",
  secondary: "var(--makas-ink-secondary)",
  muted:     "var(--makas-ink-muted)",
};

const TR_MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function formatDate(iso, lang) {
  if (!iso) return "";
  const d = new Date(iso);
  const months = lang === "en" ? EN_MONTHS : TR_MONTHS;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function Stars({ value, size = 12 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map((n) => (
        <Star key={n} size={size} fill={n <= value ? C.primary : "transparent"} style={{ color: C.primary }} />
      ))}
    </div>
  );
}

export default function BarberProfile({ shop, barber, initialReviews }) {
  const { lang } = useLang();
  const [reviews, setReviews] = useState(initialReviews?.reviews ?? []);
  const [hasMore, setHasMore] = useState(initialReviews?.hasMore ?? false);
  const [skip,    setSkip]    = useState(initialReviews?.reviews?.length ?? 0);
  const [loading, setLoading] = useState(false);

  const name  = lang === "en" ? (barber.nameEn || barber.nameTr) : barber.nameTr;
  const title = lang === "en" ? (barber.titleEn || barber.titleTr) : barber.titleTr;
  const bio   = lang === "en" ? (barber.bioEn || barber.bioTr) : barber.bioTr;

  const bookHref = `/${shop.slug}/book?barber=${barber.id}`;

  const loadMore = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ take: "20", skip: String(skip), barberId: barber.id, sort: "newest" });
      const res = await fetch(`/api/shops/${shop.slug}/reviews?${qs}`);
      const d = await res.json();
      const fresh = (d.reviews ?? []).map(r => ({
        id:           r.id,
        barberRating: r.barberRating,
        comment:      r.comment,
        createdAt:    r.createdAt,
        customerName: r.customerName,
      }));
      setReviews(prev => [...prev, ...fresh]);
      setHasMore(d.hasMore ?? false);
      setSkip(s => s + fresh.length);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section
        style={{
          width: "min(1280px, 100%)",
          marginInline: "auto",
          paddingInline: "clamp(20px, 4vw, 32px)",
          paddingTop: "calc(88px + clamp(28px, 5vw, 48px))",
          paddingBottom: "clamp(32px, 4vw, 56px)",
        }}
      >
        <Link
          href={`/${shop.slug}#barbers`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: C.muted, textDecoration: "none",
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={14} />
          {lang === "tr" ? "Ekibe dön" : "Back to team"}
        </Link>

        <div
          style={{
            display: "grid",
            gap: "clamp(20px, 4vw, 40px)",
            alignItems: "center",
            gridTemplateColumns: "1fr",
          }}
          className="md:grid-cols-[260px_1fr]"
        >
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              width: "clamp(180px, 40vw, 260px)",
              aspectRatio: "1 / 1",
              borderRadius: "50%",
              overflow: "hidden",
              background: C.surface,
              border: `1px solid ${C.border}`,
              justifySelf: "center",
            }}
          >
            {barber.profilePhoto ? (
              <Image
                src={barber.profilePhoto}
                alt={name}
                fill
                sizes="(max-width: 767px) 60vw, 260px"
                style={{ objectFit: "cover" }}
                priority
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                background: `linear-gradient(160deg, ${C.bgSoft} 0%, ${C.surface} 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 56, fontWeight: 500, color: C.muted, letterSpacing: "0.05em",
              }}>
                {initials(name)}
              </div>
            )}
            <span
              aria-label={barber.available ? "Müsait" : "İzinli"}
              title={barber.available ? "Müsait" : "İzinli"}
              style={{
                position: "absolute",
                bottom: 14, right: 14,
                width: 22, height: 22,
                borderRadius: "50%",
                background: barber.available ? "#16a34a" : "#9ca3af",
                border: "4px solid var(--makas-bg)",
              }}
            />
          </motion.div>

          {/* Identity */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: "left" }}
          >
            <h1
              className="font-display font-light"
              style={{
                fontSize: "clamp(34px, 4.5vw, 56px)",
                color: C.primary,
                letterSpacing: "-0.03em",
                lineHeight: 1.02,
                marginBottom: 8,
              }}
            >
              {name}
            </h1>
            {title && (
              <p style={{
                fontSize: 12, color: C.muted, letterSpacing: "0.1em",
                textTransform: "uppercase", fontWeight: 600, marginBottom: 18,
              }}>
                {title}
              </p>
            )}

            {/* Stat row */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center",
              marginBottom: 20,
            }}>
              {barber.rating > 0 && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Stars value={Math.round(barber.rating)} size={14} />
                  <span style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>
                    {barber.rating.toFixed(1)}
                  </span>
                  {barber.reviewCount > 0 && (
                    <span style={{ fontSize: 12, color: C.muted }}>· {barber.reviewCount} {lang === "tr" ? "yorum" : "reviews"}</span>
                  )}
                </div>
              )}
              {barber.yearsExp > 0 && (
                <div style={{ fontSize: 13, color: C.secondary }}>
                  <strong style={{ color: C.primary, fontWeight: 600 }}>{barber.yearsExp}</strong>{" "}
                  {lang === "tr" ? "yıl deneyim" : "years experience"}
                </div>
              )}
              {barber.completedCount > 0 && (
                <div style={{ fontSize: 13, color: C.secondary }}>
                  <strong style={{ color: C.primary, fontWeight: 600 }}>{barber.completedCount.toLocaleString()}</strong>{" "}
                  {lang === "tr" ? "tamamlanan kesim" : "completed cuts"}
                </div>
              )}
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600,
                  padding: "5px 10px", borderRadius: 999,
                  background: barber.available ? "rgba(22,163,74,0.10)" : "rgba(156,163,175,0.18)",
                  color: barber.available ? "#15803d" : "#4b5563",
                  border: `1px solid ${barber.available ? "rgba(22,163,74,0.22)" : "rgba(156,163,175,0.30)"}`,
                  letterSpacing: "0.02em",
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: barber.available ? "#16a34a" : "#9ca3af",
                }} />
                {barber.available
                  ? (lang === "tr" ? "Bugün müsait" : "Available today")
                  : (lang === "tr" ? "Şu an izinli" : "Off today")}
              </span>
            </div>

            {/* Specialties */}
            {barber.specialties?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {barber.specialties.map(s => (
                  <span key={s} style={{
                    fontSize: 11, padding: "5px 11px", borderRadius: 999,
                    background: C.surface, color: C.secondary,
                    border: `1px solid ${C.border}`, letterSpacing: "0.02em",
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            {bio && (
              <p style={{
                fontSize: 14, lineHeight: 1.65, color: C.secondary,
                maxWidth: 560, marginBottom: 24,
              }}>
                {bio}
              </p>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link
                href={bookHref}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 22px", borderRadius: 999,
                  background: C.primary, color: "#fff",
                  fontSize: 14, fontWeight: 600,
                  textDecoration: "none",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <Calendar size={15} />
                {lang === "tr" ? "Bu berberden randevu al" : "Book with this barber"}
              </Link>
              <Link
                href={`/${shop.slug}#barbers`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "12px 18px", borderRadius: 999,
                  background: "transparent", color: C.primary,
                  fontSize: 14, fontWeight: 600,
                  border: `1px solid ${C.border}`,
                  textDecoration: "none",
                }}
              >
                {lang === "tr" ? "Tüm ekibi gör" : "See full team"}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews */}
      <section style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <div style={{
          width: "min(1280px, 100%)",
          marginInline: "auto",
          paddingInline: "clamp(20px, 4vw, 32px)",
          paddingBlock: "clamp(40px, 5vw, 64px)",
        }}>
          <h2
            className="font-display font-light"
            style={{
              fontSize: "clamp(28px, 3.6vw, 44px)",
              color: C.primary,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            {lang === "tr" ? "Bu berbere gelen " : "Reviews for "}
            <span style={{ fontStyle: "italic" }}>{lang === "tr" ? "yorumlar" : "this barber"}</span>
          </h2>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
            {barber.reviewCount > 0
              ? `${barber.reviewCount} ${lang === "tr" ? "değerlendirme · ortalama" : "reviews · average"} ${barber.rating.toFixed(1)} / 5`
              : (lang === "tr" ? "Henüz değerlendirme yok — ilk yorum siz bırakın." : "No reviews yet — be the first.")}
          </p>

          {reviews.length === 0 ? (
            <div style={{
              padding: "40px 24px", textAlign: "center",
              background: C.card, border: `1px dashed ${C.border}`,
              borderRadius: 12,
            }}>
              <Sparkles size={20} style={{ color: C.muted, marginBottom: 10 }} />
              <p style={{ fontSize: 13, color: C.muted }}>
                {lang === "tr" ? "Yorum bekliyoruz." : "Awaiting first review."}
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "1fr",
            }}
              className="md:grid-cols-2"
            >
              {reviews.map((r) => (
                <article
                  key={r.id}
                  style={{
                    padding: "18px 20px",
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                  }}
                >
                  <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <Stars value={r.barberRating} size={13} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{r.barberRating}</span>
                    </div>
                    <span style={{ fontSize: 11, color: C.muted }}>{formatDate(r.createdAt, lang)}</span>
                  </header>
                  {r.comment && (
                    <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.secondary, marginBottom: 8 }}>
                      {r.comment}
                    </p>
                  )}
                  <footer style={{ fontSize: 11, color: C.muted, letterSpacing: "0.02em" }}>
                    — {r.customerName}
                  </footer>
                </article>
              ))}
            </div>
          )}

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                style={{
                  padding: "10px 22px", borderRadius: 999,
                  background: "transparent", color: C.primary,
                  fontSize: 13, fontWeight: 600,
                  border: `1px solid ${C.border}`,
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading
                  ? (lang === "tr" ? "Yükleniyor…" : "Loading…")
                  : (lang === "tr" ? "Daha fazla yorum" : "Load more")}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section style={{
        width: "min(1280px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(20px, 4vw, 32px)",
        paddingBlock: "clamp(32px, 5vw, 56px)",
      }}>
        <div style={{
          padding: "clamp(24px, 4vw, 40px)",
          borderRadius: 16,
          background: C.card,
          border: `1px solid ${C.border}`,
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between",
          gap: 16,
        }}>
          <div>
            <p className="font-display" style={{ fontSize: "clamp(20px, 2.5vw, 28px)", color: C.primary, letterSpacing: "-0.02em", marginBottom: 4 }}>
              {lang === "tr" ? `${name} ile randevu al` : `Book with ${name}`}
            </p>
            <p style={{ fontSize: 13, color: C.muted }}>
              {barber.available
                ? (lang === "tr" ? "Bugün müsait — anında onay" : "Available today — instant confirmation")
                : (lang === "tr" ? "İlk uygun gün için tarih seçin" : "Pick the next open day")}
            </p>
          </div>
          <Link
            href={bookHref}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 22px", borderRadius: 999,
              background: C.primary, color: "#fff",
              fontSize: 14, fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Calendar size={15} />
            {lang === "tr" ? "Randevu al" : "Book now"}
          </Link>
        </div>
      </section>
    </>
  );
}

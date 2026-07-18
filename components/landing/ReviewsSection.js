"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const C = {
  bg:        "var(--makas-bg)",
  card:      "var(--makas-surface)",
  surface:   "var(--makas-surface2)",
  border:    "var(--makas-border)",
  primary:   "var(--makas-ink)",
  secondary: "var(--makas-ink-secondary)",
  muted:     "var(--makas-ink-muted)",
};

const TR_MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

// ponytail: page-1 reviews ship from SSR; "Show more" client-fetches with skip.
export default function ReviewsSection({ slug, initial }) {
  const { lang } = useLang();
  const [reviews,  setReviews]  = useState(initial?.reviews ?? []);
  const [summary]               = useState(initial?.summary ?? { avgRating: 0, totalReviews: 0, distribution: { 1:0,2:0,3:0,4:0,5:0 } });
  const [hasMore,  setHasMore]  = useState(initial?.hasMore ?? false);
  const [filter,   setFilter]   = useState(null);   // null | 1..5
  const [sort,     setSort]     = useState("newest");
  const [loading,  setLoading]  = useState(false);
  const [skip,     setSkip]     = useState(initial?.reviews?.length ?? 0);

  // Refetch when filter or sort changes (page 1).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ sort, take: "20" });
    if (filter) qs.set("stars", String(filter));
    fetch(`/api/shops/${slug}/reviews?${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setReviews(d.reviews ?? []);
        setHasMore(d.hasMore ?? false);
        setSkip(d.reviews?.length ?? 0);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filter, sort, slug]);

  const loadMore = async () => {
    setLoading(true);
    const qs = new URLSearchParams({ sort, take: "20", skip: String(skip) });
    if (filter) qs.set("stars", String(filter));
    try {
      const res = await fetch(`/api/shops/${slug}/reviews?${qs}`);
      const d = await res.json();
      setReviews((prev) => [...prev, ...(d.reviews ?? [])]);
      setHasMore(d.hasMore ?? false);
      setSkip((s) => s + (d.reviews?.length ?? 0));
    } finally {
      setLoading(false);
    }
  };

  const maxBucket = useMemo(
    () => Math.max(1, ...Object.values(summary.distribution || {})),
    [summary.distribution]
  );

  if (!summary.totalReviews) return null;

  return (
    <section id="reviews" style={{ background: C.bg }}>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--makas-border) 30%, var(--makas-border) 70%, transparent)" }} />

      <div style={{
        width: "min(1280px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(16px, 4vw, 32px)",
        paddingBlock: "clamp(24px, 5vw, 64px)",
      }}>
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-light"
          style={{
            fontSize: "clamp(40px, 5.5vw, 72px)",
            color: C.primary,
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
            marginBottom: 24,
            textWrap: "balance",
          }}
        >
          {lang === "tr" ? "Müşteri " : "Customer "}
          <span style={{ fontStyle: "italic" }}>{lang === "tr" ? "değerlendirmeleri" : "reviews"}</span>
        </motion.h2>

        {/* Summary: big number + distribution bars */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(160px, 220px) 1fr",
          gap: "clamp(20px, 4vw, 40px)",
          alignItems: "center",
          padding: "clamp(20px, 3vw, 28px)",
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          marginBottom: 24,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "clamp(56px, 8vw, 84px)",
              fontWeight: 600,
              color: C.primary,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}>
              {summary.avgRating.toFixed(1)}
            </div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
              <Stars value={Math.round(summary.avgRating)} size={16} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
              {summary.totalReviews} {lang === "tr" ? "değerlendirme" : "reviews"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[5,4,3,2,1].map((s) => {
              const count = summary.distribution[s] ?? 0;
              const pct = (count / maxBucket) * 100;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 14, textAlign: "right", fontSize: 12, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{s}</span>
                  <Star size={12} fill={C.primary} style={{ color: C.primary }} />
                  <div style={{ flex: 1, height: 6, background: C.surface, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: C.primary, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ width: 28, fontSize: 12, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter chips + sort */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip active={filter === null} onClick={() => setFilter(null)}>
              {lang === "tr" ? "Hepsi" : "All"}
            </Chip>
            {[5,4,3,2,1].map((s) => (
              <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
                {s} <Star size={11} fill="currentColor" style={{ display: "inline-block", marginLeft: 2, verticalAlign: "-1px" }} />
              </Chip>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.primary,
              fontSize: 13,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="newest">{lang === "tr" ? "En yeni" : "Newest"}</option>
            <option value="oldest">{lang === "tr" ? "En eski" : "Oldest"}</option>
            <option value="highest">{lang === "tr" ? "En yüksek puan" : "Highest rating"}</option>
            <option value="lowest">{lang === "tr" ? "En düşük puan" : "Lowest rating"}</option>
          </select>
        </div>

        {/* Cards: horizontal scroll on mobile, grid on desktop */}
        {reviews.length === 0 ? (
          <p style={{ textAlign: "center", color: C.muted, padding: "32px 0", fontSize: 14 }}>
            {loading
              ? (lang === "tr" ? "Yükleniyor…" : "Loading…")
              : (lang === "tr" ? "Bu filtreye uygun değerlendirme yok." : "No reviews match this filter.")}
          </p>
        ) : (
          <>
            <style>{`
              .reviews-track {
                display: flex;
                gap: 16px;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                padding-inline: clamp(20px, 4vw, 32px);
                margin-inline: calc(-1 * clamp(20px, 4vw, 32px));
                padding-block: 4px;
                -webkit-overflow-scrolling: touch;
              }
              .reviews-track::-webkit-scrollbar { display: none; }
              .reviews-track { scrollbar-width: none; }
              .reviews-track > * {
                flex: 0 0 min(82vw, 320px);
                scroll-snap-align: center;
              }
              @media (min-width: 768px) {
                .reviews-track {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 16px;
                  overflow: visible;
                  padding-inline: 0;
                  margin-inline: 0;
                }
                .reviews-track > * { flex: initial; max-width: none; }
              }
              @media (min-width: 1024px) {
                .reviews-track { grid-template-columns: repeat(3, 1fr); }
              }
            `}</style>
            <div className="reviews-track">
              {reviews.map((r) => <ReviewCard key={r.id} r={r} lang={lang} />)}
            </div>
          </>
        )}

        {hasMore && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: C.primary,
                border: `1px solid ${C.border}`,
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading
                ? (lang === "tr" ? "Yükleniyor…" : "Loading…")
                : (lang === "tr" ? "Daha fazla göster" : "Show more")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? C.primary : C.border}`,
        background: active ? C.primary : "transparent",
        color: active ? "#fff" : C.secondary,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {children}
    </button>
  );
}

function ReviewCard({ r, lang }) {
  const initial = r.customerName?.[0]?.toUpperCase() ?? "?";
  return (
    <article style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 18,
      display: "flex",
      flexDirection: "column",
      minHeight: 180,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Stars value={r.shopRating} size={13} />
        <span style={{ fontSize: 11, color: C.muted }}>{formatDate(r.createdAt, lang)}</span>
      </div>

      {r.comment && (
        <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.55, margin: 0, marginBottom: 14 }}>
          &ldquo;{r.comment}&rdquo;
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: C.primary, color: "var(--makas-bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700,
        }}>{initial}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: C.primary, fontWeight: 600, lineHeight: 1.25 }}>
              {r.customerName}
            </span>
            {/* Verified badge — all reviews in this system come from post-appointment tokens */}
            <span title={lang === "tr" ? "Onaylanmış randevu" : "Verified visit"} style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 10, fontWeight: 600, color: "#15803d",
              background: "#dcfce7", borderRadius: 99,
              paddingInline: 5, paddingBlock: 2,
            }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6l3 3 5-5" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {lang === "tr" ? "Onaylı" : "Verified"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{r.barber?.nameTr || (lang === "tr" ? "Berber" : "Barber")}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <Stars value={r.barberRating} size={9} />
          </div>
        </div>
      </div>
    </article>
  );
}

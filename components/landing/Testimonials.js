"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { testimonials } from "@/lib/data";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { Star } from "lucide-react";

const C = {
  bg:       "#FFFFFF",
  card:     "#FFFFFF",
  border:   "#E5DFD6",
  surface:  "#EFEAE2",
  primary:  "#111111",
  secondary:"#44403C",
  muted:    "#6B7280",
  red:      "#C62828",
};

function ReviewCard({ item, active, onClick, lang, isGoogle }) {
  const text = isGoogle ? item.text : item.text[lang];
  const role = isGoogle ? item.relativeTime : item.role[lang];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        background: active ? "#FEF2F2" : C.card,
        border: `1px solid ${active ? "rgba(198,40,40,0.25)" : C.border}`,
        borderRadius: "12px",
        padding: "24px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={onClick}
    >
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {[1,2,3,4,5].map(s => (
          <Star key={s} size={11}
            fill={s <= (item.rating ?? 5) ? C.red : "transparent"}
            style={{ color: C.red }}
          />
        ))}
      </div>

      {/* Quote */}
      <p className="line-clamp-4" style={{ fontSize: "13px", color: C.secondary, lineHeight: 1.65 }}>
        &ldquo;{text}&rdquo;
      </p>

      <div style={{ flex: 1, minHeight: "16px" }} />

      {/* Author */}
      <div className="flex items-center gap-3" style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
        {item.profilePhoto ? (
          <img
            src={item.profilePhoto}
            alt={item.name}
            referrerPolicy="no-referrer"
            style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div
            className="flex items-center justify-center font-bold text-white shrink-0"
            style={{ width: "36px", height: "36px", background: C.red, borderRadius: "8px", fontSize: "12px" }}
          >
            {item.avatar}
          </div>
        )}
        <div>
          <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, lineHeight: 1.3 }}>{item.name}</div>
          <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.04em", lineHeight: 1.3 }}>{role}</div>
        </div>
        {isGoogle && (
          <div style={{ marginLeft: "auto" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState(0);
  const [googleData, setGoogleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();
  const tx = useT(lang);

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then(data => {
        if (data.reviews?.length) setGoogleData(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isGoogle = !!(googleData?.reviews?.length);
  const items = isGoogle
    ? googleData.reviews
    : testimonials.map(t => ({ ...t, text: t.text, role: t.role, avatar: t.avatar }));

  const displayRating = isGoogle ? googleData.rating?.toFixed(1) : "4.9";
  const displayTotal  = isGoogle ? `${googleData.totalRatings}+` : "400+";

  return (
    <section id="testimonials" ref={ref} style={{ background: C.bg }}>
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #E5DFD6, transparent)" }} />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-24 lg:py-32">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-16"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div style={{ width: "20px", height: "2px", background: C.red, borderRadius: "1px" }} />
              <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.red, fontWeight: 500 }}>
                {tx.testimonials.sectionLabel}
              </span>
            </div>
            <h2
              className="font-display font-light"
              style={{ fontSize: "clamp(32px, 4.5vw, 52px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {lang === "tr" ? "Müşterilerimiz" : "Our Clients"}{" "}
              <span style={{ fontStyle: "italic", color: C.red }}>
                {lang === "tr" ? "anlatıyor" : "speak"}
              </span>
            </h2>
          </div>

          {/* Overall rating */}
          <div
            className="flex items-center gap-6 px-6 py-4 shrink-0"
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px" }}
          >
            <div className="text-center">
              <div className="font-display font-light" style={{ fontSize: "36px", color: C.primary, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {displayRating}
              </div>
              <div className="flex gap-0.5 justify-center mt-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={C.red} style={{ color: C.red }} />)}
              </div>
            </div>
            <div style={{ width: "1px", height: "40px", background: C.border }} />
            <div>
              <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>
                {displayTotal} {lang === "tr" ? "değerlendirme" : "reviews"}
              </div>
              <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                {isGoogle ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </>
                ) : "Google · Facebook"}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} style={{ height: "200px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", opacity: 0.4 }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.slice(0, 4).map((item, i) => (
              <ReviewCard
                key={i}
                item={item}
                active={i === active}
                onClick={() => setActive(i)}
                lang={lang}
                isGoogle={isGoogle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

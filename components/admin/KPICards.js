"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { apiFetch } from "@/lib/api";

import { C, SHADOW } from "@/lib/adminTheme";

function buildSparkPath(data, w, h) {
  if (!data || data.length < 2) return { path: `M 0 ${h} L ${w} ${h}`, pts: [] };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${mx} ${pts[i - 1].y}, ${mx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  return { path: d, pts };
}

function useCounter(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    start.current = null;
    const isFloat = !Number.isInteger(target);
    const animate = (ts) => {
      if (!start.current) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(isFloat ? target * eased : Math.round(target * eased));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return val;
}

function KPICard({ card, delay, vsLabel }) {
  const animated = useCounter(card.value, 1100);
  const positive  = card.change >= 0;
  const SW = 96, SH = 32;
  const { path, pts } = buildSparkPath(card.spark, SW, SH);
  const fillPath = path + ` L ${SW} ${SH} L 0 ${SH} Z`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", boxShadow: SHADOW.card, transition: "box-shadow 0.18s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = SHADOW.elevated; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = SHADOW.card; }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono-custom" style={{ fontSize: "10px", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" }}>
          {card.label}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            height: "20px",
            padding: "0 7px",
            borderRadius: "20px",
            fontSize: "10px",
            fontWeight: 600,
            background: positive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            color: positive ? "#15803D" : "#111111",
          }}
        >
          {positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {positive ? "+" : ""}{card.change}%
        </span>
      </div>

      <div
        className="font-display"
        style={{ fontSize: "28px", color: C.primary, lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 400 }}
      >
        {card.format(animated)}
      </div>

      <div style={{ flex: 1 }} />

      <div className="flex items-end justify-between gap-4">
        <span style={{ fontSize: "11px", color: C.muted, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vsLabel}</span>
        <svg width={SW} height={SH} className="shrink-0">
          <defs>
            <linearGradient id={`sg-${card.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={card.accent} stopOpacity="0.25" />
              <stop offset="100%" stopColor={card.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {pts.length > 0 && (
            <>
              <path d={fillPath} fill={`url(#sg-${card.key})`} />
              <path d={path} fill="none" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={card.accent} />
            </>
          )}
        </svg>
      </div>

      <div
        className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none"
        style={{ background: `radial-gradient(circle at 0% 100%, ${card.accent}18 0%, transparent 70%)` }}
      />
    </motion.div>
  );
}

const SKELETON_CARDS = [
  { key: "revenue",      accent: "#111111" },
  { key: "appointments", accent: "#6D28D9" },
  { key: "clients",      accent: "#0F766E" },
  { key: "rating",       accent: "#B45309" },
];

export default function KPICards() {
  const { lang } = useLang();
  const tx = useT(lang);
  const kpi = tx.admin.kpi;

  const [stats, setStats]   = useState(null);
  const [sparks, setSparks] = useState({});

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/stats").catch(() => null),
      apiFetch("/api/admin/revenue?range=30d").catch(() => null),
    ]).then(([s, r]) => {
      if (s) setStats(s);
      if (r?.data) setSparks({ revenue: r.data.map(p => p.value) });
    });
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {SKELETON_CARDS.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "18px 20px", height: "118px", boxShadow: SHADOW.card }}
          >
            <div style={{ height: "8px", background: C.surface, borderRadius: "4px", width: "60%", marginBottom: "16px" }} />
            <div style={{ height: "28px", background: C.surface, borderRadius: "4px", width: "50%" }} />
          </motion.div>
        ))}
      </div>
    );
  }

  const flatSpark = sparks.revenue ?? [];

  const fmtTL = (v) => `₺${Math.round(v).toLocaleString()}`;
  const grossSub = `Brüt ${fmtTL(stats.thisMonthGross ?? stats.thisMonthRevenue ?? 0)} · Berber ${fmtTL(stats.thisMonthBarberPaid ?? 0)}`;
  const walkInSub = stats.walkInRate != null
    ? `Walk-in %${stats.walkInRate}`
    : kpi.vsLastMonth;

  const CARDS = [
    {
      key:    "revenue",
      label:  kpi.revenue,
      value:  stats.thisMonthShopNet ?? stats.thisMonthRevenue ?? 0,
      change: stats.shopNetChange ?? stats.revenueChange,
      format: fmtTL,
      spark:  flatSpark,
      accent: "#111111",
      vs:     grossSub,
    },
    {
      key:    "appointments",
      label:  kpi.appointments,
      value:  stats.totalAppointments,
      change: stats.appointmentsChange,
      format: (v) => Math.round(v).toString(),
      spark:  flatSpark.map((_, i) => i),
      accent: "#6D28D9",
      vs:     walkInSub,
    },
    {
      key:    "clients",
      label:  kpi.clients,
      value:  stats.totalClients,
      change: stats.clientsChange,
      format: (v) => Math.round(v).toString(),
      spark:  flatSpark.map((_, i) => i),
      accent: "#0F766E",
    },
    {
      key:    "rating",
      label:  kpi.rating,
      value:  stats.avgRating,
      change: stats.ratingChange,
      format: (v) => v.toFixed(2),
      spark:  [5, 4.9, 5, 5.0, 4.95, 5, stats.avgRating],
      accent: "#B45309",
      vs:     stats.topService ? `En çok: ${stats.topService.name}` : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map((card, i) => (
        <KPICard key={card.key} card={card} delay={i * 0.07} vsLabel={card.vs ?? kpi.vsLastMonth} />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { adminStats, kpiSparklines } from "@/lib/data";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";

const C = {
  card:      "#111118",
  border:    "rgba(255,255,255,0.06)",
  surface:   "#16161e",
  primary:   "#f1f0ed",
  secondary: "#6b6870",
  muted:     "#2e2d35",
  red:       "#CC1A1A",
};

function buildSparkPath(data, w, h) {
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
      className="relative overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: "11px", letterSpacing: "0.06em", color: C.secondary, textTransform: "uppercase" }}>
          {card.label}
        </span>
        <span
          className="flex items-center gap-1"
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
            color: positive ? "#22c55e" : "#ef4444",
          }}
        >
          {positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {positive ? "+" : ""}{card.change}%
        </span>
      </div>

      <div
        className="font-display font-light"
        style={{ fontSize: "24px", color: C.primary, lineHeight: 1, letterSpacing: "-0.02em" }}
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
          <path d={fillPath} fill={`url(#sg-${card.key})`} />
          <path d={path} fill="none" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={card.accent} />
        </svg>
      </div>

      <div
        className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none"
        style={{ background: `radial-gradient(circle at 0% 100%, ${card.accent}18 0%, transparent 70%)` }}
      />
    </motion.div>
  );
}

export default function KPICards() {
  const { lang } = useLang();
  const tx = useT(lang);
  const kpi = tx.admin.kpi;

  const CARDS = [
    {
      key:    "revenue",
      label:  kpi.revenue,
      value:  adminStats.totalRevenue,
      change: adminStats.revenueChange,
      format: (v) => `₺${Math.round(v).toLocaleString()}`,
      spark:  kpiSparklines.revenue,
      accent: "#CC1A1A",
    },
    {
      key:    "appointments",
      label:  kpi.appointments,
      value:  adminStats.totalAppointments,
      change: adminStats.appointmentsChange,
      format: (v) => Math.round(v).toString(),
      spark:  kpiSparklines.appointments,
      accent: "#a78bfa",
    },
    {
      key:    "clients",
      label:  kpi.clients,
      value:  adminStats.newClients,
      change: adminStats.clientsChange,
      format: (v) => Math.round(v).toString(),
      spark:  kpiSparklines.clients,
      accent: "#34d399",
    },
    {
      key:    "rating",
      label:  kpi.rating,
      value:  adminStats.avgRating,
      change: adminStats.ratingChange,
      format: (v) => v.toFixed(2),
      spark:  kpiSparklines.rating,
      accent: "#fbbf24",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map((card, i) => (
        <KPICard key={card.key} card={card} delay={i * 0.07} vsLabel={kpi.vsLastMonth} />
      ))}
    </div>
  );
}

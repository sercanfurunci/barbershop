"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";

const C = {
  card:      "#FFFFFF",
  border:    "rgba(17,17,17,0.08)",
  surface:   "#F1EEE8",
  grid:      "rgba(17,17,17,0.05)",
  primary:   "#111111",
  secondary: "#57514B",
  muted:     "#6E6760",
};

const PAD = { t: 24, r: 16, b: 36, l: 60 };
const VW = 600, VH = 200;
const CW = VW - PAD.l - PAD.r;
const CH = VH - PAD.t - PAD.b;

function buildPath(data) {
  if (!data || data.length < 2) return { pts: [], line: "", fill: "", max: 0 };
  const vals  = data.map((d) => d.value);
  const max   = Math.max(...vals) || 1;

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * CW,
    y: PAD.t + CH - (d.value / max) * CH,
  }));

  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1].x + pts[i].x) / 2;
    line += ` C ${mx} ${pts[i - 1].y}, ${mx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }

  const fill = line
    + ` L ${pts[pts.length - 1].x} ${PAD.t + CH}`
    + ` L ${pts[0].x} ${PAD.t + CH} Z`;

  return { pts, line, fill, max };
}

function yTicks(max, count = 4) {
  const step = Math.ceil(max / count / 1000) * 1000 || 1;
  return Array.from({ length: count + 1 }, (_, i) => i * step).filter((v) => v <= max * 1.1);
}

export default function AreaChart({ barberId }) {
  const [period, setPeriod]   = useState("30d");
  const [tooltip, setTooltip] = useState(null);
  const [chartData, setChartData] = useState({ "7d": null, "30d": null });
  const svgRef = useRef(null);
  const { lang } = useLang();
  const tx = useT(lang);
  const chartTx = tx.admin.chart;

  useEffect(() => {
    const params = new URLSearchParams({ range: period });
    if (barberId) params.set("barberId", barberId);
    apiFetch(`/api/admin/revenue?${params}`)
      .then(d => setChartData(prev => ({ ...prev, [period]: d })))
      .catch(() => {});
  }, [period, barberId]);

  const current = chartData[period];
  const data = current?.data ?? [];
  const total = current?.total ?? 0;
  const avg   = current?.avg ?? 0;

  const PERIODS = [
    { key: "7d",  label: lang === "tr" ? "7G"  : "7D"  },
    { key: "30d", label: lang === "tr" ? "30G" : "30D" },
  ];

  const { pts, line, fill, max } = buildPath(data);
  const ticks = yTicks(max);

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current || pts.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX  = ((e.clientX - rect.left) / rect.width) * VW;
    let closest = 0, minDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p.x - svgX);
      if (d < minDist) { minDist = d; closest = i; }
    });
    setTooltip({ idx: closest, x: pts[closest].x, y: pts[closest].y, value: data[closest].value, label: data[closest].date });
  }, [pts, data]);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: C.secondary, marginBottom: "6px" }}>
            {chartTx.title}
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-display font-light" style={{ fontSize: "30px", color: C.primary, lineHeight: 1, letterSpacing: "-0.02em" }}>
              ₺{total.toLocaleString()}
            </span>
            {avg > 0 && (
              <span style={{ fontSize: "12px", color: C.secondary }}>
                ₺{avg.toLocaleString()} {chartTx.avgDay}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 p-1" style={{ background: C.surface, borderRadius: "7px" }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="transition-all duration-150"
              style={{
                padding: "4px 12px",
                borderRadius: "5px",
                fontSize: "11px",
                fontWeight: period === p.key ? 500 : 400,
                color: period === p.key ? C.primary : C.secondary,
                background: period === p.key ? C.card : "transparent",
                letterSpacing: "0.06em",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ height: `${VH}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "12px", color: C.muted }}>Veri yükleniyor…</div>
        </div>
      ) : (
        <div className="relative" onMouseLeave={() => setTooltip(null)}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            className="w-full"
            style={{ overflow: "visible" }}
            onMouseMove={handleMouseMove}
          >
            <defs>
              <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.primary} stopOpacity="0.22" />
                <stop offset="100%" stopColor={C.primary} stopOpacity="0"    />
              </linearGradient>
            </defs>

            {ticks.map((tick) => {
              const range = Math.max(...ticks);
              const y = PAD.t + CH - (tick / (range || 1)) * CH;
              return (
                <g key={tick}>
                  <line x1={PAD.l} y1={y} x2={VW - PAD.r} y2={y} stroke={C.grid} strokeWidth="1" />
                  <text x={PAD.l - 8} y={y + 4} fill={C.muted} fontSize="9" textAnchor="end" fontFamily="'DM Mono', monospace">
                    {tick >= 1000 ? `₺${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k` : `₺${tick}`}
                  </text>
                </g>
              );
            })}

            {data.map((d, i) => {
              const step = data.length <= 7 ? 1 : Math.ceil(data.length / 6);
              if (i % step !== 0 && i !== data.length - 1) return null;
              return (
                <text key={i} x={pts[i].x} y={VH - 6} fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="'DM Mono', monospace">
                  {d.date}
                </text>
              );
            })}

            <motion.path
              key={period + "-fill"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              d={fill}
              fill="url(#area-fill)"
            />

            <motion.path
              key={period + "-line"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              d={line}
              fill="none"
              stroke={C.primary}
              strokeWidth="1.75"
              strokeLinecap="round"
            />

            {tooltip && (
              <g>
                <line x1={tooltip.x} y1={PAD.t} x2={tooltip.x} y2={PAD.t + CH} stroke="rgba(17,17,17,0.18)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={C.primary} stroke="#F8F6F2" strokeWidth="2" />
              </g>
            )}
          </svg>

          {tooltip && tooltip.value > 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${(tooltip.x / VW) * 100}%`,
                top: `${(tooltip.y / VH) * 100}%`,
                transform: "translate(-50%, -120%)",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "6px",
                padding: "6px 10px",
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ fontSize: "11px", color: C.secondary, marginBottom: "2px" }}>{tooltip.label}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>₺{tooltip.value.toLocaleString()}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

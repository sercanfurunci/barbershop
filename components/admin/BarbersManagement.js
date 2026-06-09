"use client";

import { motion } from "framer-motion";
import { barbers, barberPerformance } from "@/lib/data";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function BarbersManagement() {
  const { lang } = useLang();
  const tx = useT(lang);
  const barberTx = tx.admin.barbers;

  return (
    <div className="space-y-5">
      {/* Revenue share */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: C.secondary, marginBottom: "16px" }}>
          {barberTx.revenueShare}
        </p>
        <div className="space-y-4">
          {barberPerformance.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 flex items-center justify-center font-bold text-white shrink-0"
                    style={{ background: C.red, fontSize: "10px", borderRadius: "5px" }}
                  >
                    {b.avatar}
                  </div>
                  <span style={{ fontSize: "13px", color: C.primary }}>{b.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: "12px", color: C.secondary }}>{b.appointments} {barberTx.appts}</span>
                  <span className="font-display font-light" style={{ fontSize: "16px", color: C.primary, minWidth: "80px", textAlign: "right" }}>
                    ₺{b.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full" style={{ background: C.surface, borderRadius: "99px", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.share * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: "100%", background: C.red, borderRadius: "99px", opacity: 0.7 + b.share * 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Barber cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {barbers.map((barber, i) => {
          const perf = barberPerformance.find((p) => p.name === barber.name);
          return (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center font-bold text-white"
                    style={{ width: "44px", height: "44px", background: `linear-gradient(135deg, ${C.red}, #9A1212)`, borderRadius: "10px", fontSize: "14px" }}
                  >
                    {barber.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: C.primary, lineHeight: 1.3 }}>{barber.name}</div>
                    <div style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.red, lineHeight: 1.3 }}>{barber.title[lang]}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      height: "20px",
                      padding: "0 8px",
                      fontSize: "10px",
                      borderRadius: "4px",
                      background: barber.available ? "rgba(34,197,94,0.1)" : "rgba(82,82,91,0.2)",
                      color: barber.available ? "#4ade80" : C.secondary,
                      fontWeight: 500,
                    }}
                  >
                    {barber.available ? barberTx.active : barberTx.off}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="w-7 h-7 flex items-center justify-center"
                      style={{ color: C.secondary }}
                    >
                      <MoreVertical size={14} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      style={{ background: "#1a1a22", border: `1px solid ${C.border}`, borderRadius: "8px" }}
                    >
                      {barberTx.actions.map((l) => (
                        <DropdownMenuItem
                          key={l}
                          className="cursor-pointer"
                          style={{ padding: "7px 12px", fontSize: "12px", color: C.secondary }}
                        >
                          {l}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Bio */}
              <p className="line-clamp-2" style={{ fontSize: "12px", color: C.secondary, lineHeight: 1.6, marginBottom: "14px" }}>
                {barber.bio[lang]}
              </p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5">
                {barber.specialties[lang].map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.06em",
                      padding: "2px 8px",
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: "4px",
                      color: C.secondary,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div style={{ flex: 1, minHeight: "12px" }} />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                {[
                  { label: barberTx.statLabels.exp,     value: `${barber.yearsExp}${lang === "tr" ? " yıl" : "y"}` },
                  { label: barberTx.statLabels.rating,  value: barber.rating },
                  { label: barberTx.statLabels.revenue, value: perf ? `₺${(perf.revenue / 1000).toFixed(0)}k` : "—" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="font-display font-light" style={{ fontSize: "18px", color: C.primary, lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginTop: "2px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add barber */}
      <button
        className="w-full flex items-center justify-center gap-2 transition-all duration-200"
        style={{
          border: `1px dashed ${C.muted}`,
          borderRadius: "12px",
          padding: "20px",
          fontSize: "12px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: C.muted,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.color = C.muted; }}
      >
        {barberTx.addBarber}
      </button>
    </div>
  );
}

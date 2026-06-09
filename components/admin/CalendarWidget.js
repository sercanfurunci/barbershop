"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { appointmentDates } from "@/lib/data";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay,
} from "date-fns";
import { tr as dateFnsTr, enUS } from "date-fns/locale";
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

const DAYS_TR = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"];
const DAYS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function getDotColor(count) {
  if (count >= 7) return C.red;
  if (count >= 5) return "#f59e0b";
  return "#22c55e";
}

export default function CalendarWidget() {
  const [month, setMonth] = useState(new Date(2026, 5, 1));
  const today  = new Date(2026, 5, 9);
  const { lang } = useLang();
  const tx = useT(lang);
  const calTx = tx.admin.calendar;
  const locale = lang === "tr" ? dateFnsTr : enUS;
  const DAYS = lang === "tr" ? DAYS_TR : DAYS_EN;

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = (getDay(startOfMonth(month)) + 6) % 7;
  const padded = [...Array(startPad).fill(null), ...days];

  const todayKey = format(today, "yyyy-MM-dd");
  const todayCount = appointmentDates[todayKey] || 0;
  const todayAppts = [
    { time: "10:00", name: "Ahmet Yıldız",   service: lang === "tr" ? "VIP Bakım"       : "VIP Grooming"  },
    { time: "11:30", name: "Mert Çelik",      service: lang === "tr" ? "Usta Tıraşı"    : "Royal Shave"   },
    { time: "13:00", name: "Burak Öztürk",    service: lang === "tr" ? "Soluk & Kıvrım" : "Fade & Taper"  },
    { time: "14:30", name: "Can Polat",        service: lang === "tr" ? "Kesim & Sakal"  : "Cut & Beard"   },
    { time: "15:00", name: "Kemal Arslan",     service: lang === "tr" ? "Klasik Kesim"   : "Classic Cut"   },
  ].slice(0, todayCount);

  return (
    <div
      className="flex flex-col"
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: C.secondary }}>
            {calTx.title}
          </p>
          <p className="font-display font-light mt-0.5" style={{ fontSize: "18px", color: C.primary, letterSpacing: "-0.01em" }}>
            {format(month, "MMMM yyyy", { locale })}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="flex items-center justify-center w-7 h-7 transition-colors"
            style={{ background: C.surface, borderRadius: "5px", color: C.secondary }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="flex items-center justify-center w-7 h-7 transition-colors"
            style={{ background: C.surface, borderRadius: "5px", color: C.secondary }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center py-1.5" style={{ fontSize: "9px", letterSpacing: "0.1em", color: C.muted }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {padded.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;

          const key          = format(day, "yyyy-MM-dd");
          const count        = appointmentDates[key] || 0;
          const isCurrentDay = isSameDay(day, today);
          const isPast       = isBefore(startOfDay(day), startOfDay(today));

          return (
            <div key={key} className="flex flex-col items-center py-1">
              <div
                className="w-7 h-7 flex items-center justify-center transition-all"
                style={{
                  borderRadius: "6px",
                  background: isCurrentDay ? C.red : "transparent",
                  fontSize: "11px",
                  fontWeight: isCurrentDay ? 600 : 400,
                  color: isCurrentDay ? "#fff" : isPast ? C.muted : C.primary,
                  cursor: count ? "pointer" : "default",
                }}
              >
                {format(day, "d")}
              </div>
              {count > 0 && (
                <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: isCurrentDay ? "rgba(255,255,255,0.6)" : getDotColor(count) }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="my-4" style={{ height: "1px", background: C.border }} />

      {/* Today's schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: C.secondary }}>
            {calTx.today}
          </p>
          <span
            className="px-2 py-0.5"
            style={{ fontSize: "10px", color: C.red, background: `${C.red}18`, borderRadius: "4px" }}
          >
            {todayCount} {calTx.booked}
          </span>
        </div>
        <div className="space-y-2">
          {todayAppts.map((appt, i) => (
            <motion.div
              key={appt.time}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3"
              style={{ padding: "8px 10px", background: C.surface, borderRadius: "7px" }}
            >
              <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: C.secondary, minWidth: "36px" }}>
                {appt.time}
              </span>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: "12px", color: C.primary, lineHeight: 1.3 }}>{appt.name}</div>
                <div style={{ fontSize: "10px", color: C.secondary, lineHeight: 1.3 }}>{appt.service}</div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: i === 2 ? C.red : "#22c55e" }} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

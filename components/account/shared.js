"use client";

import { Star } from "lucide-react";

// ── Date formatter ─────────────────────────────────────────────────────────────

export function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

// ── Appointment status map ─────────────────────────────────────────────────────

export const STATUS = {
  PENDING:   { bg: "#fffbeb", color: "#92400e", border: "#fde68a", label: "Bekliyor"    },
  CONFIRMED: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", label: "Onaylandı"  },
  COMPLETED: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", label: "Tamamlandı" },
  CANCELLED: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb", label: "İptal"      },
  NOSHOW:    { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", label: "Gelmedi"    },
};

// ── Animation constants ────────────────────────────────────────────────────────

export const ease = [0.22, 1, 0.36, 1];

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function Sk({ className = "" }) {
  return <div className={`rounded-[8px] bg-secondary animate-pulse ${className}`} />;
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-[20px] flex items-center justify-center mb-5"
        style={{ background: "var(--makas-surface2)", border: "1px solid var(--makas-border)" }}>
        <Icon size={30} className="text-muted-foreground/40" />
      </div>
      <p className="font-display font-semibold text-[22px] tracking-tight text-foreground">{title}</p>
      {sub && <p className="mt-2 text-[14px] text-muted-foreground max-w-xs leading-relaxed">{sub}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ── StarPicker ────────────────────────────────────────────────────────────────

export function StarPicker({ value, onChange, size = 28 }) {
  return (
    <div className="flex gap-2">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}
          className="transition-transform hover:scale-110 active:scale-95">
          <Star size={size} fill={i <= value ? "#f59e0b" : "none"} color={i <= value ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

// ── ReviewStars ───────────────────────────────────────────────────────────────

export function ReviewStars({ rating, size = 12 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i <= rating ? "#f59e0b" : "none"} color={i <= rating ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

export function Toggle({ on }) {
  return (
    <div className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${on ? "bg-foreground" : "bg-border"}`}>
      <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-[3px]"}`} />
    </div>
  );
}

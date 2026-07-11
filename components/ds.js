// MAKAS Design System — shared primitives.
// Single source of truth for UI patterns used across customer, admin, and booking.
// All values reference CSS variables from globals.css (--makas-* tokens).
"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Typography ───────────────────────────────────────────────────────────────

/** Page-level title with optional subtitle and trailing actions. */
export function PageTitle({ children, sub, actions, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="font-display font-semibold text-[26px] sm:text-[28px] tracking-tight text-foreground leading-tight">
          {children}
        </h1>
        {sub && (
          <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{sub}</p>
        )}
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-2 pt-1">{actions}</div>
      )}
    </div>
  );
}

/** Admin sub-page header — slightly smaller, no display font. */
export function AdminPageHeader({ title, sub, actions, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground leading-tight">
          {title}
        </h1>
        {sub && (
          <p className="text-[13px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-2 pt-0.5">{actions}</div>
      )}
    </div>
  );
}

/** Small uppercase section label. */
export function SectionLabel({ children, className }) {
  return (
    <p className={cn(
      "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3",
      className
    )}>
      {children}
    </p>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

/** Standard card — cream bg, 14px radius, 1px border, subtle shadow. */
export function DSCard({ children, className, style, onClick }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-[14px]",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      style={{ boxShadow: "var(--shadow-card)", ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/** Card body with consistent inner padding. */
export function DSCardBody({ children, className }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

/** Card divider (horizontal rule inside a card). */
export function DSCardDivider({ className }) {
  return <div className={cn("border-t border-border", className)} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

/**
 * Consistent avatar: photo if src provided, else initials on ink background.
 * radius is in px. size is in px. shape: "square" | "circle".
 */
export function DSAvatar({ src, name, size = 40, radius, shape = "square", className }) {
  const rad = radius ?? (shape === "circle" ? size / 2 : Math.round(size * 0.26));
  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const fontSize = Math.round(size * 0.34);
  const dim = `${size}px`;
  const style = { width: dim, height: dim, borderRadius: `${rad}px`, flexShrink: 0 };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src} alt={name ?? ""}
        className={cn("object-cover", className)}
        style={style}
      />
    );
  }
  return (
    <div
      className={cn("flex items-center justify-center font-semibold text-white", className)}
      style={{ ...style, background: "var(--makas-ink)", fontSize: `${fontSize}px` }}
    >
      {initials}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

const BADGE_MAP = {
  default:  { bg: "var(--makas-surface2)",  color: "var(--makas-ink-secondary)", border: "var(--makas-border)" },
  success:  { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0" },
  warning:  { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  danger:   { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  info:     { bg: "#DBEAFE", color: "#1E40AF", border: "#BFDBFE" },
  purple:   { bg: "#EDE9FE", color: "#5B21B6", border: "#DDD6FE" },
  trial:    { bg: "#DBEAFE", color: "#1E40AF", border: "#BFDBFE" },
  active:   { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0" },
  past_due: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  suspended:{ bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  cancelled:{ bg: "var(--makas-surface2)", color: "var(--makas-ink-muted)", border: "var(--makas-border)" },
};

export function DSBadge({ variant = "default", children, className }) {
  const v = BADGE_MAP[variant] ?? BADGE_MAP.default;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-[3px] rounded-full border",
        className
      )}
      style={{ background: v.bg, color: v.color, borderColor: v.border }}
    >
      {children}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function DSEmptyState({ icon: Icon, title, sub, action, compact = false, className }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-10" : "py-20",
      className
    )}>
      <div
        className="flex items-center justify-center mb-4"
        style={{
          width: compact ? "52px" : "64px",
          height: compact ? "52px" : "64px",
          borderRadius: "18px",
          background: "var(--makas-surface2)",
          border: "1px solid var(--makas-border)",
        }}
      >
        <Icon
          size={compact ? 20 : 26}
          style={{ color: "var(--makas-ink-muted)", opacity: 0.5 }}
        />
      </div>
      <p className={cn(
        "font-display font-semibold tracking-tight text-foreground",
        compact ? "text-[18px]" : "text-[20px]"
      )}>
        {title}
      </p>
      {sub && (
        <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xs leading-relaxed">{sub}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

export function DSSkeleton({ className }) {
  return (
    <div className={cn("rounded-[8px] bg-secondary animate-pulse", className)} />
  );
}

export function DSSkeletonCard({ lines = 3, className }) {
  return (
    <DSCard className={cn("p-5", className)}>
      <DSSkeleton className="h-4 w-32 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <DSSkeleton
          key={i}
          className={cn("h-3 mb-2", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </DSCard>
  );
}

export function DSPageLoader({ className }) {
  return (
    <div className={cn("flex items-center justify-center py-20", className)}>
      <Loader2 size={20} className="animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

/**
 * KPI stat tile — used in admin sub-pages, billing, reviews, etc.
 * accent: hex color or CSS var string.
 */
export function DSStatTile({ icon: Icon, label, value, sub, accent = "var(--makas-ink)", className }) {
  return (
    <DSCard className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel className="mb-0">{label}</SectionLabel>
        {Icon && (
          <div
            className="flex items-center justify-center"
            style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: typeof accent === "string" && accent.startsWith("var")
                ? `color-mix(in srgb, ${accent} 12%, transparent)`
                : `${accent}18`,
            }}
          >
            <Icon size={13} style={{ color: accent }} />
          </div>
        )}
      </div>
      <p className="font-display font-semibold text-[26px] leading-none tracking-tight text-foreground">
        {value ?? "—"}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
    </DSCard>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

/**
 * Consistent pill-style tab navigation.
 * tabs: Array<{ id: string, label: string, icon?: ComponentType }>
 */
export function DSTabBar({ tabs, active, onChange, className }) {
  return (
    <div
      className={cn(
        "flex gap-1 p-1 bg-card border border-border rounded-[12px] mb-6",
        className
      )}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[9px] text-[13px] font-medium transition-all duration-150 min-h-[36px]"
            style={{
              background: isActive ? "var(--makas-surface2)" : "transparent",
              color: isActive ? "var(--makas-ink)" : "var(--makas-ink-muted)",
              boxShadow: isActive ? "0 1px 4px rgba(17,17,17,0.08)" : "none",
            }}
          >
            {Icon && <Icon size={13} />}
            <span className="hidden sm:inline truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

/** Consistent text input — matches the customer-facing field-inp pattern. */
export function DSInput({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full h-10 rounded-[10px] border border-border bg-card px-3.5 text-[13px] text-foreground",
        "placeholder:text-muted-foreground outline-none",
        "focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 transition-all",
        className
      )}
      {...props}
    />
  );
}

export function DSTextarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px] text-foreground",
        "placeholder:text-muted-foreground outline-none resize-none",
        "focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 transition-all",
        className
      )}
      {...props}
    />
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

const BTN_VARIANTS = {
  primary:   "bg-foreground text-background hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/70",
  ghost:     "text-muted-foreground hover:text-foreground hover:bg-secondary",
  danger:    "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20",
  outline:   "border border-border text-foreground bg-transparent hover:bg-secondary",
};

const BTN_SIZES = {
  xs: "h-7  px-2.5 text-[11px] gap-1",
  sm: "h-8  px-3   text-[12px] gap-1.5",
  md: "h-10 px-4   text-[13px] gap-1.5",
  lg: "h-11 px-5   text-[14px] gap-2",
};

export function DSButton({
  children, variant = "primary", size = "md",
  disabled, loading, onClick, type = "button",
  className, iconLeft, iconRight,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-full transition-all duration-150",
        "disabled:opacity-40 disabled:pointer-events-none",
        BTN_VARIANTS[variant] ?? BTN_VARIANTS.primary,
        BTN_SIZES[size] ?? BTN_SIZES.md,
        className
      )}
      {...rest}
    >
      {loading && <Loader2 size={12} className="animate-spin" />}
      {!loading && iconLeft}
      <span>{children}</span>
      {iconRight}
    </button>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

export function DSField({ label, children, className }) {
  return (
    <label className={cn("block", className)}>
      <SectionLabel className="mb-1.5">{label}</SectionLabel>
      {children}
    </label>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function DSDivider({ className }) {
  return <hr className={cn("border-0 border-t border-border", className)} />;
}

// ─── Brand mark ───────────────────────────────────────────────────────────────

/**
 * MAKAS SVG logo mark. variant: "dark" (for light bg) | "light" (for dark bg).
 * Single source of truth — replaces all local MakasMark copies.
 */
export function BrandMark({ variant = "dark", size = 40, className }) {
  const src = variant === "dark" ? "/logo-dark.svg" : "/logo-light.svg";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="MAKAS" width={size} height={size} className={cn("block shrink-0", className)} />;
}

/** Full horizontal brand lockup: mark + wordmark. */
export function BrandLogo({ variant = "dark", size = 40, className, wordmarkClass }) {
  const textColor = variant === "dark" ? "text-foreground" : "text-background";
  const fs = Math.round(size * 0.6);
  return (
    <div className={cn("flex items-center", className)}>
      <BrandMark variant={variant} size={size} />
      <span
        className={cn("font-display font-extrabold leading-none tracking-[-0.02em]", textColor, wordmarkClass)}
        style={{ fontSize: `${fs}px`, marginLeft: Math.round(size * 0.35) }}
      >
        MAKAS
      </span>
    </div>
  );
}

// ─── Star rating ─────────────────────────────────────────────────────────────

/** Read-only star row. Replaces StarRow / StarRating local copies across pages. */
export function StarRating({ rating, max = 5, size = 12, className }) {
  return (
    <div className={cn("flex items-center gap-[2px]", className)}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i < Math.round(rating) ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth={2}
          className={i < Math.round(rating) ? "text-foreground" : "text-border"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ─── Chip / tag ───────────────────────────────────────────────────────────────

/**
 * Small interactive chip — filter buttons, specialty tags, status chips.
 * active: boolean — filled vs outlined.
 * If onClick omitted, renders non-interactive (no hover/cursor).
 */
export function DSChip({ children, active, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center h-7 px-3 rounded-full text-[11px] font-medium border transition-all duration-150",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-secondary-foreground border-border",
        onClick ? "cursor-pointer hover:border-foreground/40" : "cursor-default pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

/**
 * Shared modal shell — backdrop + animated panel.
 * Locks body scroll while open. Click outside or Escape to close.
 * wide: boolean — max-w 560px (default 480px).
 */
export function DSModal({ open, onClose, title, children, wide, className }) {
  // body scroll lock
  if (typeof window !== "undefined") {
    // ponytail: inline effect — avoids a separate hook for a one-liner
  }
  return open ? (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center overflow-y-auto"
      style={{ background: "rgba(17,17,17,0.45)", padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className={cn(
          "w-full bg-card border border-border rounded-[20px] flex flex-col max-h-[90dvh]",
          wide ? "max-w-[560px]" : "max-w-[480px]",
          className
        )}
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        {title && (
          <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-border">
            <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-5 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  ) : null;
}

// Single source of truth for admin / barber dashboard colors.
// All values reference CSS variables from globals.css so dark mode
// is automatic — no runtime theme detection needed in components.
//
// C  — semantic CSS-var references for backgrounds, surfaces, text, borders.
// CA — alpha-scale references (use instead of ${C.primary}XX template strings).
// SHADOW — elevation tokens.

export const C = {
  bg:        "var(--makas-bg)",
  bgSoft:    "var(--makas-surface)",
  sidebar:   "var(--makas-surface)",
  card:      "var(--makas-surface)",
  cardHi:    "var(--makas-surface2)",
  modal:     "var(--makas-surface)",
  border:    "var(--makas-border)",
  borderHi:  "var(--makas-border-hi)",
  surface:   "var(--makas-surface2)",
  primary:   "var(--makas-ink)",
  secondary: "var(--makas-ink-secondary)",
  muted:     "var(--makas-ink-muted)",
  dim:       "var(--makas-thumb)",
  green:     "#15803D",  // semantic — unchanged across themes
  yellow:    "#CA8A04",  // semantic — unchanged across themes
};

// Alpha scale — replaces "${C.primary}XX" template string concatenations.
// These are proper CSS custom properties that switch automatically in dark mode.
export const CA = {
  ink10:     "var(--makas-ink-10)",
  ink12:     "var(--makas-ink-12)",
  ink18:     "var(--makas-ink-18)",
  ink22:     "var(--makas-ink-22)",
  ink28:     "var(--makas-ink-28)",
  ink30:     "var(--makas-ink-30)",
  ink40:     "var(--makas-ink-40)",
  ink50:     "var(--makas-ink-50)",
  ink60:     "var(--makas-ink-60)",
  inkf0:     "var(--makas-ink-f0)",
  bgf0:      "var(--makas-bg-f0)",
  surface80: "var(--makas-surface-80)",
};

export const SHADOW = {
  card:     "var(--shadow-card)",
  elevated: "var(--shadow-elevated)",
  pop:      "var(--shadow-pop)",
};

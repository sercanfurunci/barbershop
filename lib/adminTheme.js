// Single source of truth for admin / barber dashboard colors.
// Values mirror the public landing tokens in app/globals.css
// (--makas-bg, --makas-ink, --makas-border, ...) so the dashboard
// reads as a seamless extension of the marketing site.
//
// Hex literals (not var()) so they remain safe inside template-string
// concatenations like `${C.primary}15` for inline alpha.
export const C = {
  bg:        "#F5F1EB",  // --makas-bg
  bgSoft:    "#FDFBF7",  // softer variant for nested card surfaces
  sidebar:   "#FFFFFF",  // --makas-surface
  card:      "#FFFFFF",  // --makas-surface
  cardHi:    "#FDFBF7",  // hovered / highlighted card
  modal:     "#FFFFFF",
  border:    "#E7E0D7",  // --makas-border
  borderHi:  "#C5BEB5",  // emphasized border
  surface:   "#EFEAE2",  // --makas-surface2
  primary:   "#111111",  // --makas-ink
  secondary: "#44403C",  // --makas-ink-secondary
  muted:     "#6B6B6B",  // --makas-ink-muted
  dim:       "#D8D1C7",  // --makas-thumb
  green:     "#15803D",
  yellow:    "#CA8A04",
};

// Mirror of the elevation tokens in globals.css. Use sparingly — the
// cream background + 1px border is already most of the depth we want.
export const SHADOW = {
  card:     "0 1px 2px rgba(17,17,17,0.04)",
  elevated: "0 8px 24px rgba(17,17,17,0.06)",
  pop:      "0 12px 36px rgba(17,17,17,0.10)",
};

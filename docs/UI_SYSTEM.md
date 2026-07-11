# Makas — UI System

Three surfaces, one cream identity. Tokens live in two places: CSS variables in [`app/globals.css`](../app/globals.css) (read by Tailwind v4 via `@theme`) and a hex mirror in [`lib/adminTheme.js`](../lib/adminTheme.js) for inline-style call sites. The CSS variables are the source of truth — `adminTheme.js` exists because template literals like `` `${C.primary}15` `` need real hex strings.

Tailwind v4: no `tailwind.config.*`. Theme is declared in CSS through `@theme inline { ... }` and configured via `components.json`. Imports at the top of `globals.css`: `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`.

---

## 1. Theme tokens

### 1.1 Brand tokens (`:root` in [`app/globals.css`](../app/globals.css))

| Variable | Hex | Role |
|---|---|---|
| `--makas-bg` | `#F5F1EB` | Page background. Cream. |
| `--makas-surface` | `#FFFFFF` | Cards, modals, navbar surface. |
| `--makas-surface2` | `#EFEAE2` | Hover/secondary panels, chip backgrounds. |
| `--makas-ink` | `#111111` | Primary text. |
| `--makas-ink-secondary` | `#44403C` | Body copy. |
| `--makas-ink-muted` | `#6B6B6B` | Eyebrows, captions, helper text. |
| `--makas-border` | `#E7E0D7` | 1px lines on cards, dividers. |
| `--makas-thumb` | `#D8D1C7` | Scrollbar fill. |
| `--makas-thumb-hover` | `#BEB6AA` | Scrollbar fill hover. |
| `--makas-footer` | `#111111` | Footer dark band. |

### 1.2 Elevation

Used sparingly — the cream background + 1px border carries most of the depth.

| Variable | Value |
|---|---|
| `--shadow-card` | `0 1px 2px rgba(17,17,17,0.04)` |
| `--shadow-elevated` | `0 8px 24px rgba(17,17,17,0.06)` |
| `--shadow-pop` | `0 12px 36px rgba(17,17,17,0.10)` |

Mirror in [`lib/adminTheme.js`](../lib/adminTheme.js) as `SHADOW.card` / `SHADOW.elevated` / `SHADOW.pop`. KPI cards swap `card → elevated` on hover via inline `onMouseEnter` ([`components/admin/KPICards.js`](../components/admin/KPICards.js#L66-L67)).

### 1.3 Layout scale

| Variable | Value | Used for |
|---|---|---|
| `--section-py-sm` | `48px` | Compact CTA bands, social proof |
| `--section-py-md` | `80px` | Default section padding |
| `--section-py-lg` | `112px` | Hero, marquee |
| `--pill-h-sm` / `-md` / `-lg` | `40 / 48 / 56 px` | Marketing CTAs (taller than shadcn `Button` h-8) |
| `--radius` | `0.5rem` | shadcn radius base — `--radius-sm…4xl` derive from it |

### 1.4 shadcn tokens

[`app/globals.css`](../app/globals.css) also defines the standard shadcn token set (`--background`, `--card`, `--primary`, `--popover`, etc.) mapped onto the makas brand. The `@theme inline { ... }` block (lines 38-80) re-exports them as `--color-*` variables so Tailwind utilities resolve. Sidebar gets its own dark slice (`--sidebar*`) — used only by the dashboard nav, not the marketing site.

### 1.5 adminTheme.js mirror

[`lib/adminTheme.js`](../lib/adminTheme.js) exports `C` (colors) and `SHADOW` (elevation) as plain JS objects. Hex literals so things like `` `${C.primary}15` `` (15% opacity hex append) stay safe. **Use `C` only inside inline `style={{ ... }}` props in admin components.** Marketing components reach for `var(--makas-*)` in CSS instead — see the local `C` constant in [`Testimonials.js`](../components/landing/Testimonials.js#L9-L19) and [`Navbar.js`](../components/shared/Navbar.js#L12-L22).

There is no equivalent landing-theme JS file. Landing surfaces resolve everything through CSS variables.

### 1.6 z-index scale

Single source of truth in the comment at the top of [`app/globals.css`](../app/globals.css#L8-L20). Never exceed 100.

```
0–10     decorative absolute layers
20       sticky sub-headers
30       desktop sidebars, sticky section nav
40       bottom CTAs, mobile tab nav, FABs
50       top Navbar, sheet/dialog backdrops
55       mobile menu scrim
60       mobile drawer panel
70–71    portal popovers
80       modal backdrops
90       modal content
100      reserved (toasts — none mounted yet)
```

---

## 2. Fonts & typography

Loaded via `next/font/google` in [`app/layout.js`](../app/layout.js#L10-L28), exposed as CSS variables on `<html>`. Self-hosted, preloaded, `display: swap`.

| Font | Variable | Weights | Class | Used for |
|---|---|---|---|---|
| Outfit | `--font-outfit` | 300–800 | (default body) | Everything not display/mono |
| Cormorant Garamond | `--font-cormorant` | 300–700 + italic | `.font-display` | All H1/H2 on marketing + tenant, big numerics on KPI cards |
| DM Mono | `--font-dm-mono` | 300–500 | `.font-mono-custom` | Eyebrows, KPI labels, code, table headers |

Helper utilities in [`globals.css`](../app/globals.css#L194-L200):

```css
.font-display    { font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif; }
.font-mono-custom{ font-family: var(--font-dm-mono),  'DM Mono', ui-monospace, monospace; }
```

### Typographic patterns

- **Page heroes:** `font-display font-light` (marketing) or `font-display font-bold` (landing root). Sizes use `clamp()` ranges like `clamp(40px, 5.5vw, 72px)` ([Testimonials H2](../components/landing/Testimonials.js#L88-L99), [marketing Hero](../app/page.js#L101-L113)).
- **Eyebrows:** `.font-mono-custom uppercase tracking-[0.14em] text-[11px]` — codified in [`components/shared/Eyebrow.js`](../components/shared/Eyebrow.js).
- **KPI numerals:** `font-display` at 28px, `letter-spacing: -0.02em`, `font-weight: 400` ([KPICards.js#L93-L95](../components/admin/KPICards.js#L93-L95)).
- **KPI labels:** `font-mono-custom` at 10px, `letter-spacing: 0.14em`, uppercase ([KPICards.js#L70-L72](../components/admin/KPICards.js#L70-L72)).

---

## 3. Component families

Five top-level directories under [`components/`](../components):

```
admin/        — utility-first dashboard
landing/      — marketing + tenant home sections
booking/      — multi-step booking flow
shared/       — primitives used across surfaces
legal/        — gizlilik/kullanim/cerez layout
superadmin/   — platform owner console
ui/           — shadcn primitives (kebab-case .jsx)
```

### 3.1 `components/admin/*`

Operator UX. Every file is `"use client"`. Styling is overwhelmingly inline `style={{ ... }}` using `C` and `SHADOW` from [`adminTheme.js`](../lib/adminTheme.js). Tailwind appears for layout only (`flex`, `grid`, `gap-*`).

Key files:

| File | Purpose |
|---|---|
| [`AdminDashboard.js`](../components/admin/AdminDashboard.js) | Shell: sidebar + topbar + tab router (`overview` / `calendar` / `appointments` / `barbers` / `customers` / `services-mgmt` / `revenue` / `reviews` / `notifications` / `billing` / `settings` / `barber-ops`). Mobile bottom nav + sliding "more" sheet. |
| [`DashboardTopbar.js`](../components/admin/DashboardTopbar.js) | Sticky `h-16 lg:h-[68px]` header. `backdropFilter: blur(12px)` over `${C.bg}d9`. Brand mark (mobile), lang toggle, notifications bell, user-menu portal. Matches landing navbar height. |
| [`KPICards.js`](../components/admin/KPICards.js) | 4-card grid. Each card animates the number via `useCounter` hook, draws a sparkline via `buildSparkPath`, hover-elevates from `SHADOW.card → SHADOW.elevated`. Skeleton uses the same card chrome with grey blocks. |
| [`AreaChart.js`](../components/admin/AreaChart.js) | Larger SVG area chart for revenue. Same Bezier smoothing as the KPI sparkline. |
| [`CalendarView.js`](../components/admin/CalendarView.js) | Day/week grid. `SLOT_H = 48`, day range 9–22. Status colors in a local `SC` map keyed by lowercase status. |
| [`AppointmentsList.js`](../components/admin/AppointmentsList.js) | Table + status pills. Avatar color from hashed name (`hsl(${hue}, 30%, 22%)`). |
| [`ManualBookingModal.js`](../components/admin/ManualBookingModal.js), [`WalkInModal.js`](../components/admin/WalkInModal.js), [`CancelAppointmentModal.js`](../components/admin/CancelAppointmentModal.js), [`CompleteAppointmentModal.js`](../components/admin/CompleteAppointmentModal.js) | Modal pattern: `useBodyScrollLock`, AnimatePresence, backdrop at z-80, sheet at z-90. Form `Field` helper component embeds an icon + uppercase tracked-out label. |
| [`SubscriptionBanner.js`](../components/admin/SubscriptionBanner.js) | Red/amber bar shown when `shop.subscriptionStatus ∈ {PAST_DUE, SUSPENDED, CANCELLED}`. Copy hardcoded in TR — not yet translated. |
| [`BillingPage.js`](../components/admin/BillingPage.js), [`SettingsPage.js`](../components/admin/SettingsPage.js), [`ServicesManagement.js`](../components/admin/ServicesManagement.js), [`BarbersManagement.js`](../components/admin/BarbersManagement.js), [`ReviewsPage.js`](../components/admin/ReviewsPage.js), [`NotificationsPage.js`](../components/admin/NotificationsPage.js) | Tab panes. Same card chrome (white surface, `C.border`, 14px radius). |
| [`BarberDashboardClient.js`](../components/admin/BarberDashboardClient.js) | Separate barber-role shell. `BarberDayView`, `BarberAppointmentsList`, `BarberCustomersView` exports are reused inside admin's "barber-ops" preview tab. |
| [`LandingAnalyticsPanel.js`](../components/admin/LandingAnalyticsPanel.js) | Funnel chart for public-site events. |

#### KPI card anatomy ([KPICards.js](../components/admin/KPICards.js))

```
┌──────────────────────────────┐
│ LABEL (mono, uppercase, 10px)   [+12% pill]  │
│                                              │
│  ₺128.450        (font-display, 28px, 400)   │
│                                              │
│  vs last month   ──╮       sparkline 96×32   │
│                    ╰─ accent color circle    │
└──────────────────────────────┘
         radial gradient accent in bottom-left corner
```

Sparkline math is a smoothed cubic Bezier:

```js
// components/admin/KPICards.js#L12-L27
function buildSparkPath(data, w, h) {
  if (!data || data.length < 2) return { path: `M 0 ${h} L ${w} ${h}`, pts: [] };
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${mx} ${pts[i-1].y}, ${mx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  return { path: d, pts };
}
```

#### Counter animation hook

```js
// components/admin/KPICards.js#L29-L49
function useCounter(target, duration = 1200) {
  // requestAnimationFrame, cubic ease-out, ints stay ints, floats stay floats
}
```

Not lifted to `lib/` — local to `KPICards.js`. If a second consumer arrives, promote it.

### 3.2 `components/landing/*`

Used for both the public marketing landing (`/`) and the tenant home (`/[shopSlug]`). Files like `Testimonials`, `Gallery`, `FAQ`, `About`, `Services`, `Barbers`, `BookingCard`, `IdentityBlock`, `SectionNav`, `StickyActionBar` are tenant-side. The marketing landing has its own `LandingNavbar` and `LandingFooter` in the same folder but the page (`app/page.js`) is mostly self-contained client code.

Styling convention: a **module-local `C` object** that proxies CSS variables.

```js
// components/landing/Testimonials.js#L9-L19
const C = {
  bg:       "var(--makas-bg)",
  surface:  "var(--makas-surface2)",
  card:     "var(--makas-surface)",
  border:   "var(--makas-border)",
  primary:  "var(--makas-ink)",
  secondary:"var(--makas-ink-secondary)",
  muted:    "var(--makas-ink-muted)",
};
```

Note the inconsistency: admin uses **hex** through `adminTheme.js`, landing uses **CSS variable references** locally. Both work; admin needs hex because it does opacity math, landing doesn't.

Key files:

| File | Purpose |
|---|---|
| [`IdentityBlock.js`](../components/landing/IdentityBlock.js) | Tenant identity: logo monogram, name (font-display, light), meta chips (owner, founding year, shop type), rating, open/closed badge, CTAs (Book / Call / WhatsApp / Map), socials. Conditional fields collapse cleanly. Marked with `data-identity` so `SectionNav` and `Navbar` can observe it. |
| [`Gallery.js`](../components/landing/Gallery.js) | Image grid + native `<dialog>` lightbox. Arrow nav, swipe, thumbnail rail, ESC. Adjacent-only preloading. Hosts an `aside` slot — that's where `BookingCard` mounts on desktop. |
| [`BookingCard.js`](../components/landing/BookingCard.js) | Side-rail card on tenant home: service select, barber select, next-available chip, CTA → `/[shopSlug]/book`. |
| [`Testimonials.js`](../components/landing/Testimonials.js) | App Store-style header: big number + stars + reviews count. Mobile = horizontal snap scroller, desktop = grid up to 4 cols. Shared `<dialog>` modal for "Read more". Each card observes its own quote overflow via `ResizeObserver`. |
| [`FAQ.js`](../components/landing/FAQ.js) | Accordion. |
| [`SectionNav.js`](../components/landing/SectionNav.js) | Sticky horizontal nav that fades in once `[data-identity]` scrolls out. Hidden on mobile. Class-driven (`.section-nav.is-stuck`) to dodge the inline-opacity safety net. |
| [`StickyActionBar.js`](../components/landing/StickyActionBar.js) | Mobile-only bottom action bar. Reserves `env(safe-area-inset-bottom)`. The shop page reserves `paddingBottom: 72px` so it doesn't cover content. |
| [`LandingNavbar.js`](../components/landing/LandingNavbar.js), [`LandingFooter.js`](../components/landing/LandingFooter.js) | Marketing-site chrome. `LandingNavbar` is much simpler than the tenant `Navbar` — no hero-mode color swap. |
| [`TrackPageView.js`](../components/landing/TrackPageView.js) | Fire-and-forget analytics ping. |
| `About.js`, `Services.js`, `Barbers.js`, `SalonInfo.js` | Tenant sections. |

### 3.3 `components/booking/*`

The 5-step booking flow. Mobile is full-screen push slides; desktop is a stepper bar.

| File | Step |
|---|---|
| [`BookingFlow.js`](../components/booking/BookingFlow.js) | Container. Slide variants, ConfirmChangeDialog (bottom-sheet on mobile). |
| `ServiceSelect.js` | Step 1 |
| `BarberSelect.js` | Step 2 |
| `DateSelect.js` | Step 3a (calendar) |
| `TimeSelect.js` | Step 3b (slot picker) |
| `DateTimeSelect.js` | Desktop combined step 3 |
| `Confirmation.js` | Step 4 success state |

Step copy is keyed off `tx.booking.step1…step4` in [`lib/translations.js`](../lib/translations.js#L111-L168).

### 3.4 `components/shared/*` (cross-surface primitives)

| File | Purpose |
|---|---|
| [`PillButton.js`](../components/shared/PillButton.js) | Rounded-full marketing CTA. Variants `primary` / `secondary` / `ghost` / `outline`. Sizes `sm/md/lg` map to `--pill-h-*`. Polymorphic via `href` (renders `<Link>` if set). |
| [`Eyebrow.js`](../components/shared/Eyebrow.js) | One-liner mono uppercase 11px label. Used in every SectionHeader. |
| [`SectionHeader.js`](../components/shared/SectionHeader.js) | Eyebrow + display H2 + optional description + optional action. `align="left"` or `"center"`. |
| [`StatCard.js`](../components/shared/StatCard.js) | Marketing stat card — display numeral + delta pill. Distinct from admin `KPICard` (no sparkline, no animation). |
| [`CTAGroup.js`](../components/shared/CTAGroup.js) | Wraps two pill buttons with consistent gap. |
| [`Navbar.js`](../components/shared/Navbar.js) | **Tenant** navbar — see §7.2 for the hero-mode IntersectionObserver behavior. |
| [`Footer.js`](../components/shared/Footer.js) | Tenant footer. |
| [`ImageCropModal.js`](../components/shared/ImageCropModal.js) | Cloudinary upload crop UI (admin → settings). |
| [`TrustBadge.js`](../components/shared/TrustBadge.js) | "Ücretsiz iptal" / "İşlem ücreti yok" microcopy strip. |

### 3.5 `components/ui/*` (shadcn primitives)

The standard shadcn-base-nova set. `.jsx` extension (the project is JS, not TS). Re-exported via `@/components/ui/...`.

| File | Notes |
|---|---|
| [`button.jsx`](../components/ui/button.jsx) | shadcn `Button` from `@base-ui/react`. Default size is `h-8` — distinctly smaller than `PillButton`. Used inside admin/booking forms. |
| [`dialog.jsx`](../components/ui/dialog.jsx), [`sheet.jsx`](../components/ui/sheet.jsx) | Backdrops at z-50 (shadcn default). Many modals bypass this and use plain `<dialog>` or custom backdrops at z-80 instead. |
| [`sonner.jsx`](../components/ui/sonner.jsx) | Toaster wrapper. Icons replaced with lucide variants. Mounted globally in [`app/layout.js`](../app/layout.js#L107-L116) with dark style override (`#161616` bg, `#F8F6F1` text) — does **not** follow the cream theme. |
| `badge`, `card`, `dropdown-menu`, `input`, `label`, `progress`, `select`, `separator`, `skeleton`, `table`, `tabs` | Standard shadcn. |

When you need a button:
- Marketing/tenant CTA → `PillButton` (taller, rounded-full)
- Admin form / table action → `<Button>` from `ui/button.jsx`
- Touch chip / icon-only / one-off → inline styled `<button>` with `min-height: 40px` (enforced globally — see [globals.css#L347-L349](../app/globals.css#L347-L349))

---

## 4. Internationalization

### 4.1 Context

[`contexts/LanguageContext.js`](../contexts/LanguageContext.js): tiny client provider. Default `tr`. Persisted under `localStorage["makas-lang"]`. Only `"tr"` and `"en"` are honored.

```js
const { lang, setLang } = useLang();
```

The `LanguageProvider` wraps the entire tree in [`app/layout.js`](../app/layout.js#L103-L119).

### 4.2 Translation tree

[`lib/translations.js`](../lib/translations.js) — single 505-line file, no namespacing, no JSON. Shape:

```js
export const t = {
  tr: {
    nav: { services, team, reviews, admin, bookNow },
    hero: { badge, rating, words, label, ... stats },
    services: { sectionLabel, title, subtitle, footer, cta, popular, min },
    barbers: { ... },
    testimonials: { sectionLabel },
    faq: { sectionLabel, title, subtitle, items: [{q, a}] },
    cta: { sectionLabel, title, bookButton, callButton, trust },
    footer: { tagline, services, company, visit, companyLinks, rights, ... },
    booking: { steps, step1, step2, step3, step4, success },
    admin: {
      greeting, greetingSub, newBooking,
      kpi: { revenue, appointments, clients, rating, vsLastMonth },
      chart, calendar,
      appointments: { recent, all, viewAll, entries, search, allStatus, cols, status, actions, empty },
      barbers, nav, pages, settings,
    },
  },
  en: { /* mirror */ },
};

export function useT(lang) { return t[lang] ?? t.tr; }
```

Some leaves are functions (e.g. `hero.badge(shop) => ...`, `success.title(name) => [...]`). Consumers do `tx.admin.kpi.revenue` etc.

The marketing landing page (`app/page.js`) is mostly Turkish-only hardcoded strings — only the tenant/booking/admin trees are bilingual.

### 4.3 Switching languages

`<html lang="tr">` is hardcoded in [`layout.js`](../app/layout.js#L95). The `setLang` toggle only flips client copy; SSR/meta stay TR. Lang toggle is offered in `DashboardTopbar` and `Navbar`.

---

## 5. State and data patterns

### 5.1 API client

[`lib/api.js`](../lib/api.js) — 65 lines, no React-Query, no SWR. Just a thin `fetch` wrapper:

```js
apiFetch("/api/admin/stats")        // GET
apiFetch("/api/admin/barbers", { method: "POST", body: JSON.stringify(...) })
```

- Sends `credentials: "include"` (httpOnly auth cookie).
- Throws on non-2xx with `err.status` populated.
- Has a **superadmin preview mode**: `setPreviewShopId(id)` / `getPreviewShopId()` rewrites paths under `/api/admin/*` and `/api/appointments` to append `?shopId=...`. Set by `AdminDashboard` on mount when a SUPER_ADMIN is inspecting a tenant ([AdminDashboard.js#L91-L97](../components/admin/AdminDashboard.js#L91-L97)). Module-level state — fine because only one dashboard mounts at a time.

`normalizeAppointment(a)` lowercases status (`IN_PROGRESS` → `in-progress`), folds in fallbacks for the pre-Phase-2 revenue split.

### 5.2 React contexts

| Context | Purpose |
|---|---|
| [`LanguageContext`](../contexts/LanguageContext.js) | `useLang()` — current `tr`/`en` and setter. |
| [`AuthContext`](../contexts/AuthContext.js) | `useAuth()` — `{ role, user, loaded, login, logout }`. |
| [`AppointmentsContext`](../contexts/AppointmentsContext.js) | `useAppointments()` — shared appointment list/mutators for admin tabs. |
| [`ShopContext`](../contexts/ShopContext.js) | `useShop()` — current tenant shop, populated server-side on `[shopSlug]/layout.js`. |

### 5.3 Loading states

Two patterns:

1. **Skeleton cards** that match the final card chrome. [`KPICards.js`](../components/admin/KPICards.js#L153-L170) renders the same 4-card grid with grey blocks where the label/number would be, animated in on the same `staggerDelay: i * 0.07`.
2. **shadcn `Skeleton`** ([`components/ui/skeleton.jsx`](../components/ui/skeleton.jsx)) — `animate-pulse rounded-md bg-muted`. Used sparingly.

No global loader. The root `app/loading.js` renders `null` or near-nothing.

### 5.4 Server vs client components

- All admin/booking/landing-interactive components are explicitly `"use client"`.
- Route files (`app/[shopSlug]/page.js`, `app/[shopSlug]/admin/page.js`) are server components — they query Prisma, then hand serialized props to a client wrapper (`<AdminDashboard />`, `<BookingFlow shop=... />`).
- Below-fold landing sections are deferred with `next/dynamic` ([app/[shopSlug]/page.js#L19-L24](../app/[shopSlug]/page.js#L19-L24)) — Services, Barbers, Gallery, Testimonials, FAQ, SalonInfo — to split out framer-motion.

---

## 6. Visual patterns

### 6.1 Sparkline SVG

Inline SVG, not a chart library. Smoothed cubic Bezier with a fill gradient. See [§3.1 KPI card anatomy](#kpi-card-anatomy-kpicardsjs). `AreaChart.js` uses the same algorithm at a larger scale (`VW=600, VH=200`) with an explicit Y-axis padding.

### 6.2 Animated counters

`useCounter(target, duration = 1200)` — RAF loop with cubic ease-out. Preserves int-vs-float. Lives in [`KPICards.js`](../components/admin/KPICards.js#L29-L49); not yet promoted.

### 6.3 Modal/dialog conventions

Three approaches coexist:

1. **Native `<dialog>`** — Gallery lightbox, Testimonials review modal. Uses `showModal()` for built-in focus trap + ESC. Backdrop styled via `::backdrop`.
2. **Custom backdrop + framer-motion sheet** — Admin modals (`ManualBookingModal`, `WalkInModal`, `CancelAppointmentModal`). z-80 backdrop / z-90 sheet. Mobile = bottom sheet (border-radius `16px 16px 0 0`), desktop = centered.
3. **shadcn `Dialog` / `Sheet`** — used by some shadcn-derived utility components.

All three lock body scroll. The hook for that is [`lib/useBodyScrollLock.js`](../lib/useBodyScrollLock.js).

### 6.4 Toasts

Single `<Toaster>` mounted in [`app/layout.js`](../app/layout.js#L107-L116). Position `bottom-right`. Dark style hard-coded (does not follow theme):

```js
toastOptions: { style: { background: '#161616', border: '1px solid #242424', color: '#F8F6F1' } }
```

Sonner icons swapped to lucide (`CircleCheck`, `Info`, `TriangleAlert`, `OctagonX`, `Loader2`). Reserved z-index = 100.

### 6.5 Empty states

Inline strings from translations (e.g. `tx.admin.appointments.empty = "Randevu bulunamadı"`). No shared `<EmptyState />` component yet — each table/list renders its own muted-text + optional icon block.

### 6.6 Entrance motion

Framer-motion with a house easing curve: `[0.16, 1, 0.3, 1]` (Material "decelerate"). Applied to:

- KPI card stagger: `delay: i * 0.07, duration: 0.4`
- Testimonial cards: `delay: i * 0.08, duration: 0.5`
- AdminDashboard tab switch: `AnimatePresence mode="wait"`, `duration: 0.22`
- Landing section reveal: `initial={{ opacity: 0, y: 16-24 }}, whileInView`, `viewport={{ once: true, margin: "-80px" }}`

Plus pure-CSS hero animations in [`globals.css`](../app/globals.css#L202-L227): `hero-fade-up`, `hero-fade-in`, `hero-slide-in` with staged delays (`0.1s` badge → `0.6s` trust strip). These survive even if framer-motion fails to hydrate.

**Motion safety net** ([`globals.css#L22-L34`](../app/globals.css#L22-L34)): any element with `style*="opacity:0"` or `translateX/Y/3d` reveals after 2s via `motion-safety-fade`. Real motion always overrides — but if JS doesn't load, content still appears.

`prefers-reduced-motion: reduce` disables the hero animations explicitly (other framer-motion respects this through its own runtime checks).

### 6.7 CTA hover/active polish

Class-based in [`globals.css#L244-L267`](../app/globals.css#L244-L267):

```css
.makas-cta              { transition: transform 0.18s, background, border, box-shadow; }
.makas-cta:hover        { transform: translateY(-1px); }
.makas-cta:active       { transform: translateY(0); transition-duration: 0.08s; }

.makas-cta-light:hover  { box-shadow: 0 8px 20px rgba(0,0,0,0.28); }
.makas-cta-dark:hover   { box-shadow: 0 10px 28px rgba(17,17,17,0.32); }
.makas-cta-ghost:hover  { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.28); }
.makas-cta-outline:hover{ border-color: var(--makas-ink-muted); background: rgba(17,17,17,0.025); }

.makas-bar-btn:active   { transform: scale(0.96); background: rgba(17,17,17,0.04); }
```

Adopting variants: `<button class="makas-cta makas-cta-dark">…</button>`.

### 6.8 Interaction defaults

Tailwind v4 dropped the implicit pointer cursor. [`globals.css#L281-L302`](../app/globals.css#L281-L302) restores it for every clickable element plus inputs/labels/selects, and adds a `:focus-visible` 2px outline-offset-2 ring on every interactive control. Text inputs handle their own focus border per-component.

---

## 7. Page layouts

### 7.1 Admin shell (`/admin`, `/[shopSlug]/admin`)

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (220px, white)  │   Topbar (sticky 68px, blur)  │
│  · Brand mark           │   (mobile-only brand mark)    │
│  · NAV sections         ├───────────────────────────────┤
│    MAIN / YÖNETİM /     │   Subscription banner (cond.) │
│    RAPOR                │   Barber selector (mobile)    │
│  · Lang toggle          │                               │
│  · Logout               │   AnimatePresence tab pane    │
│                         │                               │
│                         │                               │
│                         │   (mobile bottom nav @ z40)   │
└─────────────────────────────────────────────────────────┘
```

- Sidebar: fixed `220px`, `lg:flex`, hidden under that. Background `C.sidebar` (white — sidebar token differs in shadcn vs this admin shell).
- Mobile uses a `MobileBottomNav` + slide-up "more" sheet.
- Calendar tab gets full-height treatment (no padding, `overflow: hidden`); all other tabs get scrollable `p-5 lg:p-8 pb-24 lg:pb-8`.
- Superadmin preview shows a thin slate-gray bar above the topbar with a "Konsola dön" link.

### 7.2 Tenant public layout (`/[shopSlug]`)

Server component in [`app/[shopSlug]/page.js`](../app/[shopSlug]/page.js#L265-L323):

```
<Navbar />                            ← fixed top, hero-mode color swap
<main>
  <IdentityBlock />                   ← compact identity, no cover photo
  <SectionNav sections={...} />       ← sticky, fades in once IdentityBlock scrolls out
  {last24h > 2 && <activity strip />} ← "X bookings in last 24h"
  <Gallery aside={<BookingCard/>} />  ← gallery + right-rail booking card
  <About />
  <Services />
  <Barbers />
  <Testimonials />
  <FAQ />
  <SalonInfo />                       ← address, map, hours, contact
</main>
<StickyActionBar />                   ← mobile bottom CTAs (Call / WA / Map / Book)
<Footer />
```

The `Navbar` ([components/shared/Navbar.js](../components/shared/Navbar.js)) is the interesting one. It runs an `IntersectionObserver` against `[data-hero]` — when the hero is in view, the navbar goes **glassy dark** (`rgba(15,15,15,0.55)`, white text); when scrolled past, it goes **glassy cream** (`rgba(247,244,238,0.92)`, ink text). Pages without a hero stay in default cream forever. All color tokens (`navBg`, `navBorder`, `navText`, `ctaBg`, etc.) are derived from a single `isHero` boolean.

### 7.3 Marketing landing (`/`)

[`app/page.js`](../app/page.js) — single-file client component. Uses `LandingNavbar` + `LandingFooter` (simpler, no hero-mode swap), `SectionHead` (local helper), `PillButton`, `CTAGroup`. Hero is asymmetric `grid-cols-[1.05fr_1fr]` Mangomint-style. No `SectionNav`, no `StickyActionBar`.

### 7.4 Legal layout (`/gizlilik`, `/kullanim-kosullari`, `/cerez-politikasi`)

[`components/legal/LegalLayout.js`](../components/legal/LegalLayout.js) — landing chrome + hero band + 2-column body (sticky 220px TOC on `lg`, max-w 720 article column). Body styling is `.legal-body` in [`globals.css#L379-L442`](../app/globals.css#L379-L442): `16px/1.75`, dotted underlines on links, mono table headers. `BackToTop` button appears after 600px scroll.

### 7.5 Superadmin (`/superadmin`)

[`components/superadmin/SuperAdminDashboard.js`](../components/superadmin/SuperAdminDashboard.js) — dark sidebar (`#111111`) with cream text, white main panel. Sidebar collapses to 72px. Distinct local color object — does **not** import `adminTheme.js`, palette skews darker. Mobile uses `.sa-*` classes in [`globals.css#L352-L377`](../app/globals.css#L352-L377): bottom nav, card view instead of table, bottom-sheet modals.

---

## 8. Accessibility and responsive

### 8.1 Breakpoints

Default Tailwind: `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`. Mobile-first.

Common breakpoint decisions:

- Admin sidebar: hidden under `lg` (1024), bottom nav takes over.
- Tenant SectionNav: `hidden md:block`.
- Marketing hero: switches to `lg:grid-cols-[1.05fr_1fr]` at 1024.
- Booking flow: full-screen slide push under `md`, stepper bar at `md+`.
- Testimonials: horizontal snap scroller under `md`, grid `768+`, 4-col at `1024+`.

`<640px` is treated as touch — see input zoom prevention below.

### 8.2 Touch and mobile

- All `button`/`[role="button"]` get `min-height: 40px` ([globals.css#L347-L349](../app/globals.css#L347-L349)). Override when needed (chip rows).
- `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` on all interactive elements ([globals.css#L239-L242](../app/globals.css#L239-L242)).
- iOS Safari input zoom prevention: under `640px`, all `input/select/textarea` get forced `font-size: 16px !important` and `min-height: 44px` ([globals.css#L325-L331](../app/globals.css#L325-L331)).
- Safe-area utilities: `.pb-safe` / `.pb-safe-sm` / `.pt-safe` use `env(safe-area-inset-*)`. Bottom nav and StickyActionBar consume these.

### 8.3 Focus and keyboard

- Global `:focus-visible` ring (2px solid ink, 2px offset) for every interactive element ([globals.css#L312-L323](../app/globals.css#L312-L323)).
- Pointer cursor restored manually (Tailwind v4 dropped it).
- Native `<dialog>` modals get a free focus trap.
- Mobile Navbar menu listens for `Escape`.
- Each `Testimonial` modal focuses its close button on open.

### 8.4 Reduced motion

`prefers-reduced-motion: reduce` disables the hero CSS animations explicitly ([globals.css#L223-L227](../app/globals.css#L223-L227)). Framer-motion components respect the system preference via the library's runtime checks.

### 8.5 Gaps and inconsistencies

- `<html lang="tr">` is hardcoded ([app/layout.js#L95](../app/layout.js#L95)). The lang toggle changes client copy only; assistive tech still announces Turkish.
- Marketing landing copy is largely TR-only. Only tenant/booking/admin trees are bilingual.
- `SubscriptionBanner` copy is TR-only ([components/admin/SubscriptionBanner.js#L11-L15](../components/admin/SubscriptionBanner.js#L11-L15)).
- No global `<EmptyState />` primitive — each table/list improvises.
- Toaster style ignores the cream theme — always dark.
- Tenant `Navbar` (shared) and `LandingNavbar` (landing) duplicate logic; the landing nav lacks the hero-mode swap and mobile menu.
- `useCounter` and `buildSparkPath` live inside `KPICards.js`. If `AreaChart` or another component wants the same animation, promote them to `lib/`.
- `adminTheme.js` uses hex; landing components use CSS-variable references in module-local `C` objects. Both work; just be aware of the split when reading code.
- shadcn `Button` and `PillButton` are not interchangeable. PillButton is meant for marketing CTAs; shadcn Button is meant for in-app affordances. There's no lint rule enforcing this.

---

## Quick reference

| Need | Reach for |
|---|---|
| Page-level color | `var(--makas-bg)`, `var(--makas-ink)`, ... |
| Inline-styled admin component | `import { C, SHADOW } from "@/lib/adminTheme"` |
| Display H2 | `<h2 className="font-display font-light">` + `clamp(...)` size |
| Eyebrow | `<Eyebrow>` from `components/shared/Eyebrow.js` |
| Marketing CTA | `<PillButton variant="primary" href="...">` |
| In-app button | `<Button variant="default" size="default">` from `components/ui/button.jsx` |
| Translated copy | `const tx = useT(useLang().lang); tx.admin.kpi.revenue` |
| API call | `apiFetch("/api/admin/stats")` |
| Modal | `useBodyScrollLock(open)` + framer-motion backdrop at z-80 / sheet at z-90, or native `<dialog>` |
| Toast | `import { toast } from "sonner"` |
| Card | `bg-white border border-[var(--makas-border)] rounded-[14px] shadow-[var(--shadow-card)]` |
| Animate-in stagger | `delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1]` |

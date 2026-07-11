# Makas — Project Structure

A navigation map for the Makas codebase. For schema/data model see [`docs/DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md).

Stack: Next.js 16 (App Router) · React 19 · Prisma 7 + Postgres (Neon) · Tailwind 4 · shadcn/ui · framer-motion · Cloudinary · iyzico (stub).

**Notable Next 16 conventions in use:**
- `proxy.js` at root replaces the legacy `middleware.js`.
- Async `params` / `searchParams` (`const { shopSlug } = await params`).
- `next/dynamic` keeps SSR on; only the JS bundle is code-split.
- `next/font` (self-hosted) declared in [`app/layout.js`](../app/layout.js).
- Special files used: `error.js`, `loading.js`, `not-found` (via `notFound()`), `opengraph-image.js`, `manifest.js`, `robots.js`, `sitemap.js`, `apple-icon.png`.

---

## 1. Top-Level Directory Map

| Path | Purpose |
|---|---|
| [`app/`](../app) | Next App Router — pages, layouts, route handlers, special files. |
| [`components/`](../components) | React components, grouped by surface (admin / landing / booking / superadmin / shared / ui). |
| [`contexts/`](../contexts) | Client-side React Context providers (auth, language, shop, appointments). |
| [`lib/`](../lib) | Server + isomorphic utilities (prisma, auth, booking math, payments, etc.). |
| [`prisma/`](../prisma) | Schema, migrations, seed/maintenance scripts. |
| [`public/`](../public) | Static assets (logos, favicons). |
| [`scripts/`](../scripts) | One-off Node maintenance scripts (`check-shops.mjs`). |
| [`docs/`](../docs) | Internal documentation. |
| [`proxy.js`](../proxy.js) | **Next 16 proxy** (was `middleware.js`) — custom-domain rewrites + super-admin IP allowlist. |
| [`next.config.mjs`](../next.config.mjs) | Image patterns, security headers, CSP. |
| [`tailwind.config`](../app/globals.css) | No JS config — Tailwind 4 is configured inline in [`app/globals.css`](../app/globals.css) via `@import "tailwindcss"`. |
| [`postcss.config.mjs`](../postcss.config.mjs) | `@tailwindcss/postcss` plugin only. |
| [`prisma.config.ts`](../prisma.config.ts) | Prisma 7 config (`DATABASE_URL` pooled + `DIRECT_URL` for migrations). |
| [`components.json`](../components.json) | shadcn config — style `base-nova`, JSX (not TSX). |
| [`jsconfig.json`](../jsconfig.json) | `@/*` path alias → repo root. |
| [`eslint.config.mjs`](../eslint.config.mjs) | Flat config + `eslint-config-next/core-web-vitals`. |
| [`vercel.json`](../vercel.json) | Cron schedules (notifications 09:00, billing 03:00, photo cleanup Sun 04:00). |
| [`package.json`](../package.json) | Scripts: `dev`, `build` (= `prisma generate && next build`), `migrate:deploy`, `start`, `lint`. |
| `AGENTS.md` / `CLAUDE.md` | Project instructions. Reminder: this is Next 16; read `node_modules/next/dist/docs/` before assuming APIs. |
| `PRODUCT.md` / `README.md` | Product brief + readme. |

---

## 2. `app/` — Route Structure

The App Router mixes four distinct surfaces under one root. Tenancy is keyed off the dynamic `[shopSlug]` segment plus the `proxy.js` rewrite for custom domains.

### 2.1 Marketing landing (root)

Marketing landing for the SaaS itself — served on `makas.tech` / `makas.furunci.tech`.

| Path | Notes |
|---|---|
| [`app/page.js`](../app/page.js) | `"use client"` landing page (hero, features, CTAs). |
| [`app/layout.js`](../app/layout.js) | Root layout: `next/font` (Outfit / Cormorant / DM Mono), `LanguageProvider` + `AuthProvider` + `AppointmentsProvider`, `Toaster`, OG metadata, Organization JSON-LD. |
| [`app/globals.css`](../app/globals.css) | Tailwind 4 entry, design tokens, z-index scale, fonts. |
| [`app/error.js`](../app/error.js) | Top-level error boundary. |
| [`app/loading.js`](../app/loading.js) | Top-level loader. |
| [`app/sitemap.js`](../app/sitemap.js) | Dynamic sitemap (active shops + legal pages). |
| [`app/robots.js`](../app/robots.js) | Disallows `/admin`, `/superadmin`, `/api`, `/barber`. |
| [`app/manifest.js`](../app/manifest.js) | PWA manifest. |
| [`app/opengraph-image.js`](../app/opengraph-image.js) | Platform OG card (Node runtime, reads SVG from `public/`). |
| [`app/apple-icon.png`](../app/apple-icon.png) | Apple touch icon. |
| [`app/gizlilik/page.js`](../app/gizlilik/page.js) | Privacy policy (TR). |
| [`app/kullanim-kosullari/page.js`](../app/kullanim-kosullari/page.js) | Terms of use (TR). |
| [`app/cerez-politikasi/page.js`](../app/cerez-politikasi/page.js) | Cookie policy (TR). |

### 2.2 `(public)` tenant surface — `app/[shopSlug]/`

Public tenant pages — served on `/{slug}` on the platform domain, or as the root `/` on a tenant's custom domain (rewritten by [`proxy.js`](../proxy.js)).

| Path | Notes |
|---|---|
| [`app/[shopSlug]/layout.js`](../app/[shopSlug]/layout.js) | Resolves shop via [`resolveShopBySlug`](../lib/shop.js); builds Google Maps embed URL server-side so the API key stays off the client; wraps children in `ShopProvider`. |
| [`app/[shopSlug]/page.js`](../app/[shopSlug]/page.js) | Tenant landing page — `revalidate = 300`. Hero + identity above the fold; Services / Barbers / Gallery / Testimonials / FAQ / SalonInfo are deferred via `next/dynamic` to split framer-motion out of the initial bundle. Aggregates working hours and computes per-barber earliest slot in Europe/Istanbul. |
| [`app/[shopSlug]/opengraph-image.js`](../app/[shopSlug]/opengraph-image.js) | Per-tenant OG card (Node runtime — Prisma needs `node:util/types`). |
| [`app/[shopSlug]/book/page.js`](../app/[shopSlug]/book/page.js) | Public booking flow — guarded by [`canAcceptPublicBookings`](../lib/subscription.js). |
| [`app/[shopSlug]/barber/[barberSlug]/page.js`](../app/[shopSlug]/barber/[barberSlug]/page.js) | Individual barber dashboard (server resolves barber, renders client component). |
| [`app/[shopSlug]/gizlilik/page.js`](../app/[shopSlug]/gizlilik/page.js) | Per-tenant privacy page. |
| [`app/[shopSlug]/admin/page.js`](../app/[shopSlug]/admin/page.js) | Admin shell rendered under tenant slug (SUPER_ADMIN preview path — sets `previewShopId` on the API client). |

### 2.3 Admin (platform-level entry)

| Path | Notes |
|---|---|
| [`app/admin/page.js`](../app/admin/page.js) | `"use client"` redirect — sends authenticated users to their tenant admin or super-admin based on `useAuth()`. |
| [`app/book/page.js`](../app/book/page.js) | Always 404 — `/book` without a slug is never valid. |
| [`app/barber/page.js`](../app/barber/page.js) | Always 404. |
| [`app/barber/[id]/page.js`](../app/barber/[id]/page.js) | Legacy redirect — looks up slug then redirects to `/{shopSlug}/barber/{barberSlug}`. |
| [`app/review/[token]/page.js`](../app/review/[token]/page.js) | Public review submission page (token from `ReviewRequest`). |

### 2.4 Super-admin

| Path | Notes |
|---|---|
| [`app/superadmin/page.js`](../app/superadmin/page.js) | Super-admin dashboard shell. |
| [`app/superadmin/login/page.js`](../app/superadmin/login/page.js) | Dedicated login page. |

Access to `/superadmin/**` and `/api/superadmin/**` can be gated by `SUPER_ADMIN_IP_ALLOWLIST` (enforced in [`proxy.js`](../proxy.js); unset = no enforcement).

### 2.5 `app/api/` — Route Handlers

All API surfaces are `route.js` handlers grouped by audience.

#### Public

| Path | Notes |
|---|---|
| [`app/api/leads/route.js`](../app/api/leads/route.js) | Landing-page lead capture form (3 leads / 10 min / IP). |
| [`app/api/events/route.js`](../app/api/events/route.js) | Analytics ingest (`sendBeacon`-friendly, 204 on rate-limit, allowlist in [`lib/analytics.js`](../lib/analytics.js)). |
| [`app/api/availability/route.js`](../app/api/availability/route.js) | Public slot finder for booking flow. |
| [`app/api/services/route.js`](../app/api/services/route.js) | Public service catalog read. |
| [`app/api/barbers/route.js`](../app/api/barbers/route.js) | Public barber list. |
| [`app/api/staff/route.js`](../app/api/staff/route.js) | Public staff list (alias). |
| [`app/api/reviews/route.js`](../app/api/reviews/route.js) | Google Places reviews proxy. |
| [`app/api/review/[token]/route.js`](../app/api/review/[token]/route.js) | Submit review via tokenised link. |
| [`app/api/appointments/route.js`](../app/api/appointments/route.js) | Authenticated list (scope from JWT shopId); public booking POST. |
| [`app/api/appointments/[id]/route.js`](../app/api/appointments/[id]/route.js) | Single appointment GET/PATCH/DELETE. |
| [`app/api/appointments/[id]/status/route.js`](../app/api/appointments/[id]/status/route.js) | Status transitions (confirm/cancel/complete). |
| [`app/api/appointments/walkin/route.js`](../app/api/appointments/walkin/route.js) | Walk-in entry (admin/barber); uses `wi-…` Client placeholder. |
| [`app/api/calendar/[appointmentId]/ics/route.js`](../app/api/calendar/[appointmentId]/ics/route.js) | `.ics` calendar export. |

#### Auth — `app/api/auth/`

| Path | Notes |
|---|---|
| [`login/route.js`](../app/api/auth/login/route.js) | Email + password; sets httpOnly `makas-token` cookie. |
| [`me/route.js`](../app/api/auth/me/route.js) | Session probe for `AuthContext`. |
| [`profile/route.js`](../app/api/auth/profile/route.js) | Update logged-in user profile. |
| [`change-password/route.js`](../app/api/auth/change-password/route.js) | Self-serve password change. |

#### Admin (tenant-scoped) — `app/api/admin/`

All scoped by JWT `shopId` (or `?shopId=` query when called by SUPER_ADMIN — see [`lib/shop.js`](../lib/shop.js) `getShopIdFromPayload`).

| Path | Notes |
|---|---|
| [`shop/route.js`](../app/api/admin/shop/route.js) | Shop profile CRUD. |
| [`shop/logo/route.js`](../app/api/admin/shop/logo/route.js) · [`cover/route.js`](../app/api/admin/shop/cover/route.js) · [`gallery/route.js`](../app/api/admin/shop/gallery/route.js) | Image uploads (Cloudinary). |
| [`barbers/route.js`](../app/api/admin/barbers/route.js) · [`[id]/route.js`](../app/api/admin/barbers/[id]/route.js) · [`[id]/photo/route.js`](../app/api/admin/barbers/[id]/photo/route.js) | Barber CRUD + photo upload. |
| [`services/route.js`](../app/api/admin/services/route.js) · [`[id]/route.js`](../app/api/admin/services/[id]/route.js) | Service catalog CRUD. |
| [`clients/route.js`](../app/api/admin/clients/route.js) | Client list / merge. |
| [`holidays/route.js`](../app/api/admin/holidays/route.js) · [`[id]/route.js`](../app/api/admin/holidays/[id]/route.js) | Shop-wide + barber-scoped holidays. |
| [`working-hours/route.js`](../app/api/admin/working-hours/route.js) | Per-barber working-hours edit. |
| [`stats/route.js`](../app/api/admin/stats/route.js) · [`analytics/route.js`](../app/api/admin/analytics/route.js) · [`revenue/route.js`](../app/api/admin/revenue/route.js) | Dashboard KPIs, analytics funnel, revenue. |
| [`reviews/route.js`](../app/api/admin/reviews/route.js) | In-tenant review management. |
| [`notification-settings/route.js`](../app/api/admin/notification-settings/route.js) · [`notification-history/route.js`](../app/api/admin/notification-history/route.js) | Netgsm creds + templates + sent log. |
| [`billing/route.js`](../app/api/admin/billing/route.js) | Invoice + subscription summary. |

#### Barber-self — `app/api/barber/`

| Path | Notes |
|---|---|
| [`me/availability/route.js`](../app/api/barber/me/availability/route.js) | Barber edits own working hours. |
| [`me/break/route.js`](../app/api/barber/me/break/route.js) | Barber adds recurring / one-off break. |
| [`photo/route.js`](../app/api/barber/photo/route.js) | Barber updates own avatar. |
| [`reviews/route.js`](../app/api/barber/reviews/route.js) | Barber's review feed. |

#### Super-admin — `app/api/superadmin/`

| Path | Notes |
|---|---|
| [`stats/route.js`](../app/api/superadmin/stats/route.js) | Platform-wide KPIs. |
| [`analytics/route.js`](../app/api/superadmin/analytics/route.js) | Cross-tenant analytics. |
| [`shops/route.js`](../app/api/superadmin/shops/route.js) · [`shops/[id]/route.js`](../app/api/superadmin/shops/[id]/route.js) | Tenant CRUD (incl. custom domain assignment). |
| [`subscriptions/route.js`](../app/api/superadmin/subscriptions/route.js) | Manual subscription state changes. |

#### Payments — `app/api/payments/`

| Path | Notes |
|---|---|
| [`checkout/route.js`](../app/api/payments/checkout/route.js) | Start checkout via provider abstraction. |
| [`webhook/route.js`](../app/api/payments/webhook/route.js) | Provider-agnostic webhook — verifies + applies Shop state and appends `Invoice`. |

#### Cron — `app/api/cron/`

Scheduled in [`vercel.json`](../vercel.json).

| Path | Schedule | Notes |
|---|---|---|
| [`notifications/route.js`](../app/api/cron/notifications/route.js) | `0 9 * * *` | Drains `NotificationJob` queue (Netgsm SMS / WhatsApp). |
| [`billing/route.js`](../app/api/cron/billing/route.js) | `0 3 * * *` | Trial-expiry, PAST_DUE grace → SUSPENDED, etc. |
| [`cleanup-photos/route.js`](../app/api/cron/cleanup-photos/route.js) | `0 4 * * 0` | Weekly Cloudinary orphan sweep. |

---

## 3. `components/`

Grouped by surface — no `*.tsx`; project uses plain JSX.

### `components/landing/`
Public tenant landing page widgets.

[`IdentityBlock.js`](../components/landing/IdentityBlock.js) · [`SectionNav.js`](../components/landing/SectionNav.js) · [`About.js`](../components/landing/About.js) · [`Services.js`](../components/landing/Services.js) · [`Barbers.js`](../components/landing/Barbers.js) · [`Gallery.js`](../components/landing/Gallery.js) · [`Testimonials.js`](../components/landing/Testimonials.js) · [`FAQ.js`](../components/landing/FAQ.js) · [`SalonInfo.js`](../components/landing/SalonInfo.js) · [`BookingCard.js`](../components/landing/BookingCard.js) · [`StickyActionBar.js`](../components/landing/StickyActionBar.js) · [`LandingNavbar.js`](../components/landing/LandingNavbar.js) · [`LandingFooter.js`](../components/landing/LandingFooter.js) · [`TrackPageView.js`](../components/landing/TrackPageView.js) (fires `page_view` to `/api/events`).

### `components/booking/`
Tenant booking flow (4-step).

[`BookingFlow.js`](../components/booking/BookingFlow.js) (controller) · [`ServiceSelect.js`](../components/booking/ServiceSelect.js) · [`BarberSelect.js`](../components/booking/BarberSelect.js) · [`DateSelect.js`](../components/booking/DateSelect.js) · [`TimeSelect.js`](../components/booking/TimeSelect.js) · [`DateTimeSelect.js`](../components/booking/DateTimeSelect.js) · [`Confirmation.js`](../components/booking/Confirmation.js).

### `components/admin/`
Tenant admin + barber dashboards.

[`AdminDashboard.js`](../components/admin/AdminDashboard.js) (shell) · [`DashboardTopbar.js`](../components/admin/DashboardTopbar.js) · [`KPICards.js`](../components/admin/KPICards.js) · [`AreaChart.js`](../components/admin/AreaChart.js) · [`CalendarView.js`](../components/admin/CalendarView.js) · [`CalendarWidget.js`](../components/admin/CalendarWidget.js) · [`AppointmentsList.js`](../components/admin/AppointmentsList.js) · [`BarbersManagement.js`](../components/admin/BarbersManagement.js) · [`ServicesManagement.js`](../components/admin/ServicesManagement.js) · [`SettingsPage.js`](../components/admin/SettingsPage.js) · [`NotificationsPage.js`](../components/admin/NotificationsPage.js) · [`ReviewsPage.js`](../components/admin/ReviewsPage.js) · [`BillingPage.js`](../components/admin/BillingPage.js) · [`SubscriptionBanner.js`](../components/admin/SubscriptionBanner.js) · [`LandingAnalyticsPanel.js`](../components/admin/LandingAnalyticsPanel.js) · [`BarberDashboardClient.js`](../components/admin/BarberDashboardClient.js) · [`ManualBookingModal.js`](../components/admin/ManualBookingModal.js) · [`WalkInModal.js`](../components/admin/WalkInModal.js) · [`CompleteAppointmentModal.js`](../components/admin/CompleteAppointmentModal.js) · [`CancelAppointmentModal.js`](../components/admin/CancelAppointmentModal.js).

### `components/superadmin/`
[`SuperAdminDashboard.js`](../components/superadmin/SuperAdminDashboard.js) — platform-wide tenant table + KPIs.

### `components/shared/`
Cross-surface primitives: [`Navbar.js`](../components/shared/Navbar.js) · [`Footer.js`](../components/shared/Footer.js) · [`CTAGroup.js`](../components/shared/CTAGroup.js) · [`Eyebrow.js`](../components/shared/Eyebrow.js) · [`PillButton.js`](../components/shared/PillButton.js) · [`SectionHeader.js`](../components/shared/SectionHeader.js) · [`StatCard.js`](../components/shared/StatCard.js) · [`TrustBadge.js`](../components/shared/TrustBadge.js) · [`ImageCropModal.js`](../components/shared/ImageCropModal.js).

### `components/legal/`
[`LegalLayout.js`](../components/legal/LegalLayout.js) — wrapper for `/gizlilik`, `/kullanim-kosullari`, `/cerez-politikasi`.

### `components/ui/`
shadcn primitives (JSX): [`button.jsx`](../components/ui/button.jsx) · [`card.jsx`](../components/ui/card.jsx) · [`dialog.jsx`](../components/ui/dialog.jsx) · [`sheet.jsx`](../components/ui/sheet.jsx) · [`dropdown-menu.jsx`](../components/ui/dropdown-menu.jsx) · [`input.jsx`](../components/ui/input.jsx) · [`label.jsx`](../components/ui/label.jsx) · [`select.jsx`](../components/ui/select.jsx) · [`tabs.jsx`](../components/ui/tabs.jsx) · [`table.jsx`](../components/ui/table.jsx) · [`badge.jsx`](../components/ui/badge.jsx) · [`separator.jsx`](../components/ui/separator.jsx) · [`progress.jsx`](../components/ui/progress.jsx) · [`skeleton.jsx`](../components/ui/skeleton.jsx) · [`sonner.jsx`](../components/ui/sonner.jsx).

---

## 4. `lib/` — Modules

| File | Purpose |
|---|---|
| [`prisma.js`](../lib/prisma.js) | Prisma 7 client (Postgres adapter `@prisma/adapter-pg`); lazy singleton via `Proxy` so `DATABASE_URL` is read at first query, not module init. |
| [`auth.js`](../lib/auth.js) | `jose`-based JWT sign/verify, cookie helper, `requireAuth` with 15 s in-process `tokenVersion` cache. |
| [`shop.js`](../lib/shop.js) | `resolveShopBySlug` (React `cache()`-deduped, filters `deletedAt`); `getShopIdFromPayload` (SUPER_ADMIN passes `?shopId=`). |
| [`booking.js`](../lib/booking.js) | `validateBookingWindow` — working hours / breaks / holidays. Appointment collision checks live in POST routes (TOCTOU-safe transactions). |
| [`subscription.js`](../lib/subscription.js) | Plan lifecycle: `canAcceptPublicBookings`, `shouldShowBillingBanner`, `daysUntilTrialEnds`, plan-limit guards. `PAST_DUE_GRACE_DAYS = 3`. |
| [`plans.js`](../lib/plans.js) | Single-tier flat plan (500 ₺/ay, 14-day trial). Enum `PlanTier` retained for legacy rows. |
| [`payments/provider.js`](../lib/payments/provider.js) | Provider abstraction (`createCheckout`, `verifyWebhook`, `cancelSubscription`). Throws `PaymentNotConfiguredError` → 503. |
| [`payments/iyzico.js`](../lib/payments/iyzico.js) | iyzico provider stub — interface complete, bodies pending SDK wire-up. |
| [`notifications.js`](../lib/notifications.js) | SMS / WhatsApp template engine + Netgsm sender; defaults in TR. |
| [`reviews.js`](../lib/reviews.js) | `createReviewRequest` (token + WA link) — fired on `COMPLETED`. |
| [`googleReviews.js`](../lib/googleReviews.js) | Server-side Google Places fetch, called once per landing render. |
| [`analytics.js`](../lib/analytics.js) | Event allowlist (`page_view`, `book_click`, `whatsapp_click`, …). |
| [`track.js`](../lib/track.js) | Client tracker using `sendBeacon` fallback (survives unload). |
| [`api.js`](../lib/api.js) | `apiFetch` wrapper (sends cookie); supports `setPreviewShopId` so SUPER_ADMIN can preview tenant admin and scope `/api/admin/*` calls to `?shopId=…`. |
| [`calendar.js`](../lib/calendar.js) | `.ics` builder — converts Istanbul local to UTC (offset +03). |
| [`cloudinary.js`](../lib/cloudinary.js) | Cloudinary SDK wrapper for shop / barber image uploads. |
| [`rateLimit.js`](../lib/rateLimit.js) | In-process token bucket; swap for Upstash when multi-instance. |
| [`validation.js`](../lib/validation.js) | Shared input validators (image data URLs, phone E.164 via `toE164`, `telHref`). |
| [`utils.js`](../lib/utils.js) | `cn()` (clsx + tailwind-merge), `todayStr()` / `toDateStr()` / `nowMinutes()` — all Europe/Istanbul. |
| [`data.js`](../lib/data.js) | Fallback testimonials (used when Google Places returns empty). |
| [`translations.js`](../lib/translations.js) | TR/EN copy table. |
| [`adminTheme.js`](../lib/adminTheme.js) | Hex tokens for admin dashboard (mirrors `--makas-*` CSS vars). |
| [`useBodyScrollLock.js`](../lib/useBodyScrollLock.js) | Hook for modal scroll lock. |

---

## 5. `prisma/`

| File | Purpose |
|---|---|
| [`schema.prisma`](../prisma/schema.prisma) | Source of truth — see [`docs/DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md). |
| [`migrations/`](../prisma/migrations) | 15 timestamped migrations + `migration_lock.toml` (postgresql). Recent: `*_revenue_commission_walkin`, `*_shop_auto_confirm_bookings`, `*_booking_source_rename`. |
| [`seed.js`](../prisma/seed.js) | Original tenant seed (`shop-abdurrahman` / slug `abdurrahman`). |
| [`seed-demo.js`](../prisma/seed-demo.js) | **`/demo` tenant** — sales demo with realistic appointments. Idempotent; only touches the `demo` slug. Run: `node prisma/seed-demo.js`. |
| [`create-superadmin.js`](../prisma/create-superadmin.js) | Bootstrap a SUPER_ADMIN user from `SUPERADMIN_EMAIL` env. |
| [`migrate-photos.js`](../prisma/migrate-photos.js) | Backfill — barber photos to Cloudinary. |
| [`migrate-v2.js`](../prisma/migrate-v2.js) | One-shot v1→v2 data migration. |
| [`update-barbers.js`](../prisma/update-barbers.js) · [`update-hours.js`](../prisma/update-hours.js) · [`update-services.js`](../prisma/update-services.js) | Ad-hoc data-fix scripts. |

`prisma.config.ts` uses `DATABASE_URL` (pooled) for runtime and `DIRECT_URL` for migrations — required by Neon.

---

## 6. Routing Entry-points & Special Files

| File | Role |
|---|---|
| [`proxy.js`](../proxy.js) | Next 16 root proxy. **Two jobs:** (1) optional super-admin IP allowlist (`SUPER_ADMIN_IP_ALLOWLIST` env) over `/superadmin/**` + `/api/superadmin/**`; (2) custom-domain → tenant rewrite. Looks up `Shop.customDomain == host`, caches the host→slug map in-process for 5 min, rewrites `/` → `/{slug}` and `/x` → `/{slug}/x`. Skips `PLATFORM_HOSTS` and `*.vercel.app`. Matcher excludes `_next/static`, `_next/image`, assets, and `/api/*` except `/api/superadmin/*`. |
| [`app/layout.js`](../app/layout.js) | Root `<html>` — installs `LanguageProvider` → `AuthProvider` → `AppointmentsProvider`. |
| [`app/[shopSlug]/layout.js`](../app/[shopSlug]/layout.js) | Tenant layout — resolves shop, installs `ShopProvider`, hides `googlePlacesKey` server-side. |
| [`contexts/LanguageContext.js`](../contexts/LanguageContext.js) | `lang` (`tr` / `en`) persisted in `localStorage`. |
| [`contexts/AuthContext.js`](../contexts/AuthContext.js) | Session restore via `/api/auth/me`; exposes `user`, derived `role`, `login`, `logout`. |
| [`contexts/ShopContext.js`](../contexts/ShopContext.js) | Tenant snapshot for the public surface. |
| [`contexts/AppointmentsContext.js`](../contexts/AppointmentsContext.js) | Shared appointments list + Complete / Cancel modals (single source so every list view shares state). |

---

## 7. Tenancy — How It's Wired

Three concurrent paths reach the same tenant pages:

1. **Slug under platform domain.** `https://makas.tech/{slug}` → matches `app/[shopSlug]/page.js` directly. Layout resolves `Shop` by slug (filters `deletedAt: null`), guards on `status === "ACTIVE"`.
2. **Tenant custom domain.** Shop owner sets DNS to platform; super-admin writes `Shop.customDomain`. Visitor hits `https://mehmetberber.com/` → [`proxy.js`](../proxy.js) looks up the host, rewrites to `/{slug}` internally. Same `[shopSlug]` route renders. Cache: 5 min in-process.
3. **Authenticated tenant admin.** `/admin` (root) is a client redirect (`AuthContext`) → tenant goes to `/{slug}/admin`; SUPER_ADMIN goes to `/superadmin`.

API tenancy:
- Every `/api/admin/*` handler calls `requireAuth` + `getShopIdFromPayload`. Non-super users are pinned to their JWT `shopId`; SUPER_ADMIN passes `?shopId=` explicitly.
- The SPA's [`lib/api.js`](../lib/api.js) auto-appends `shopId=` to `/api/admin/*` and `/api/appointments*` when [`setPreviewShopId`](../lib/api.js) is active — i.e. SUPER_ADMIN previewing `/{slug}/admin`.
- Public POST endpoints (`/api/leads`, `/api/events`, `/api/availability`, booking creation) read `shopId` from the body / params and never trust the caller's session.

Three audiences are separated by both URL and JWT role:
- **Public visitors** → `app/[shopSlug]/...` (no auth).
- **Tenant staff (ADMIN / BARBER / RECEPTIONIST)** → `app/[shopSlug]/admin`, `app/[shopSlug]/barber/[barberSlug]` (JWT `shopId` enforced).
- **SUPER_ADMIN** → `app/superadmin/...` (`shopId = null`), optionally IP-locked.

---

## 8. Build / Config Files

| File | Notes |
|---|---|
| [`package.json`](../package.json) | Scripts: `dev` (next dev), `build` (`prisma generate && next build`), `migrate:deploy`, `start`, `lint`. Migrations are **not** run on every Vercel build (see commit `a74f6ee`). |
| [`next.config.mjs`](../next.config.mjs) | `serverExternalPackages` for `pg`, `@prisma/client`, `@prisma/adapter-pg`, `cloudinary`. Cloudinary remote pattern. Security headers (XFO, XCTO, Referrer, Permissions). CSP with `unsafe-eval` only in dev (HMR). |
| Tailwind | **No JS config file.** Tailwind 4 is configured inline via `@import "tailwindcss"` in [`app/globals.css`](../app/globals.css). Tokens / z-index scale / fonts also live in that file. |
| [`postcss.config.mjs`](../postcss.config.mjs) | Loads `@tailwindcss/postcss`. |
| [`vercel.json`](../vercel.json) | Three cron entries (see §2.5). |
| [`prisma.config.ts`](../prisma.config.ts) | `schema`, `migrations.path`, `datasource.url` (pooled) + `migrateUrl` (direct). |
| [`eslint.config.mjs`](../eslint.config.mjs) | Flat config; pulls in `eslint-config-next/core-web-vitals`. |
| [`jsconfig.json`](../jsconfig.json) | `@/*` → repo root. |
| [`components.json`](../components.json) | shadcn — style `base-nova`, JSX (`tsx: false`), neutral base color. |
| `.env` / `.env.example` | Local env (Postgres, Cloudinary, JWT, Netgsm, Google Places, `SUPER_ADMIN_IP_ALLOWLIST`, `PAYMENT_PROVIDER`, etc.). |

---

## Cross-references

- Data model: [`docs/DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md)
- Product brief: [`PRODUCT.md`](../PRODUCT.md)
- Next 16 upgrade notes: [`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`](../node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md) — especially the `middleware.js` → `proxy.js` rename.

# MAKAS — Architecture

## System Overview

MAKAS is a multi-tenant barbershop SaaS built as a **Next.js monolith** (App Router, Node.js runtime). A single deployment serves all tenants (shops), isolated by `shopId` at the data layer.

```
Browser / Mobile App
        │
        ▼
  Vercel Edge (CDN + routing)
        │
        ▼
  Next.js App Router
  ├── app/[shopSlug]/     ← public booking pages (SSR per tenant)
  ├── app/admin/          ← shop admin panel (client components)
  ├── app/superadmin/     ← platform management
  └── app/api/            ← REST API (Node.js route handlers)
        │
        ├── Prisma ORM → Neon PostgreSQL (pooled via pgBouncer)
        ├── Upstash Redis  ← rate limiting (optional, falls back to in-process)
        └── Cloudinary     ← image storage + CDN
```

**Key external services**

| Service | Purpose |
|---|---|
| Neon (PostgreSQL) | Primary database |
| Upstash Redis | Distributed rate limiting |
| Cloudinary | Image uploads + CDN |
| Netgsm | SMS / WhatsApp notifications (Turkey) |
| Resend | Transactional email (password reset) |
| Google Places API | Geocoding, place search, review widget |
| Vercel Cron | Scheduled jobs (notifications, billing, metrics) |

---

## Folder Structure

```
app/
  [shopSlug]/           Public tenant booking page (SSR)
  admin/                Shop admin panel
  api/                  All API route handlers
    auth/               Login, register, JWT refresh
    admin/              Admin-only endpoints (barbers, stats, etc.)
    barber/             Barber-scoped endpoints
    customer/           Customer account endpoints
    appointments/       Booking CRUD (public POST + auth GET/PATCH/DELETE)
    public/             Unauthenticated read-only endpoints
    shops/              Shop lookup (slug, nearby, availability)
    superadmin/         Platform management
    cron/               Vercel Cron job handlers
    payments/           Payment webhook + checkout
    health/             Health check endpoint
    v1/                 Versioned API (stable, for integrations)
  superadmin/           Super-admin panel
  salons/               Public salon directory
  login/                Customer login
  business/login/       Business (admin/barber) login

components/
  admin/                Admin dashboard components
  landing/              Marketing landing page sections
  shared/               Navbar, Footer, shared UI
  common/               Logo and other cross-cutting components
  map/                  Map/directory components
  account/              Customer account components
  ds.js                 Design system tokens + component exports

lib/
  services/             Business logic layer (BookingService, etc.)
  middleware/           withAuth, withRole RBAC wrappers
  constants/            Feature flag names, plan limits
  channels/             Channel type definitions (WhatsApp, AI, etc.)
  events/               EventBus for cross-service event dispatch
  ai/                   AI runtime stubs (deferred)
  payments/             Payment provider abstraction (iyzico/Stripe stubs)
  auth.js               JWT sign + verify
  apiResponse.js        Consistent response helpers
  prisma.js             Prisma client singleton
  rateLimit.js          Upstash Redis rate limiting
  observability.ts      Error tracking + event logging abstraction
  plans.js              Plan definitions and pricing
  features.js           Feature flag public API (re-exports FeatureService)
  subscription.js       Subscription lifecycle helpers
  notifications.js      Notification queue entry point
  booking.js            Booking window validation
  env.js                Required env var validation (throws on startup)

prisma/
  schema.prisma         Full data model
  migrations/           SQL migration history

contexts/               React context providers (Auth, Appointments, Favorites)
scripts/                One-off admin scripts (shop checks, etc.)
tests/
  unit/                 Vitest unit tests (services, auth, booking)
  integration/          Integration tests
```

---

## Key Architectural Decisions

### Multi-tenancy by `shopId`

Every business entity (User, Barber, Service, Client, Appointment, etc.) has a `shopId` foreign key. All queries **must** filter by `shopId`. The only exception is `SUPER_ADMIN` users, whose `shopId` is `null` and who can query across all shops.

`withRole` and `withAuth` wrappers inject `payload.shopId` into the handler so routes cannot accidentally cross tenant boundaries.

### JWT Authentication

Auth is stateless JWT (signed with `JWT_SECRET`, library: `jose`). Tokens carry `{ userId, shopId, role, barberId, tokenVersion }`. The `tokenVersion` field allows server-side invalidation (logout-all): incrementing it in the DB makes all existing tokens fail the `requireAuth()` check.

Tokens are stored in an `HttpOnly` cookie (`makas_token`). The `/api/auth/refresh` endpoint issues new tokens before expiry.

### Service Layer Pattern

Business logic lives in `lib/services/`, never in route handlers. Routes are thin HTTP adapters:

```
Route handler
  → input validation (HTTP layer)
  → lib/services/BookingService.createBooking()
  → format response with lib/apiResponse helpers
```

This makes services testable in isolation (see `tests/unit/`).

### Event-Driven Notifications

When a booking is created or its status changes, the route handler calls `queueNotifications(appointmentId, event)` (non-blocking, fire-and-forget). `NotificationService` resolves the shop's `NotificationSettings`, renders the appropriate template, and dispatches via Netgsm (SMS/WhatsApp). Scheduled reminders are stored as `NotificationJob` rows and processed by `/api/cron/notifications` (daily at 09:00 UTC).

### RBAC

```
lib/middleware/withRole.js

withRole(['ADMIN', 'SUPER_ADMIN'], handler)   // role allowlist
withAuth(handler)                              // any authenticated user
```

Roles: `SUPER_ADMIN > ADMIN > RECEPTIONIST > BARBER > CUSTOMER`

Barbers are additionally scoped to their own `barberId` inside routes — they can only read/write their own appointments.

---

## Data Model Overview

```
Shop (tenant)
  ├── User[]              Staff accounts (ADMIN, BARBER, RECEPTIONIST) + CUSTOMER accounts
  ├── Barber[]            Barber profiles with WorkingHours + BarberBreak
  ├── Service[]           Service catalog (BarberService: M-N join)
  ├── Client[]            Customer records (upserted by phone on booking)
  ├── Appointment[]       Booking rows (shopId + barberId + date + time unique)
  ├── NotificationSettings Netgsm credentials + template overrides
  ├── NotificationJob[]   Queued/sent SMS jobs
  ├── ReviewRequest[]     Post-completion review invitation (by token)
  ├── Review[]            Submitted ratings (aggregates cached on Shop + Barber)
  ├── ShopMetric[]        Nightly precomputed daily revenue/count stats
  ├── AuditLog[]          Append-only action log
  ├── Invoice[]           Billing ledger
  ├── Integration[]       External integrations (Google, WhatsApp — stubs)
  ├── WebhookSubscription[] Outbound webhook subscriptions
  ├── Conversation[]      Multi-channel conversation threads (future AI)
  └── ShopFeatureOverride[] Per-tenant feature flag overrides
```

**Key constraints:**

- `Appointment`: unique on `(barberId, date, time)` — race condition guard at DB level
- `Client`: unique on `(shopId, phone)` — one client record per phone per shop
- `Review`: unique on `appointmentId` — one review per completed appointment
- `Shop.deletedAt`: soft-delete; active queries filter `deletedAt = null`

**Working hours** are stored as minutes from midnight (`540 = 09:00`). BarberBreak rows can be recurring (dayOfWeek only) or one-off (date set).

**Revenue split**: `Appointment.grossAmount` is split into `barberAmount` (barber's commission) and `shopAmount` (remainder) at completion time, based on `Barber.paymentType` (PERCENTAGE or FIXED).

---

## Request Lifecycle

```
1. HTTP request arrives at Vercel Edge
2. Next.js routes to app/api/**
3. withAuth / withRole wrapper:
   a. Reads Authorization header or makas_token cookie
   b. Verifies JWT (jose) → rejects 401 if invalid/expired
   c. Checks tokenVersion against DB (requireAuth) → rejects 401 if stale
   d. Checks role allowlist → rejects 403 if unauthorized
4. Route handler:
   a. Reads shopId from JWT payload (not request body)
   b. Validates input (format, required fields)
   c. Calls lib/services/* for business logic
   d. Returns lib/apiResponse helper (ok/created/err/notFound/etc.)
5. Non-blocking side effects fire after response:
   - queueNotifications() for booking events
   - Analytics event tracking
```

**Response shape:**

```json
// Success
{ ...data }          // raw object or array — 200/201

// Error
{ "error": "...", "code": "OPTIONAL_CODE" }   // 4xx/5xx

// v1 versioned envelope (app/api/v1/*)
{ "data": {...}, "meta": { "version": "1", "ts": "ISO-8601" } }
```

---

## Feature Flag System

Feature access is checked at call sites via `FeatureService.hasFeature()`, never by plan name directly. This decouples business logic from billing tiers.

**Resolution order (first match wins):**

1. `ShopFeatureOverride` — per-tenant explicit override set by super-admin
2. `PLAN_FEATURES[shop.planTier]` — plan's default feature set
3. `isSuperAdmin = true` — always grants access

**Feature constants** (`lib/constants/features.js`):

```
AI_CHAT, WHATSAPP_AI, INSTAGRAM_AI, VOICE_AI
MARKETING, LOYALTY
API_ACCESS, GOOGLE_SYNC
MULTI_BRANCH, ADVANCED_ANALYTICS, EXPORTS, CUSTOM_DOMAIN
```

**Plan → feature matrix:**

| Plan | Features |
|---|---|
| STARTER | LOYALTY, MARKETING, EXPORTS |
| PROFESSIONAL | STARTER + API_ACCESS, GOOGLE_SYNC, MULTI_BRANCH, ADVANCED_ANALYTICS, CUSTOM_DOMAIN |
| AI | All features including all AI channels |
| PRO / ENTERPRISE | All features (legacy — existing shops) |

Super-admin can override any feature on any shop via `ShopFeatureOverride` rows.

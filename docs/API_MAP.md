# Makas — API Map

Every HTTP route under [`app/api/`](../app/api). Next.js App Router; each file exports `GET` / `POST` / `PATCH` / `PUT` / `DELETE` per the verbs listed.

All money columns are **kuruş** (TRY minor units). All routes return JSON unless noted. Multi-tenant filtering is always `shopId`-scoped at the query layer — there is no row-level DB enforcement.

Total route files: **50**.

---

## 1. Public / customer-facing

Read-only or unauthenticated write endpoints powering the public tenant site (`/[slug]`), booking flow, review submission, and ICS download. Most read endpoints accept `?shopId=` so the public layer can fan out without auth.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/availability` | none | Compute bookable 30-min slots for `?shopId&barberId&serviceId&date` — respects working hours, breaks, holidays, existing appointments. Cached 30s. |
| `GET` | `/api/barbers` | none | List all barbers for `?shopId` (active + inactive). Cached 300s. |
| `GET` | `/api/services` | none | List active services for `?shopId`. Cached 300s. |
| `GET` | `/api/staff` | none | Display roster for login picker — admins + barbers for `?shopId`. |
| `GET` | `/api/reviews` | none | Google Places reviews for `?shopId` (per-shop `googlePlaceId` + `googlePlacesKey`, with env fallback). |
| `GET` | `/api/shops/[slug]/reviews` | none | Internal Review feed for tenant storefront. `?stars=1..5&sort=newest\|oldest&take&skip`. Returns avg + star distribution + paginated reviews. |
| `GET` | `/api/calendar/[appointmentId]/ics` | none | Issue `.ics` download. `appointmentId` is a cuid; only `ACTIVE` shops respond. No PII in payload. |
| `GET` | `/api/review/[token]` | none | Fetch review request by opaque token. 409 if appointment not COMPLETED. |
| `POST` | `/api/review/[token]` | none | Submit `{ shopRating, barberRating, comment }`. 3/5 min/IP. Inserts `Review`, sets `appt.reviewed=true`, recomputes Shop + Barber aggregates in one tx. Returns Google CTA when `shopRating >= 4` AND `shop.googleReviewUrl` is set (CTA hidden otherwise — no env fallback). |
| `POST` | `/api/appointments` | none | Public booking endpoint. 5/10 min/IP. Validates shop status + subscription, working hours, break/holiday window, slot conflicts in Serializable tx. Status = `CONFIRMED` or `PENDING` per `shop.autoConfirmBookings`. |
| `POST` | `/api/leads` | none | Marketing landing form. 3/10 min/IP. Writes `Lead`. |
| `POST` | `/api/events` | none | Analytics ingest. 120/min/IP. Always 204; errors swallowed. Whitelisted `eventType` only. |

Source: [`app/api/availability/route.js`](../app/api/availability/route.js), [`app/api/barbers/route.js`](../app/api/barbers/route.js), [`app/api/services/route.js`](../app/api/services/route.js), [`app/api/staff/route.js`](../app/api/staff/route.js), [`app/api/reviews/route.js`](../app/api/reviews/route.js), [`app/api/shops/[slug]/reviews/route.js`](../app/api/shops/[slug]/reviews/route.js), [`app/api/calendar/[appointmentId]/ics/route.js`](../app/api/calendar/[appointmentId]/ics/route.js), [`app/api/review/[token]/route.js`](../app/api/review/[token]/route.js), [`app/api/appointments/route.js`](../app/api/appointments/route.js), [`app/api/leads/route.js`](../app/api/leads/route.js), [`app/api/events/route.js`](../app/api/events/route.js).

---

## 2. Auth

JWT cookie (`makas-token`) + Bearer header both accepted. JWT carries `userId, role, shopId, barberId, tokenVersion`. Logout / password-change increments `User.tokenVersion`; auth cache (15s TTL) keyed by `userId`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/login` | none (10/15 min/IP) | Email or username + password. Rejects `SUSPENDED` shops. Sets `makas-token` cookie, returns `{ token, user }`. |
| `GET` | `/api/auth/me` | requireAuth | Current user with `barber` + `shop` (incl. plan/subscription) included. |
| `DELETE` | `/api/auth/me` | requireAuth | Logout. Bumps `tokenVersion`, clears cookie + auth cache. |
| `PATCH` | `/api/auth/change-password` | requireAuth | Verifies current password, hashes new (cost 12), bumps `tokenVersion`, re-issues cookie. |
| `PATCH` | `/api/auth/profile` | requireAuth | Update `username` / `displayName`. P2002 → 409. |

Source: [`app/api/auth/login/route.js`](../app/api/auth/login/route.js), [`app/api/auth/me/route.js`](../app/api/auth/me/route.js), [`app/api/auth/change-password/route.js`](../app/api/auth/change-password/route.js), [`app/api/auth/profile/route.js`](../app/api/auth/profile/route.js), [`lib/auth.js`](../lib/auth.js).

---

## 3. Admin (tenant)

Tenant-scoped management API. Role gate is one of `ADMIN`, `RECEPTIONIST`, `BARBER`, `SUPER_ADMIN` (specifics vary). `SUPER_ADMIN` may pass `?shopId=` to scope another tenant; everyone else is locked to `payload.shopId`.

### 3.1 Shop profile + assets

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/shop` | ADMIN, SUPER_ADMIN | Full salon profile (`PROFILE_SELECT`). |
| `PATCH` | `/api/admin/shop` | ADMIN, SUPER_ADMIN | Update identity, contact, address (composes legacy `address` from `addressLine`+`city`), lat/lng, social URLs (strict `http(s)`), legacy `social` JSON, Google/maps (`googlePlaceId`, `googlePlacesKey`, `mapsEmbed`), `googleReviewUrl` (hostname must be `*.google.com`), `reviewReminderEnabled` toggle. 20/5 min/IP/shop. |
| `POST` | `/api/admin/shop/logo` | ADMIN, SUPER_ADMIN | Upload logo data URL → Cloudinary. 10/5 min/IP. |
| `DELETE` | `/api/admin/shop/logo` | ADMIN, SUPER_ADMIN | Delete logo from Cloudinary + null column. |
| `POST` | `/api/admin/shop/cover` | ADMIN, SUPER_ADMIN | Upload cover image data URL. 10/5 min/IP. |
| `DELETE` | `/api/admin/shop/cover` | ADMIN, SUPER_ADMIN | Delete cover. |
| `POST` | `/api/admin/shop/gallery` | ADMIN, SUPER_ADMIN | Append one image; max 12. 30/5 min/IP. |
| `PUT` | `/api/admin/shop/gallery` | ADMIN, SUPER_ADMIN | Reorder; body must be a permutation of the existing URLs. |
| `DELETE` | `/api/admin/shop/gallery` | ADMIN, SUPER_ADMIN | Remove image by `{ index }`. |

Source: [`app/api/admin/shop/route.js`](../app/api/admin/shop/route.js), [`app/api/admin/shop/logo/route.js`](../app/api/admin/shop/logo/route.js), [`app/api/admin/shop/cover/route.js`](../app/api/admin/shop/cover/route.js), [`app/api/admin/shop/gallery/route.js`](../app/api/admin/shop/gallery/route.js).

### 3.2 Barbers

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/barbers` | ADMIN, SUPER_ADMIN | List barbers with `workingHours` for caller's shop. |
| `POST` | `/api/admin/barbers` | ADMIN, SUPER_ADMIN | Create barber + matching `BARBER` `User` atomically. Validates slug (`^[a-z0-9-]{2,40}$`), email, password ≥8. `canCreateBarber` plan-limit gate returns **402** with `{ limit, current }` if exceeded. |
| `GET` | `/api/admin/barbers/[id]` | ADMIN, SUPER_ADMIN | Full barber w/ `workingHours` + `breaks`. |
| `PATCH` | `/api/admin/barbers/[id]` | ADMIN, SUPER_ADMIN | Allowed subset incl. `paymentType` (`PERCENTAGE`\|`FIXED`), `commissionRate` (0-100), `fixedSalary` (kuruş). Slug uniqueness re-checked. |
| `DELETE` | `/api/admin/barbers/[id]` | ADMIN, SUPER_ADMIN | Hard delete; defense-in-depth `shopId` filter. |
| `POST` | `/api/admin/barbers/[id]/photo` | ADMIN, SUPER_ADMIN | Upload profile photo data URL (max 2 MB). |
| `DELETE` | `/api/admin/barbers/[id]/photo` | ADMIN, SUPER_ADMIN | Delete profile photo. |

Source: [`app/api/admin/barbers/route.js`](../app/api/admin/barbers/route.js), [`app/api/admin/barbers/[id]/route.js`](../app/api/admin/barbers/[id]/route.js), [`app/api/admin/barbers/[id]/photo/route.js`](../app/api/admin/barbers/[id]/photo/route.js).

### 3.3 Services

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/services` | ADMIN, SUPER_ADMIN | All services (incl. inactive); supports `?q=`. |
| `POST` | `/api/admin/services` | ADMIN, SUPER_ADMIN | Create. Category one of `CUTS \| BEARD \| COMBO \| PREMIUM`. Duration 5-480; price null = "Sorulur". |
| `GET` | `/api/admin/services/[id]` | ADMIN, SUPER_ADMIN | Read. |
| `PATCH` | `/api/admin/services/[id]` | ADMIN, SUPER_ADMIN | Allowed subset; same validation rules. |
| `DELETE` | `/api/admin/services/[id]` | ADMIN, SUPER_ADMIN | Hard delete. |

Source: [`app/api/admin/services/route.js`](../app/api/admin/services/route.js), [`app/api/admin/services/[id]/route.js`](../app/api/admin/services/[id]/route.js).

### 3.4 Working hours + holidays

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/working-hours` | ADMIN, RECEPTIONIST, SUPER_ADMIN | All barbers + `workingHours` + `breaks`; or single `?barberId=`. |
| `PATCH` | `/api/admin/working-hours` | ADMIN, RECEPTIONIST, SUPER_ADMIN | Body `{ barberId, mon: { start, end }, … }`. Minutes from midnight. Verifies barber belongs to caller's shop. |
| `GET` | `/api/admin/holidays` | ADMIN, RECEPTIONIST, SUPER_ADMIN | List holidays; `?barberId=` includes shop-wide + barber-specific. |
| `POST` | `/api/admin/holidays` | ADMIN, RECEPTIONIST | Create. Date format strict; rejects invalid calendar dates. |
| `DELETE` | `/api/admin/holidays/[id]` | ADMIN, RECEPTIONIST, SUPER_ADMIN | Delete with shop-scope check. |

Source: [`app/api/admin/working-hours/route.js`](../app/api/admin/working-hours/route.js), [`app/api/admin/holidays/route.js`](../app/api/admin/holidays/route.js), [`app/api/admin/holidays/[id]/route.js`](../app/api/admin/holidays/[id]/route.js).

### 3.5 Clients

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/clients` | ADMIN, RECEPTIONIST, BARBER, SUPER_ADMIN | Search + pagination. Hydrates `visits`, `totalSpent`, `lastVisit`, `noShows`, `blocked`. `?search=&barberId=&limit&offset`. |

Source: [`app/api/admin/clients/route.js`](../app/api/admin/clients/route.js).

### 3.6 Reviews, notifications, analytics, revenue, stats

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/reviews` | ADMIN, RECEPTIONIST, SUPER_ADMIN | List submitted `Review` rows + summary (avg, star distribution, per-barber, `ReviewRequest` pipeline counts). `?stars=1..5` filter. |
| `GET` | `/api/admin/notification-history` | ADMIN, RECEPTIONIST, SUPER_ADMIN | `NotificationJob` rows w/ appointment+client preview. `?status=&channel=&limit&offset`. |
| `GET` | `/api/admin/notification-settings` | ADMIN, RECEPTIONIST, SUPER_ADMIN | `NotificationSettings` (Netgsm creds + templates + toggles). |
| `PATCH` | `/api/admin/notification-settings` | ADMIN, RECEPTIONIST, SUPER_ADMIN | Upsert allowed subset. |
| `GET` | `/api/admin/analytics` | ADMIN, SUPER_ADMIN | Last 30d `AnalyticsEvent` counts zero-filled to `EVENT_TYPES`. |
| `GET` | `/api/admin/revenue` | ADMIN, RECEPTIONIST, BARBER, SUPER_ADMIN | Daily revenue for `?range=7d\|30d&barberId=`. Istanbul TZ. |
| `GET` | `/api/admin/stats` | ADMIN, RECEPTIONIST, BARBER, SUPER_ADMIN | KPI dashboard payload: gross/shopNet/barberPaid this vs last month, walk-in rate, top service, etc. BARBER role auto-scoped to own `barberId`. |
| `GET` | `/api/admin/billing` | ADMIN, SUPER_ADMIN | Plan + subscription state + monthly usage. Read-only — UI shows "İletişime Geç" CTA. |

Source: [`app/api/admin/reviews/route.js`](../app/api/admin/reviews/route.js), [`app/api/admin/notification-history/route.js`](../app/api/admin/notification-history/route.js), [`app/api/admin/notification-settings/route.js`](../app/api/admin/notification-settings/route.js), [`app/api/admin/analytics/route.js`](../app/api/admin/analytics/route.js), [`app/api/admin/revenue/route.js`](../app/api/admin/revenue/route.js), [`app/api/admin/stats/route.js`](../app/api/admin/stats/route.js), [`app/api/admin/billing/route.js`](../app/api/admin/billing/route.js).

---

## 4. Appointments

Lifecycle endpoints, shared between admin UI and the public booking endpoint above. `POST /api/appointments` is listed under §1 because the public site calls it unauthenticated.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/appointments` | requireAuth | List for caller's shop. `?date&barberId&status&limit&offset`. BARBER auto-scoped to own `barberId`. |
| `GET` | `/api/appointments/[id]` | requireAuth | Read with client + barber + service. `canAccess` enforces shop + barber scope. |
| `PATCH` | `/api/appointments/[id]` | requireAuth | Update `notes`, reschedule (`date` / `time`) — re-runs conflict check, blocks past dates. |
| `DELETE` | `/api/appointments/[id]` | ADMIN, SUPER_ADMIN | Hard delete; defense-in-depth shop scope. |
| `PATCH` | `/api/appointments/[id]/status` | requireAuth (BARBER scoped to own) | Status transition through explicit `TRANSITIONS` map. `COMPLETED` requires `finalPrice`, computes split, atomically updates `Client.totalSpent/visitCount/noShowCount`, fires review-request. `CANCELLED` captures `cancellationReason` + `cancelledBy`, refunds metrics if previously completed, cancels pending notifications. `NOSHOW` increments noShowCount; undo path decrements. |
| `POST` | `/api/appointments/walkin` | ADMIN, SUPER_ADMIN, BARBER | Walk-in flow. Catalog or `customServiceName` (creates hidden `Walk-in` placeholder service). Phoneless walk-ins get `wi-…` placeholder. Creates `COMPLETED` appointment + client metrics in one tx. Audit log on price mismatch. |

Source: [`app/api/appointments/route.js`](../app/api/appointments/route.js), [`app/api/appointments/[id]/route.js`](../app/api/appointments/[id]/route.js), [`app/api/appointments/[id]/status/route.js`](../app/api/appointments/[id]/status/route.js), [`app/api/appointments/walkin/route.js`](../app/api/appointments/walkin/route.js).

---

## 5. Barber self-service

Authenticated barber-only endpoints. Use `payload.barberId` instead of trusting client input.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/barber/me/availability` | requireAuth + barberId | Toggle own `available` boolean. |
| `POST` | `/api/barber/me/break` | requireAuth + barberId | Start an instant break: `{ minutes, label? }`. Computes Istanbul wall-clock, creates one-off `BarberBreak`. |
| `DELETE` | `/api/barber/me/break` | requireAuth + barberId | Cancel today's one-off breaks for this barber. |
| `POST` | `/api/barber/photo` | requireAuth + barberId | Upload own profile photo (max 2 MB). |
| `DELETE` | `/api/barber/photo` | requireAuth + barberId | Delete own profile photo. |
| `GET` | `/api/barber/reviews` | requireAuth + barberId | Own `Review` history + summary (avg, distribution of `barberRating`). |

Source: [`app/api/barber/me/availability/route.js`](../app/api/barber/me/availability/route.js), [`app/api/barber/me/break/route.js`](../app/api/barber/me/break/route.js), [`app/api/barber/photo/route.js`](../app/api/barber/photo/route.js), [`app/api/barber/reviews/route.js`](../app/api/barber/reviews/route.js).

---

## 6. Super-admin

Cross-tenant operations. Every endpoint hard-gates `payload.role === "SUPER_ADMIN"`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/superadmin/shops` | SUPER_ADMIN | All shops + `_count` for barbers/services/appointments/users. |
| `POST` | `/api/superadmin/shops` | SUPER_ADMIN | Create shop + initial ADMIN user atomically. Slug `^[a-z][a-z0-9-]{2,30}$`. Seeds trial via `startTrialFields()`. |
| `GET` | `/api/superadmin/shops/[id]` | SUPER_ADMIN | Shop detail + admin users. |
| `PATCH` | `/api/superadmin/shops/[id]` | SUPER_ADMIN | Edit identity + `status` (`ACTIVE`/`SUSPENDED`), `subscriptionStatus`, `planTier`, `startTrialDays`, `extendDays` (adds to `currentPeriodEndsAt`, flips ACTIVE). |
| `DELETE` | `/api/superadmin/shops/[id]` | SUPER_ADMIN | **Soft delete** — sets `deletedAt` + `status=SUSPENDED`. Hard delete blocked by `Restrict` on `Invoice` / `AuditLog`. |
| `GET` | `/api/superadmin/stats` | SUPER_ADMIN | Platform KPIs (shops, barbers, users, appointments, revenue). |
| `GET` | `/api/superadmin/subscriptions` | SUPER_ADMIN | All shops w/ subscription state + breakdowns by status/tier + MRR estimate (ACTIVE only). |
| `GET` | `/api/superadmin/analytics` | SUPER_ADMIN | 30d platform totals + top-10 shops by event volume. |

Source: [`app/api/superadmin/shops/route.js`](../app/api/superadmin/shops/route.js), [`app/api/superadmin/shops/[id]/route.js`](../app/api/superadmin/shops/[id]/route.js), [`app/api/superadmin/stats/route.js`](../app/api/superadmin/stats/route.js), [`app/api/superadmin/subscriptions/route.js`](../app/api/superadmin/subscriptions/route.js), [`app/api/superadmin/analytics/route.js`](../app/api/superadmin/analytics/route.js).

Note: path segment is `superadmin` (no hyphen), not `super-admin`.

---

## 7. Payments

Provider-agnostic checkout + webhook. `lib/payments/provider.js` is the abstraction layer; iyzico is the only target today and is stubbed (`createCheckout` throws `PaymentNotConfiguredError` → 503).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/payments/checkout` | ADMIN, SUPER_ADMIN | Body `{ planTier, returnUrl }`. Returns `{ url, ref }` for redirect when provider live; **503** with friendly message while stubbed. |
| `POST` | `/api/payments/webhook` | provider signature | Verified via `verifyWebhook`. Idempotent by `(provider, eventId)` PK in `ProcessedWebhookEvent`. Events: `payment.succeeded` → `ACTIVE` + bump `currentPeriodEndsAt` + upsert `Invoice`; `payment.failed` → `PAST_DUE`; `subscription.cancelled` → `CANCELLED`. Unverifiable + unconfigured → silent 200 to suppress retry storms during wiring. |

Source: [`app/api/payments/checkout/route.js`](../app/api/payments/checkout/route.js), [`app/api/payments/webhook/route.js`](../app/api/payments/webhook/route.js).

---

## 8. Cron

Vercel Cron callers. All three share the same auth pattern (`Authorization: Bearer $CRON_SECRET`). In production `CRON_SECRET` is mandatory; in dev a missing secret allows unauthenticated calls so local testing works without env setup. Schedules live in [`vercel.json`](../vercel.json).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/cron/notifications` | Bearer `CRON_SECRET` | Drains `processQueue(20)` + `processReviewQueue(20)` in parallel. |
| `GET` | `/api/cron/billing` | Bearer `CRON_SECRET` | Daily 03:00. `expireTrials()` + `suspendPastDue()`. Returns counts. |
| `GET` | `/api/cron/cleanup-photos` | Bearer `CRON_SECRET` | Weekly Sun 04:00. Lists Cloudinary `makas/barbers/` assets, deletes any whose `public_id` no longer maps to a live `Barber.id`. Skipped if Cloudinary env missing. |

Source: [`app/api/cron/notifications/route.js`](../app/api/cron/notifications/route.js), [`app/api/cron/billing/route.js`](../app/api/cron/billing/route.js), [`app/api/cron/cleanup-photos/route.js`](../app/api/cron/cleanup-photos/route.js).

---

## Conventions

### Auth enforcement

All authenticated handlers follow the same shape:

```js
const payload = await requireAuth(request);
if (!payload) return unauthorized();              // 401
if (!ALLOWED_ROLES.includes(payload.role)) return forbidden();  // 403
```

`requireAuth` (in [`lib/auth.js`](../lib/auth.js)) reads JWT from either `Authorization: Bearer …` or the `makas-token` cookie, verifies signature via `jose`, then checks `tokenVersion` against `User.tokenVersion` (15s in-process cache to skip DB roundtrip). `unauthorized()` and `forbidden()` are tiny helpers that emit `{ error: "Unauthorized" }` / `{ error: "Forbidden" }`.

Role gates are inline `if` checks against `payload.role`. Roles: `SUPER_ADMIN`, `ADMIN`, `RECEPTIONIST`, `BARBER`, `CUSTOMER`. There is no role-permission matrix module — each route enumerates its allowed roles.

Logout, password change, and `DELETE /api/auth/me` increment `User.tokenVersion`, which invalidates every outstanding JWT for that user.

### Multi-tenant filtering

There is no row-level isolation in the DB. Every query in an authenticated handler must include `shopId` in the `where` clause. The standard pattern:

```js
const shopId = payload.role === "SUPER_ADMIN"
  ? new URL(request.url).searchParams.get("shopId")
  : payload.shopId;
if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });
```

`SUPER_ADMIN` has `payload.shopId === null` and must pass `?shopId=` to scope reads/writes; normal roles are pinned to their JWT's `shopId`.

For mutate-by-id endpoints (e.g. delete a barber), a guard helper (`resolveBarber`, `resolveShop`, etc.) does the lookup with `shopId` filter so a forged `id` from another tenant 404s instead of mutating. Mutating endpoints also pass `shopId` to `deleteMany` / `updateMany` as defense-in-depth even when the resolver already checked.

### Standard error shape

`NextResponse.json({ error: "Turkish user-facing message" }, { status })`.

Status codes used:

- `400` — validation failure (most common)
- `401` — `unauthorized()` helper
- `402` — plan-limit hit (only on `POST /api/admin/barbers` when `canCreateBarber` returns false). Payload includes `{ error, limit, current }`.
- `403` — `forbidden()` helper, suspended shop, blocked client
- `404` — resource not found OR cross-tenant access (treated equivalently)
- `409` — conflict: slug dupe, slot taken, illegal status transition, already-reviewed token
- `429` — rate-limit hit; includes `Retry-After` header where the limiter computes one
- `500` — `{ error: "Sunucu hatası" }` after `console.error("[METHOD /path]", err)`
- `503` — payment provider not configured

`P2002` (Prisma unique violation) is caught at write sites and converted to `409`. `P2025` (record not found in `update`) is converted to `404` in super-admin paths.

### Cron auth pattern

Every `/api/cron/*` handler runs the same gate:

```js
const secret = process.env.CRON_SECRET;
const auth   = request.headers.get("authorization");
const isProd = process.env.NODE_ENV === "production";
const unauthorized = isProd
  ? !secret || auth !== `Bearer ${secret}`
  : !!secret && auth !== `Bearer ${secret}`;
if (unauthorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

In production, an unset `CRON_SECRET` fails closed. In dev, an unset secret allows direct curl for local testing.

### Webhook idempotency

`POST /api/payments/webhook` dedupes on `(provider, eventId)` via the `ProcessedWebhookEvent` model:

```js
await prisma.processedWebhookEvent.create({
  data: { provider, eventId: dedupeId },
});
// P2002 → already processed → 200 { duplicate: true }
```

Falls back to `providerInvoiceId` when the provider payload omits `eventId`. State changes are applied inside a transaction so an upsert failure on `Invoice` rolls back the `Shop` update.

### Rate limiting

Implemented in [`lib/rateLimit.js`](../lib/rateLimit.js) (in-memory token bucket — process-local, not shared across serverless instances). `getIp(request)` derives IP from `x-forwarded-for`. Keys are prefix-scoped (`booking:`, `login:`, `events:`, `shop-cover:`, etc.).

Current limits:

| Key prefix | Limit | Window | Routes |
|---|---|---|---|
| `login:` | 10 | 15 min | `POST /api/auth/login` |
| `booking:` | 5 | 10 min | `POST /api/appointments` |
| `leads:` | 3 | 10 min | `POST /api/leads` |
| `review:` | 3 | 5 min | `POST /api/review/[token]` |
| `events:` | 120 | 1 min | `POST /api/events` |
| `shop-profile:` | 20 | 5 min | `PATCH /api/admin/shop` |
| `shop-logo:` | 10 | 5 min | logo POST |
| `shop-cover:` | 10 | 5 min | cover POST |
| `shop-gallery:` | 30 | 5 min | gallery POST |

Cron, payments webhook, and read endpoints are not rate-limited at the API layer (cron uses its own secret; reads rely on `Cache-Control` and Prisma connection pooling). Authenticated mutations beyond the table above are unlimited — relies on auth + role gates.

### Body parsing

Every `request.json()` call that touches user input is either wrapped in `try/catch` returning a 400, or chained with `.catch(() => ({}))` so a malformed body becomes "no fields supplied" and the validator below produces the 400 instead. Image upload routes additionally validate `data:image/*` prefix + max byte length (~2 MB) before calling Cloudinary.

### Caching

Read endpoints used by the public site set short `Cache-Control` headers:

- `/api/availability` — `public, s-maxage=30, stale-while-revalidate=30`
- `/api/barbers`, `/api/services` — `public, s-maxage=300, stale-while-revalidate=60`
- `/api/reviews` — uses Next.js `fetch` `next: { revalidate: 3600 }` against Google Places

Stale-slot risk on `/api/availability` is acceptable because the `POST /api/appointments` transaction re-checks conflicts under `Serializable` isolation before committing.

Most authenticated routes set `export const dynamic = "force-dynamic"` to opt out of static rendering.

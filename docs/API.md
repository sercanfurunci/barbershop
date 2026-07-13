# MAKAS — API Reference

## Conventions

**Base URL:** `https://makas.app` (production) · `http://localhost:3000` (dev)

**Authentication:**
- `public` — no auth required
- `withAuth` — any authenticated user; send `Authorization: Bearer <token>` or the `makas_token` HttpOnly cookie
- `withRole([...])` — restricted to listed roles (SUPER_ADMIN, ADMIN, BARBER, RECEPTIONIST, CUSTOMER)

**Error shape:**
```json
{ "error": "Human-readable message", "code": "OPTIONAL_ERROR_CODE" }
```

**Pagination:** Pass `?limit=N&offset=N`. No meta envelope on internal routes. The versioned `/api/v1/` routes wrap in `{ data, meta: { version, ts } }`.

**Rate limiting:** Auth endpoints: 10 req/15 min per IP. Booking: 5 req/10 min per IP.

---

## Auth — `/api/auth/`

### `POST /api/auth/login`
**Auth:** public · **Rate limit:** 10/15 min

Log in with email/username and password.

**Request:**
```json
{
  "email": "admin@shop.com",
  "password": "secret",
  "expectedRole": "ADMIN"    // optional — returns 403 if role doesn't match
}
```

**Response:** `200`
```json
{
  "token": "<jwt>",
  "user": {
    "id": "...", "email": "...", "role": "ADMIN",
    "shopId": "...", "shop": { "id": "...", "slug": "...", "name": "...", "status": "ACTIVE" },
    "barber": null
  }
}
```

---

### `POST /api/auth/register`
**Auth:** public

Register a new CUSTOMER account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret",
  "name": "Ali Yılmaz",
  "phone": "5321234567"
}
```

**Response:** `201` — same shape as login response.

---

### `GET /api/auth/me`
**Auth:** withAuth

Return the current user's profile.

**Response:** `200` — user object with shop and barber relations.

---

### `POST /api/auth/logout`
**Auth:** withAuth

Invalidate the current token (increments `tokenVersion` for the device).

**Response:** `204`

---

### `POST /api/auth/logout-all`
**Auth:** withAuth

Invalidate all tokens for this user (increments `tokenVersion`).

**Response:** `204`

---

### `POST /api/auth/refresh`
**Auth:** withAuth

Issue a new token before the current one expires.

**Response:** `200` `{ "token": "<new-jwt>" }`

---

### `POST /api/auth/forgot-password`
**Auth:** public

Send a password-reset email via Resend. If `RESEND_API_KEY` is unset, logs the link to console (dev mode).

**Request:** `{ "email": "user@example.com" }`

**Response:** `200` `{ "ok": true }`

---

### `POST /api/auth/reset-password`
**Auth:** public

Set a new password using the token from the reset email.

**Request:** `{ "token": "...", "password": "newSecret" }`

**Response:** `200` `{ "ok": true }`

---

### `POST /api/auth/change-password`
**Auth:** withAuth

Change password for the authenticated user.

**Request:** `{ "currentPassword": "...", "newPassword": "..." }`

**Response:** `200` `{ "ok": true }`

---

### `PUT /api/auth/profile`
**Auth:** withAuth

Update the authenticated user's display name, phone, birthday, or avatar.

**Request:** `{ "displayName": "...", "phone": "...", "birthday": "YYYY-MM-DD", "avatarUrl": "..." }`

**Response:** `200` — updated user object.

---

### `GET /api/auth/demo`
**Auth:** public (demo only)

Auto-login as the demo shop admin. Uses `DEMO_EMAIL` / `DEMO_PASSWORD` env vars.

**Response:** `200` — login response with demo credentials.

---

## Admin — `/api/admin/`

All admin endpoints require `withRole(['ADMIN', 'SUPER_ADMIN'])` unless noted.

### `GET /api/admin/stats`
**Auth:** withRole(ADMIN, SUPER_ADMIN, RECEPTIONIST, BARBER)

Aggregated business stats for a date range, comparing to prior period.

**Query params:** `?from=YYYY-MM-DD&to=YYYY-MM-DD&shopId=<id>` (shopId only for SUPER_ADMIN)

**Response:**
```json
{
  "current":  { "revenue": 0, "shopAmount": 0, "barberAmount": 0, "appointmentCount": 0, "completedCount": 0, "walkInCount": 0, "newClientCount": 0 },
  "previous": { /* same */ },
  "changes":  { "revenue": 12.5, "appointmentCount": -3.0 /* % change */ }
}
```

---

### `GET /api/admin/barbers`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

List all barbers for the shop, including working hours and service assignments.

**Response:** `200` — array of barber objects.

---

### `POST /api/admin/barbers`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

Create a new barber. Inherits shop's `defaultCommissionRate`.

**Request:**
```json
{
  "nameTr": "Mehmet", "nameEn": "Mehmet",
  "titleTr": "Kuaför", "titleEn": "Barber",
  "bioTr": "...", "bioEn": "...",
  "avatar": "https://res.cloudinary.com/...",
  "color": "#CC1A1A",
  "yearsExp": 5,
  "specialties": ["fade", "beard"],
  "paymentType": "PERCENTAGE",
  "commissionRate": 60
}
```

---

### `GET /api/admin/clients`
**Auth:** withRole(ADMIN, SUPER_ADMIN, RECEPTIONIST)

Paginated client list with lifetime stats.

**Query params:** `?search=name_or_phone&limit=50&offset=0&blocked=false`

**Response:** `200` — array of client objects with `visitCount`, `totalSpent`, `lastVisitAt`.

---

### `GET /api/admin/shop`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

Return full shop settings object.

### `PATCH /api/admin/shop`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

Update shop settings (name, address, gallery, social links, booking mode, amenities, etc.).

---

### `GET /api/admin/services`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

List all services for the shop.

### `POST /api/admin/services`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

Create a service. Fields: `nameTr`, `nameEn`, `descTr`, `descEn`, `duration` (minutes), `price` (null = on-request), `category` (CUTS|BEARD|COMBO|PREMIUM), `popular`, `icon`.

---

### `GET /api/admin/notification-settings`
### `PATCH /api/admin/notification-settings`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

Read or update the shop's Netgsm credentials and notification template overrides.

---

### `GET /api/admin/revenue`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

Revenue breakdown by barber and service, with date range filter.

### `GET /api/admin/analytics`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

Conversion funnel and analytics event data.

### `GET /api/admin/reviews`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

List internal customer reviews for the shop.

### `GET /api/admin/notification-history`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

List `NotificationJob` rows with status and timestamps.

### `GET /api/admin/holidays`
### `POST /api/admin/holidays`
### `DELETE /api/admin/holidays/[id]`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

Manage shop-wide and barber-specific holiday dates.

### `GET /api/admin/working-hours`
### `PATCH /api/admin/working-hours`
**Auth:** withRole(ADMIN, SUPER_ADMIN)

Read/update working hours for a barber (minutes from midnight).

---

## Barber — `/api/barber/`

### `GET /api/barber/me`
**Auth:** withRole(BARBER)

Return the authenticated barber's full profile with working hours and breaks.

### `PATCH /api/barber/me`
**Auth:** withRole(BARBER)

Update the barber's own profile (bio, avatar, breaks, working hours).

### `POST /api/barber/photo`
**Auth:** withRole(BARBER)

Upload a profile photo (multipart or base64). Stored in Cloudinary.

### `GET /api/barber/reviews`
**Auth:** withRole(BARBER)

List reviews submitted for this barber.

---

## Customer — `/api/customer/`

All endpoints require `withAuth` and are scoped to the authenticated CUSTOMER.

### `GET /api/customer/appointments`
List the customer's appointment history across all shops they've booked with (matched by clientId or phone).

**Response:** `200` — array of appointments with shop, barber, and service fields.

### `GET /api/customer/profile`
### `PATCH /api/customer/profile`
Read or update the customer's profile (name, phone, birthday, gender, notification preferences).

### `GET /api/customer/stats`
Aggregate visit count and total spend for the authenticated customer.

### `GET /api/customer/favorites`
### `POST /api/customer/favorites`
### `DELETE /api/customer/favorites/[shopId]`
Manage saved shop favorites (synced to `CustomerFavorite` table).

### `GET /api/customer/barber-favorites`
### `POST /api/customer/barber-favorites`
### `DELETE /api/customer/barber-favorites/[barberId]`
Manage saved barber favorites.

### `GET /api/customer/loyalty`
Return loyalty point balance and transaction history for all shops.

### `GET /api/customer/reviews`
List reviews submitted by the authenticated customer.

---

## Appointments — `/api/appointments/`

### `POST /api/appointments`
**Auth:** public (rate limited 5/10 min per IP)

Create a new booking. This is the primary customer-facing booking endpoint.

**Request:**
```json
{
  "shopId": "...",
  "name": "Ali Yılmaz",
  "phone": "5321234567",
  "email": "ali@example.com",
  "serviceId": "...",
  "barberId": "...",
  "date": "2026-07-15",
  "time": "10:00",
  "notes": "optional",
  "source": "ONLINE"
}
```

**Response:** `201` — created appointment object.

**Error codes:**
- `SLOT_TAKEN` — the time slot is already booked
- `BARBER_UNAVAILABLE` — barber is on holiday or outside working hours
- `SHOP_SUSPENDED` — shop subscription is suspended
- `BOOKING_LIMIT_REACHED` — plan's monthly booking limit exceeded

---

### `GET /api/appointments`
**Auth:** withAuth (ADMIN, BARBER, SUPER_ADMIN)

List appointments with optional filters. BARBERs are automatically scoped to their own.

**Query params:** `?date=YYYY-MM-DD&barberId=...&status=PENDING&limit=200&offset=0`

**Response:** `200` — array of appointment objects with client, barber, and service.

---

### `GET /api/appointments/[id]`
**Auth:** withAuth

Get a single appointment. BARBERs can only access their own.

### `PATCH /api/appointments/[id]`
**Auth:** withAuth

Reschedule (`date`, `time`) or update `notes` or `price`.

### `DELETE /api/appointments/[id]`
**Auth:** withAuth

Cancel an appointment. Requires `cancellationReason`.

### `PATCH /api/appointments/[id]/status`
**Auth:** withAuth

Transition appointment status. Allowed transitions depend on current status and caller role.

On `COMPLETED` transition: accepts `grossAmount`, `tipAmount`, `paymentMethod` — computes barber/shop split and creates a `ReviewRequest`.

### `POST /api/appointments/walkin`
**Auth:** withRole(ADMIN, BARBER, RECEPTIONIST)

Record a walk-in customer. Accepts `customServiceName` to skip the service catalog.

---

## Public — `/api/public/`

Unauthenticated read endpoints for the booking UI.

### `GET /api/public/barbers?shopId=...`
List active barbers for a shop with available services.

### `GET /api/public/appointments?shopId=...&barberId=...&date=YYYY-MM-DD`
List already-booked time slots (barberId + date) so the booking UI can show availability. Returns only `time` and `duration` — no client PII.

---

## Shops — `/api/shops/`

### `GET /api/shops`
**Auth:** public

Paginated shop directory with filters.

**Query params:** `?city=İstanbul&shopType=male&lat=41.0&lng=29.0&radius=5&sort=rating&limit=20&offset=0`

**Response:** `200` — array of shops with aggregate stats.

### `GET /api/shops/[slug]`
**Auth:** public

Full shop detail for the public booking page: shop info, barbers, services, working hours, gallery, review summary.

### `GET /api/shops/[slug]/reviews`
**Auth:** public

Paginated list of approved internal reviews for a shop.

**Query params:** `?limit=10&offset=0`

### `GET /api/shops/first-available`
**Auth:** public

Find the next available slot across barbers for a given shop and service.

**Query params:** `?shopId=...&serviceId=...&barberId=...&from=YYYY-MM-DD`

---

## Availability — `/api/availability`

### `GET /api/availability`
**Auth:** public

Return available time slots for a barber on a given date, accounting for working hours, breaks, holidays, and existing bookings.

**Query params:** `?barberId=...&date=YYYY-MM-DD&duration=30`

**Response:** `200` `{ "slots": ["09:00", "09:30", "10:00", ...] }`

---

## Check-in — `/api/check-in`

### `POST /api/check-in`
**Auth:** public

Mark an appointment as checked in by scanning the QR code token.

**Request:** `{ "token": "<checkInToken>" }`

**Response:** `200` — appointment summary.

---

## Review — `/api/review/`

### `GET /api/review/[token]`
**Auth:** public

Return the pending review request for the given SMS token (customer name, shop, barber, appointment summary).

### `POST /api/review/[token]`
**Auth:** public

Submit a review.

**Request:**
```json
{
  "shopRating": 5,
  "barberRating": 5,
  "comment": "Çok iyi!"
}
```

**Response:** `201` — If rating ≥ 4 and shop has `googleReviewUrl` set, response includes `{ "googleReviewUrl": "..." }` so the client can prompt for a Google review.

---

## Leads — `/api/leads`

### `POST /api/leads`
**Auth:** public

Submit an inquiry from the SaaS marketing landing page.

**Request:** `{ "businessName": "...", "name": "...", "phone": "...", "email": "...", "message": "..." }`

**Response:** `201` `{ "ok": true }`

---

## Super Admin — `/api/superadmin/`

All endpoints require `withRole(['SUPER_ADMIN'])`.

### `GET /api/superadmin/shops`
List all shops with subscription status, plan tier, and usage stats.

### `GET /api/superadmin/shops/[id]`
### `PATCH /api/superadmin/shops/[id]`
Read or update a specific shop (plan, subscription status, feature overrides, custom domain).

### `GET /api/superadmin/stats`
Platform-wide aggregated stats (total shops, bookings, revenue).

### `GET /api/superadmin/analytics`
Platform-wide analytics events breakdown.

### `GET /api/superadmin/subscriptions`
List subscriptions across all shops (for billing management).

---

## Versioned API — `/api/v1/`

For stable integrations (AI channels, third-party tools). Business logic is identical to internal routes but:

- Response is wrapped: `{ "data": {...}, "meta": { "version": "1", "ts": "ISO-8601" } }`
- Errors include `"code"` field always
- Accepts all `BookingSource` values including `WHATSAPP`, `AI_CHAT`, `VOICE`, etc.

### `POST /api/v1/appointments`
**Auth:** optional (same auth handling as `POST /api/appointments`)

Create a booking. Identical parameters to the internal endpoint. Use this endpoint for all integration and AI channel bookings.

---

## Cron Jobs — `/api/cron/`

Protected by `Authorization: Bearer <CRON_SECRET>`. Invoked by Vercel Cron on schedule.

| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/notifications` | `0 9 * * *` | Process pending `NotificationJob` rows (reminders) |
| `/api/cron/billing` | `0 3 * * *` | Subscription lifecycle checks (trial expiry, grace period) |
| `/api/cron/shop-metrics` | `0 0 * * *` | Upsert daily `ShopMetric` rows for all active shops |
| `/api/cron/cleanup-photos` | `0 4 * * 0` | Remove orphaned Cloudinary assets |
| `/api/cron/birthdays` (in billing dir) | triggered manually | Birthday campaign dispatch |

---

## Health — `/api/health`

### `GET /api/health`
**Auth:** public

Returns system health. Suitable for uptime monitors and load balancer probes.

**Response:**
```json
{
  "status": "ok",
  "checks": {
    "database": { "ok": true, "latencyMs": 12 },
    "redis":    { "ok": true, "latencyMs": 4 }
  },
  "version": "0.1.0",
  "uptime": 3600
}
```

`status` is `"ok"` (200), `"degraded"` (200), or `"down"` (503).
Redis check is omitted when `UPSTASH_REDIS_REST_URL` is not set.

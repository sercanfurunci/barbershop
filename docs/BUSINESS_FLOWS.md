# Makas — Business Flows

End-to-end traces of the workflows that drive the product. Each flow lists its
trigger, the steps it runs, the side effects it leaves on the database, and the
failure modes worth knowing about. Money columns are kuruş (TRY minor units)
unless noted. Data model reference: [`docs/DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md).

Conventions:

- All times are stored as `"YYYY-MM-DD"` + `"HH:MM"` strings in Europe/Istanbul.
  `lib/utils` provides `todayStr()` / `nowMinutes()` to avoid UTC drift.
- "Public" = unauthenticated; "Admin" = `ADMIN` / `RECEPTIONIST` JWT;
  "Barber" = `BARBER` JWT scoped to one barber row; "Super-admin" = `SUPER_ADMIN`
  with `shopId = null`.
- Side effects listed in order. A bullet inside a transaction is part of the
  same atomic write.

---

## 1. Public Booking (Customer-Facing)

**Trigger:** Visitor lands on `/[shopSlug]` or `https://<customDomain>/`.

### Steps

1. Edge routing
   - [`proxy.js:60`](../proxy.js) (Next 16's middleware, renamed from `middleware.js`)
     reads the `Host` header.
   - Platform hosts (`makas.tech`, `makas.furunci.tech`, `*.vercel.app`,
     `localhost`) pass through.
   - Any other host is looked up against `Shop.customDomain` with a 5-minute
     in-process cache; on hit, the request is `NextResponse.rewrite`-ed to
     `/<slug>/<path>`.
   - Matcher excludes `/api/*` and static assets so the body-scoped APIs aren't
     touched.

2. Landing render — [`app/[shopSlug]/page.js:1`](../app/[shopSlug]/page.js)
   - Server component, `revalidate = 300`.
   - Resolves the shop via the React-cached `resolveShopBySlug()` in
     [`lib/shop.js:6`](../lib/shop.js) — filters `deletedAt: null`.
   - Below-fold sections (`Services`, `Barbers`, `Gallery`, `Testimonials`,
     `FAQ`, `SalonInfo`) are `next/dynamic` for bundle splitting.
   - `BookingCard` opens the booking flow; `StickyActionBar` provides the
     mobile CTA.

3. Booking flow UI — [`components/booking/BookingFlow.js`](../components/booking/BookingFlow.js)
   - 5 steps on mobile (Service → Barber → Date → Time → Details).
   - Desktop collapses Date + Time into one step.
   - Each transition fires `track(shopId, "...")` → POST `/api/events` →
     `AnalyticsEvent` row.
   - The "any barber" option resolves to a concrete `barberId` inside
     `TimeSelect` / `DateTimeSelect` based on availability. The form rejects the
     submit if it is still `"any"`
     ([`components/booking/Confirmation.js:71`](../components/booking/Confirmation.js)).

4. Customer fills phone/name/email and submits — POST `/api/appointments`
   (NB: there is **no** `/api/shops/[slug]/appointments` route; bookings hit the
   shared endpoint with `shopId` in the body).
   - [`app/api/appointments/route.js:83`](../app/api/appointments/route.js)
   - Per-IP rate limit: 5 POSTs / 10 min.
   - Phone normalised to a 10-digit Turkish mobile; name 2–100 chars; email
     regex.
   - Date must be `>= todayStr()`; if same day, time must be `> nowMinutes()`.
   - Parallel preload of `shop`, `service`, `barber`, `BarberService` junction,
     `Client` (via `@@unique([shopId, phone])`), and the barber's junction count.
   - Subscription gate: `canAcceptPublicBookings(shop)` in
     [`lib/subscription.js:25`](../lib/subscription.js) — booking is allowed
     only when `subscriptionStatus ∈ {TRIAL, ACTIVE, PAST_DUE}` **and**
     `Shop.status !== "SUSPENDED"`.
   - Barber/service eligibility: if any `BarberService` rows exist for the
     barber, the junction must include the service; if zero, every service is
     allowed (no admin UI maintains the junction yet — explicit fallback in
     [`route.js:170`](../app/api/appointments/route.js)).
   - Spam guard: existing client may have at most 2 active upcoming
     appointments; blocked client → 403.
   - `validateBookingWindow()` in [`lib/booking.js:16`](../lib/booking.js)
     checks day-of-week working hours, breaks, and holidays (both
     barber-specific and shop-wide).
   - `prisma.$transaction({ isolationLevel: "Serializable" })`:
     - Re-fetches non-cancelled appointments and overlaps the requested window;
       throws `SLOT_TAKEN` on conflict.
     - Upserts the `Client` (by `shopId_phone`).
     - Creates `Appointment` with
       `status = shop.autoConfirmBookings ? "CONFIRMED" : "PENDING"` and
       `source = "ONLINE"`.

5. Notification queueing (after the response is sent, non-blocking)
   - `queueNotifications(appointmentId, "CREATED")` in
     [`lib/notifications.js:80`](../lib/notifications.js).
   - Reads `NotificationSettings` for the shop; for each enabled channel
     (`SMS` / `WHATSAPP`) creates a `NotificationJob` with an immediate
     `scheduledFor`, after dedup against existing PENDING / PROCESSING / SENT
     jobs for the same `(appointmentId, channel, event)`.
   - If `reminder48h` / `reminder3h` / `followupEnabled` are on for this shop,
     they are **not** queued here — they only fire when `CONFIRMED` is queued
     by the status route (see flow 3) or, in the case of follow-up, when the
     appointment completes. There is no separate REMINDER fan-out today, so a
     PENDING-but-auto-confirmed = false booking has no reminders until the
     status flips.

6. Confirmation screen — `Confirmation.js` renders the success state, exposes
   `googleCalendarUrl()` from [`lib/calendar.js`](../lib/calendar.js) and an ICS
   download.

### Side effects (success path)

- `Client` upsert: `name`, `phone`, optional `email` set/updated.
- `Appointment` insert with `price = service.price` (snapshot), `duration =
  service.duration`, `source = "ONLINE"`.
- 0–2 `NotificationJob` rows (one per enabled channel), all `PENDING`.
- 0+ `AnalyticsEvent` rows from each step's `track()` call.

### Failure modes

| Symptom | Cause | Where |
|---|---|---|
| 429 with `Retry-After` | IP rate limit | `route.js:88` |
| 400 "Eksik alanlar var" | Missing field | `route.js:99` |
| 400 phone / email / date / time format | Validation | `route.js:104-141` |
| 403 "Bu numara ile randevu oluşturulamaz." | `Client.blocked = true` | `route.js:175` |
| 403 "Bu salon şu an çevrimiçi randevu almıyor." | `subscriptionStatus ∈ {SUSPENDED, CANCELLED}` or shop hard-suspended | `route.js:164` |
| 404 "Salon bulunamadı" | Shop missing or `deletedAt` set | `route.js:163` |
| 409 "Seçilen berber bu hizmeti vermiyor." | Junction exists but doesn't include service | `route.js:170` |
| 409 "Berberin çalışma saatleri tanımlı değil." | No `WorkingHours` row | `lib/booking.js:32` |
| 409 "Bu gün tatil: ..." | `Holiday` row matches date | `lib/booking.js:29` |
| 409 "Seçilen saat çalışma saatleri dışında." | Outside `monStart`/`monEnd` etc. | `lib/booking.js:40` |
| 409 "Bu saat berberin mola aralığına denk geliyor." | Overlap with `BarberBreak` | `lib/booking.js:50` |
| 409 "Bu saat dilimi dolu..." | Slot raced into a conflict inside the serializable tx | `route.js:248` |
| 429 "Bu telefon numarasıyla zaten 2 aktif randevunuz..." | Spam guard | `route.js:187` |
| Slow page when shop has many barbers/services | `revalidate = 300` mitigates; no `ISR` per-tenant cache invalidation when admin edits | landing page |

---

## 2. Walk-in Registration

**Trigger:** Admin/barber records a walk-in via dashboard. UI:
`components/admin/WalkInModal.js` (POSTs to `/api/appointments/walkin`).

### Steps — [`app/api/appointments/walkin/route.js:38`](../app/api/appointments/walkin/route.js)

1. `requireAuth` → role must be `ADMIN`, `SUPER_ADMIN`, or `BARBER`. Barbers
   may only walk-in for themselves.
2. Validation:
   - Name 2–100 chars.
   - `barberId` required.
   - Either `serviceId` or `customServiceName` (+ explicit `duration` 5–480
     min).
   - `finalPrice` 0–100000 (kuruş scale enforced at app layer).
   - `tipAmount` 0–10000.
   - `paymentMethod` ∈ `{CASH, CARD, TRANSFER}`; defaults to `CASH`.
3. Resolves the `Barber`; enforces shop isolation and `available: true`.
4. Resolves service:
   - Catalog pick → ensures `Service.shopId === shopId`.
   - Custom service → upserts a per-shop hidden placeholder Service with
     `nameTr = "Walk-in"`, `active: false`; stores the user-entered label in
     `Appointment.customServiceName`.
5. Phone keying:
   - Valid TR mobile → 10-digit; otherwise placeholder `wi-<ts>-<rand>` to
     satisfy the `@@unique([shopId, phone])` constraint while letting anonymous
     visits coexist.
6. `splitRevenue(finalPrice, barber)` — local copy of the same helper in the
   status route; for `FIXED` salary barbers the whole amount goes to the shop,
   otherwise split by `commissionRate`.
7. `validateBookingWindow` for the walk-in slot at "now" through `now +
   service.duration`.
8. `prisma.$transaction`:
   - Re-checks slot overlap against same barber/date, excluding CANCELLED /
     NOSHOW.
   - Upserts the `Client`. On update: `totalSpent += finalPrice + tipAmount`,
     `visitCount += 1`, `lastVisitAt = now`. On create: same values
     initialised.
   - Inserts the `Appointment` with `status = "COMPLETED"`, `source =
     "WALK_IN"`, `isWalkIn = true`, `grossAmount`, `barberAmount`, `shopAmount`,
     `tipAmount`, `paymentMethod`, `completedAt = now`.
9. Post-transaction:
   - `createReviewRequest(appointment.id)` — skipped for `wi-…` placeholder
     phones because Netgsm would reject them.
   - If catalog service AND `finalPrice !== service.price`, writes an
     `AuditLog` with action `"walkin_price_mismatch"`. **This is the only
     business write that creates an `AuditLog` row anywhere in the API today.**

### Side effects (success path)

- `Client` upsert + lifetime metrics bumped.
- `Appointment` (COMPLETED, WALK_IN, with revenue split).
- 0–1 `ReviewRequest` (PENDING) — see flow 4.
- 0–1 `AuditLog` (price mismatch only).

### Failure modes

| Symptom | Cause |
|---|---|
| 400 validation message | Missing/invalid field |
| 403 forbidden | Barber walking in for someone else; cross-shop access |
| 404 berber/hizmet bulunamadı | FK miss |
| 409 "Bu berber şu an randevu kabul etmiyor." | `barber.available = false` |
| 409 "Bu saatte bu berbere ait başka bir randevu var." | Slot conflict |
| 403 "Bu müşteri engellenmiş" | `Client.blocked = true` |
| Silent — no review request | Phone is `wi-…` placeholder (intentional) |

Note: walk-ins re-implement `splitRevenue` instead of importing the status
route's copy. Comment at [`route.js:13`](../app/api/appointments/walkin/route.js)
flags this — kept duplicated until a third caller appears.

---

## 3. Appointment Status Lifecycle

**Trigger:** PATCH `/api/appointments/[id]/status` from the admin/barber
dashboard. Endpoint:
[`app/api/appointments/[id]/status/route.js:35`](../app/api/appointments/[id]/status/route.js)

### Allowed transitions

```
PENDING     → CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NOSHOW
CONFIRMED   → PENDING, IN_PROGRESS, COMPLETED, CANCELLED, NOSHOW
IN_PROGRESS → CONFIRMED, COMPLETED, CANCELLED
COMPLETED   → CANCELLED                                (refund path)
CANCELLED   → PENDING, CONFIRMED                       (re-open)
NOSHOW      → PENDING, CONFIRMED                       (undo)
```

Anything else → 409 with explicit "Geçersiz durum geçişi" body. Same-status
PATCH is a 200 no-op (idempotent).

Auth gate: shop isolation enforced for ADMIN/RECEPTIONIST; BARBER may only
PATCH their own appointments.

### Side effects per transition

**→ COMPLETED** (requires `finalPrice` in body; optional `tipAmount`,
`paymentMethod`):
- `splitRevenue()` computes `barberAmount` / `shopAmount` from `paymentType`
  and `commissionRate` (FIXED-salary barbers → the whole `finalPrice` goes to
  `shopAmount`).
- Transaction:
  - Conditional `updateMany` with `status: { not: "COMPLETED" }` — guards
    against the double-click race that would otherwise stack
    `Client.totalSpent` twice.
  - Updates `Client.totalSpent += finalPrice + tipAmount`,
    `visitCount += 1`, `lastVisitAt = now`.
  - If previous status was `NOSHOW`, decrements `Client.noShowCount`.
- After tx: `createReviewRequest(id)` (best-effort, swallow errors).
- No SMS is queued by this branch — review SMS is dispatched by the cron's
  `processReviewQueue` two hours after `ReviewRequest` insertion.

**→ CANCELLED** (`cancellationReason ≤ 500 chars`, `cancelledBy ∈
{client, shop, barber}`):
- Sets `cancelledAt = now`, `cancellationReason`, `cancelledBy`.
- If previous status was `COMPLETED`, refunds `Client.totalSpent -=
  grossAmount + tipAmount`, `visitCount -= 1`.
- `cancelPendingJobs(id)` flips every still-`PENDING` `NotificationJob` to
  `CANCELLED` so a customer who cancels seconds after booking doesn't get a
  "confirmed" SMS racing the cancellation.
- `queueNotifications(id, "CANCELLED")` — immediate SMS/WA per shop settings.

**→ NOSHOW:**
- Single transaction: set status + `Client.noShowCount += 1`.

**→ PENDING / CONFIRMED from NOSHOW (undo):**
- Status update + `Client.noShowCount -= 1`.
- If target is `CONFIRMED`, `queueNotifications(id, "CONFIRMED")` runs.

**→ CONFIRMED (plain, from PENDING/IN_PROGRESS):**
- Status update, then `queueNotifications(id, "CONFIRMED")`. The
  `CONFIRMED` queue call also seeds `REMINDER_48H`, `REMINDER_3H`, and
  `FOLLOWUP` jobs **only** if their toggles in `NotificationSettings` are on
  and `getScheduledFor` returns a non-null timestamp
  ([`lib/notifications.js:49-77`](../lib/notifications.js)).

**Plain transitions with no side effects:** anything not covered above just
updates the status column.

### Audit log

`AuditLog` rows are **not** written by the status route. The data model
describes status changes / reschedules / deletes as audit-eligible, but the
only API write that lands a row today is `walkin_price_mismatch`
(see flow 2). Treat this as a known gap if you need a full audit trail —
admin-initiated cancels and reschedules currently leave only the timestamp
columns on `Appointment` (`cancelledAt`, `cancellationReason`, `cancelledBy`)
behind.

### Failure modes

| Symptom | Cause |
|---|---|
| 400 "Geçersiz durum" | `status` not in `VALID_STATUSES` |
| 400 "Geçerli bir fiyat girin..." / "Geçersiz bahşiş" | COMPLETED body invalid |
| 403 forbidden | Cross-shop or cross-barber access |
| 404 "Randevu bulunamadı" | Wrong id |
| 409 "Geçersiz durum geçişi: X → Y" | Not in `TRANSITIONS[X]` |
| Silent double-completion → no stacked totals | `updateMany` race guard returns `{ raced: true }` |

---

## 4. Review Funnel

Two related entities, distinct roles:
- **`ReviewRequest`** — dispatch lifecycle (PENDING → SENT/SKIPPED → REVIEWED).
  One per appointment.
- **`Review`** — the customer-submitted content (shopRating + barberRating +
  optional comment). One per appointment (unique on `appointmentId`).

The dispatch tracker carries the unique token used in the SMS/WhatsApp link.
The Review row carries the data the storefront actually renders.

**Trigger:** Any path that lands an appointment in `COMPLETED` —
`createReviewRequest(appointmentId)` is called from:
- [`app/api/appointments/[id]/status/route.js`](../app/api/appointments/[id]/status/route.js) (PATCH → COMPLETED)
- [`app/api/appointments/walkin/route.js`](../app/api/appointments/walkin/route.js) (skipped for `wi-…` placeholder phones)

### Steps

1. `createReviewRequest(id)` in
   [`lib/reviews.js`](../lib/reviews.js):
   - Aborts if no `client.phone` or if a `ReviewRequest` already exists for
     this appointment.
   - Inserts `ReviewRequest` (PENDING, random token, customer snapshot).

2. Cron sweep — [`app/api/cron/notifications/route.js`](../app/api/cron/notifications/route.js)
   runs `processReviewQueue(20)` alongside `processQueue(20)` (Vercel Cron
   schedule `0 9 * * *`).
   - Selects up to 20 `PENDING` requests whose `createdAt` is older than
     2 hours.
   - If `Shop.reviewReminderEnabled === false` (per-shop opt-out toggled
     from admin settings) → mark `SKIPPED` so it never retries.
   - If `notificationSettings` is missing or both `smsEnabled` and
     `waEnabled` are false → mark `SKIPPED` so it never retries.
   - **WhatsApp first** when `waEnabled`, otherwise SMS. Same message body
     in both channels:
     `Merhaba {first}, {barber} ile randevunuz nasıldı? Deneyiminizi 1
     dakikada paylaşın: <BASE_URL>/review/<token>`.
   - Success → `status = "SENT"`, `sentAt = now`. Error → counter bumped,
     row stays `PENDING` for next cron tick (no max-attempts gate).

3. Customer taps the link → `/review/[token]` →
   GET `/api/review/[token]`.
   - 409 if the appointment is not COMPLETED (defensive — link only fires
     post-completion, but a manual hit is rejected cleanly).
   - 200 `{ alreadyReviewed: true }` if `appointment.reviewed === true` OR
     `ReviewRequest.status === REVIEWED`.

4. Customer fills the 3-step form (shop rating → barber rating → optional
   comment) and submits → POST `/api/review/[token]`.
   - 3 attempts per IP per 5 minutes.
   - Both ratings validated 1–5.
   - Re-checks `appointment.status === COMPLETED && appointment.reviewed
     === false` (defense in depth — the unique index on
     `Review.appointmentId` is the actual guard against double-submit).
   - **Single transaction**:
     - INSERT `Review { shopRating, barberRating, comment, customerId }`.
     - UPDATE `Appointment.reviewed = true`.
     - UPDATE `ReviewRequest { status: REVIEWED, rating, comment, reviewedAt }`.
     - UPDATE `Shop` aggregates via running average:
       `avgRating = ((avgRating * totalReviews) + shopRating) / (totalReviews + 1)`.
     - UPDATE `Barber` aggregates the same way using `barberRating`.
   - P2002 (unique violation on appointmentId) → 409 cleanly.
   - Response: `redirectToGoogle: shopRating >= 4 && Shop.googleReviewUrl`.
     Rating ≤3 → no Google CTA, feedback stays internal. No Place-ID
     constructor or env fallback — the shop must paste their own Google
     review link in admin settings (validated hostname `*.google.com`).

5. Public render — the tenant storefront
   ([`app/[shopSlug]/page.js`](../app/[shopSlug]/page.js)) SSRs the first
   20 Reviews + star distribution + `Shop.avgRating` / `totalReviews`.
   [`components/landing/ReviewsSection.js`](../components/landing/ReviewsSection.js)
   re-fetches via GET `/api/shops/[slug]/reviews` when the user changes
   filter (1–5 stars) or sort (newest/oldest), and paginates via skip.

6. Admin / barber surfaces — both read from the `Review` model. There is
   **no publish/reject moderation**: a Review is visible the moment it is
   submitted. Admin view also shows the `ReviewRequest` pipeline counts
   (PENDING / SENT / REVIEWED / SKIPPED) so ops can spot delivery issues.

### Failure modes

| Symptom | Cause |
|---|---|
| No `ReviewRequest` ever created | Walk-in with placeholder phone, or client has no phone |
| Stuck in PENDING forever | `notificationSettings` missing; or send error keeps re-failing each cron tick (no max-attempts) |
| 409 "Zaten değerlendirildi" | Customer hit the link twice, or unique violation on `Review.appointmentId` |
| 409 "Randevu henüz tamamlanmadı" | Token reused from a session where appt was bumped back from COMPLETED |
| Rating ≥4 doesn't redirect | `Shop.googleReviewUrl` is null — admin hasn't pasted a Google review link in settings yet |
| All requests SKIPPED for one shop | Admin toggled `Shop.reviewReminderEnabled = false` |
| Shop / Barber aggregates drift | Concurrent submissions in the same ms could race — running average is computed in the same tx with a SELECT-then-UPDATE; volume makes the window negligible. Backfill: scan `Review` and recompute |

---

## 5. Notification Dispatch

**Trigger:** Any of these inserts a `NotificationJob`:
- POST `/api/appointments` → `queueNotifications(id, "CREATED")`
- PATCH `/api/appointments/[id]/status` → `queueNotifications(id, "CONFIRMED")` or `"CANCELLED"`

The `walkin` route does **not** queue notifications — walk-ins are completed
immediately, and the customer is in the shop.

### Producer — [`lib/notifications.js:80`](../lib/notifications.js)

For each enabled channel (`SMS` if `settings.smsEnabled`, `WHATSAPP` if
`settings.waEnabled`):

1. Build the message via `buildMessage(event, settings, appt)`:
   - Templates per event:
     `tplCreated` / `tplConfirmed` / `tplCancelled` /
     `tplReminder48h` / `tplReminder3h` / `tplFollowup`.
   - Fallback to Turkish defaults in `DEFAULTS` at top of the file.
   - Variable interpolation: `{{name}}` `{{fullName}}` `{{service}}`
     `{{barber}}` `{{date}}` `{{time}}` `{{shop}}`. Date formatted as
     "12 Haziran" via `formatDateTr()`.
2. Compute `scheduledFor`:
   - CREATED / CONFIRMED / CANCELLED → immediate.
   - REMINDER_48H → 48 hours before appointment; null if already past, or if
     `reminder48h` toggle is off.
   - REMINDER_3H → 3 hours before; same guards.
   - FOLLOWUP → `followupHours` (default 24) after appointment, gated by
     `followupEnabled`.
   - Appointment moment is computed as `Date.UTC(y, mo-1, d, h-3, mi)` — the
     `h-3` is the hard-coded UTC+3 offset for Istanbul. Will silently misfire
     if Türkiye ever moves off UTC+3 again.
3. Dedup: skip if a `NotificationJob` with the same
   `(appointmentId, channel, event)` already exists in status `PENDING`,
   `PROCESSING`, or `SENT`.
4. Insert `NotificationJob` (`PENDING`, `attempts = 0`).

A single `queueNotifications(id, "CONFIRMED")` call therefore creates up to
**6 jobs** (3 events × 2 channels) when both SMS + WhatsApp are on and all
reminder toggles are enabled.

### Cancel side — `cancelPendingJobs(id)` in
[`lib/notifications.js:136`](../lib/notifications.js)
- Used by the CANCELLED branch of the status route.
- Updates every still-`PENDING` job for the appointment to `CANCELLED`. The
  CANCELLED event itself is then queued, so the customer gets the cancel SMS
  but not the reminders.

### Consumer — Vercel Cron `0 9 * * *` (daily 09:00 UTC)
- [`vercel.json`](../vercel.json) → GET `/api/cron/notifications`.
- Auth: `Bearer ${process.env.CRON_SECRET}`. In production the secret is
  mandatory; in dev it is optional unless set.
- Calls `processQueue(20)` and `processReviewQueue(20)` in parallel
  ([`app/api/cron/notifications/route.js`](../app/api/cron/notifications/route.js)).

`processQueue` ([`lib/notifications.js:193`](../lib/notifications.js)):

1. Selects up to 20 jobs where `status = "PENDING"`,
   `scheduledFor <= now`, `attempts < 3`.
2. Per job:
   - Optimistic claim via `updateMany({ status: "PENDING" })` to `PROCESSING`
     with `attempts++`. If `count === 0`, another worker raced it; skip.
   - `processJob(job)` calls `sendSms` or `sendWhatsapp`:
     - `sendSms` → Netgsm GET `/sms/send/get/` with
       `usercode`, `password`, `gsmno`, `message`, `msgheader`. Success means
       response body starts with `00`; everything else throws.
     - `sendWhatsapp` → Netgsm POST `/whatsapp/send/` with E.164 phone
       (`toE164` from `lib/validation.js`), strips the `+` to match Netgsm's
       `905xxxxxxxxx` format.
   - On success: status → `SENT`, `processedAt = now`, `lastError = null`.
   - On failure: status → `PENDING` again with `scheduledFor` pushed by
     exponential back-off (5min × 3^attempts), unless `attempts >=
     maxAttempts` (default 3) — then status → `FAILED`.

### Side effects

- Up to ~6 `NotificationJob` rows per appointment.
- `NotificationSettings` is the only credential store — Netgsm `usercode` and
  `password` are per-shop, not platform-wide.
- Reminders are short-lived: the cron runs once a day, so a `REMINDER_3H`
  scheduled for 15:00 won't fire until 09:00 the next day. This is a known
  limitation — increase cron frequency before promising reminders to customers.

### Failure modes

| Symptom | Cause |
|---|---|
| 401 from cron | `CRON_SECRET` mismatch |
| Job stuck `PENDING` forever | `attempts < 3` exhausted and back-off pushed `scheduledFor` past the next cron tick |
| `FAILED` with Netgsm error in `lastError` | Bad creds, blocked sender header, or invalid phone |
| `Netgsm credentials not configured` | `NotificationSettings.netgsmUser` / `netgsmPassword` empty |
| Reminders silently missed | Cron is once-daily; 3-hour reminder for late-day appointments often fires post-fact |
| Wrong send time | Hard-coded `h-3` UTC offset in `getScheduledFor`; DST or future Turkish TZ changes would skew |
| Duplicate sends across multiple instances | Optimistic claim via `updateMany` prevents this within Postgres |

---

## 6. Onboarding / Signup

**Trigger:** Visitor submits the landing lead form on `/`.

### Steps

1. Lead capture — `LeadForm` in [`app/page.js:874`](../app/page.js) POSTs to
   `/api/leads` ([`app/api/leads/route.js`](../app/api/leads/route.js)):
   - 3 leads per IP per 10 min.
   - Validates `businessName`, `name`, `phone` (required), optional `email`
     (regex) and `message`. Length caps prevent abuse.
   - Inserts a `Lead` row (no `shopId`; this is platform-scope).
   - Returns `{ ok: true }` 201.

2. Sales follow-up — manual. There is **no automated onboarding email** today.
   A human runs through the next steps.

3. Shop creation — super-admin uses the dashboard
   ([`components/superadmin/SuperAdminDashboard.js`](../components/superadmin/SuperAdminDashboard.js))
   to POST `/api/superadmin/shops`
   ([`app/api/superadmin/shops/route.js:36`](../app/api/superadmin/shops/route.js)):
   - Slug regex: `/^[a-z][a-z0-9-]{2,30}$/`.
   - Admin password ≥ 6 chars (bcrypt cost 12).
   - Single transaction creates the `Shop` (with `startTrialFields()` →
     `subscriptionStatus = "TRIAL"`, `trialEndsAt = now + 14d` from
     [`lib/subscription.js:69`](../lib/subscription.js) and `lib/plans.js`'s
     `TRIAL_DAYS = 14`) and the initial ADMIN `User`.
   - No default services, working hours, or barbers are seeded by this route.
     The new shop is empty; the admin sets up barbers/services from
     `/admin → /<slug>/admin`.

4. First login — admin hits `/admin`
   ([`app/admin/page.js`](../app/admin/page.js)):
   - Redirects based on `useAuth().user.role`:
     - `SUPER_ADMIN` → `/superadmin`
     - `BARBER` with a `barber.slug` → `/<shopSlug>/barber/<barberSlug>`
     - Anyone else with a shop → `/<shopSlug>/admin`
     - No shop → `/`
   - The `/<shopSlug>/admin` page renders
     [`components/admin/AdminDashboard.js`](../components/admin/AdminDashboard.js)
     which is gated by the same JWT cookie.

### Side effects

- `Lead` row (no FK).
- `Shop` + initial `User(role: ADMIN)` inserted atomically.
- Trial countdown begins; no `NotificationSettings`, `Barber`, or `Service`
  rows yet.

### Failure modes / gaps

| Symptom | Cause |
|---|---|
| 429 lead form | Rate limit |
| 409 slug taken / email taken | Super-admin create endpoint |
| Empty admin panel after first login | No seeded services/working hours — admin must configure manually |
| No SMS dispatched | `NotificationSettings` row doesn't exist; `queueNotifications` early-returns on `findUnique` miss |
| Trial silently expires | Cron `expireTrials` flips to `PAST_DUE`; banner shows, public booking still works for grace |

The brief asks about "default services / working hours / first login redirect"
— only the redirect logic exists. Defaults are not seeded by code today.

---

## 7. Custom Domain Tenant

**Trigger:** Salon owner buys a domain and points it at the platform.

### 3-step onboarding (sales-led, no UI)

1. **DNS** — owner adds an A or CNAME record pointing to the Vercel target.
   Wildcard subdomains and apex both work; HTTPS handled by Vercel.
2. **Vercel project** — domain added under the Makas Vercel project so the
   request actually reaches our app.
3. **DB binding** — super-admin sets `Shop.customDomain` via PATCH
   `/api/superadmin/shops/[id]` ([`app/api/superadmin/shops/[id]/route.js`](../app/api/superadmin/shops/[id]/route.js)).
   The column is `@unique` (see `prisma/schema.prisma:Shop.customDomain`).

### Request routing — [`proxy.js`](../proxy.js)

- `Host` header lowercased.
- Hard-coded `PLATFORM_HOSTS` set (makas.tech, makas.furunci.tech, localhost,
  127.0.0.1) plus `*.vercel.app` → pass through, no rewrite.
- Otherwise → `resolveSlug(host)` reads `Shop.findUnique({ where: {
  customDomain: host } })` and caches `host → slug` for 5 minutes in-process.
- On hit: `NextResponse.rewrite` to `/<slug>/<path>`. Already-prefixed paths
  are left alone (defensive guard at [`proxy.js:78`](../proxy.js)).
- Matcher excludes `_next/static`, `_next/image`, anything with a file
  extension, and most of `/api/*`. `/api/superadmin/*` is allow-listed so the
  IP gate (next paragraph) still runs.

### Super-admin IP gate

- [`proxy.js:27`](../proxy.js) optionally enforces `SUPER_ADMIN_IP_ALLOWLIST`
  env (comma-separated). If unset, no enforcement. If set, requests to
  `/superadmin/*` and `/api/superadmin/*` are 403'd unless the trusted-proxy-hop
  IP from `x-forwarded-for` is in the allowlist. `TRUSTED_PROXY_HOPS = 0`
  defaults to "client = first IP in XFF".
- Per memory note, this is deferred until a static IP is available.

### Side effects

- Cache: `Map<host, { slug, expires }>` lives per Node instance. **Updating
  `Shop.customDomain` takes up to 5 minutes to propagate** until the entry
  expires. The 5-min TTL is per-instance, so on Vercel's autoscaled fleet
  different instances may serve the old slug for different durations.
- No `Set-Cookie` or auth state is touched by the rewrite — auth still flows
  through the JWT cookie set by `/api/auth/login`.

### Failure modes

| Symptom | Cause |
|---|---|
| Custom domain returns marketing landing | Step 3 missing — `customDomain` unset on the `Shop` row |
| Wrong tenant served briefly after rebind | 5-min proxy cache; restart instance or wait |
| `/superadmin/*` 403 from new office | `SUPER_ADMIN_IP_ALLOWLIST` env stale |
| `vercel.app` preview rewriting to a tenant | Explicit `endsWith(".vercel.app")` exception prevents this |
| 404 on a known path | Matcher excludes `_next/image` etc. — anything with `.` in the path bypasses the proxy by design |

---

## 8. Billing / Subscription

**Status:** plumbing and lifecycle logic are in place, but the payment
provider is a stub. Real iyzico integration is not wired.

### Plan model — [`lib/plans.js`](../lib/plans.js)

- Single flat plan: 500 ₺/month, unlimited barbers.
- `PlanTier` enum (`STARTER` / `PRO` / `ENTERPRISE`) is retained in Prisma for
  legacy rows; every value maps to the same `PLAN`. `hasFeature()` always
  returns true. `canCreateBarber()` in
  [`lib/subscription.js:49`](../lib/subscription.js) will only ever be a no-op
  while `maxBarbers = Infinity`.

### Subscription lifecycle — [`lib/subscription.js`](../lib/subscription.js)

```
signup ──► TRIAL (14 days, trialEndsAt set)
            │ trialEndsAt < now (cron)
            ▼
          PAST_DUE (3-day grace; booking still allowed)
            │ updatedAt < now - 3d (cron)
            ▼
          SUSPENDED (public booking blocked; admin login OK except shop.status SUSPENDED)

payment.succeeded webhook ──► ACTIVE, currentPeriodEndsAt set, Invoice written
payment.failed     webhook ──► PAST_DUE
subscription.cancelled    ──► CANCELLED
```

- `canAcceptPublicBookings(shop)` → true only for `{TRIAL, ACTIVE, PAST_DUE}`
  AND `shop.status !== "SUSPENDED"`.
- `shouldShowBillingBanner(shop)` → true for `{PAST_DUE, SUSPENDED, CANCELLED}`.
  Copy lives in
  [`components/admin/SubscriptionBanner.js:11`](../components/admin/SubscriptionBanner.js).

### Daily billing cron — `0 3 * * *`
- [`vercel.json`](../vercel.json) → GET `/api/cron/billing`
  ([`app/api/cron/billing/route.js`](../app/api/cron/billing/route.js)).
- Auth: `Bearer ${CRON_SECRET}` (same gating as notifications cron).
- Runs `expireTrials()` then `suspendPastDue()`. Both are
  idempotent `updateMany`s — safe to replay.

### Checkout

- POST `/api/payments/checkout` requires ADMIN/SUPER_ADMIN and a `planTier`.
- Delegates to `createCheckout({ shopId, planTier, returnUrl })` in
  [`lib/payments/provider.js`](../lib/payments/provider.js) which picks a
  provider from `PAYMENT_PROVIDER` env (default `iyzico`).
- iyzico provider in [`lib/payments/iyzico.js`](../lib/payments/iyzico.js)
  throws `PaymentNotConfiguredError("iyzico SDK not wired yet")`. The route
  catches this and returns **503** with the body "Ödeme sağlayıcı henüz aktif
  değil. Lütfen bizimle iletişime geçin." — so the admin billing page CTA
  (`components/admin/BillingPage.js`) is effectively a sales contact prompt
  today.

### Webhook handling — [`app/api/payments/webhook/route.js`](../app/api/payments/webhook/route.js)

1. `verifyWebhook(request)` (provider-agnostic) returns
   `{ event, shopId, invoiceData, eventId }` or null. iyzico stub returns
   null today, so production webhooks are silently 200'd with
   `{ ok: true, ignored: true }` until creds are wired.
2. Idempotency: insert `ProcessedWebhookEvent { provider, eventId }`. P2002
   unique violation → 200 `{ duplicate: true }`.
3. Dispatch on event:
   - `payment.succeeded` → tx: `Shop.subscriptionStatus = "ACTIVE"`,
     `currentPeriodEndsAt = invoiceData.periodEnd`,
     `paymentProvider = provider`; upsert `Invoice` keyed by
     `providerInvoiceId` with status `PAID`.
   - `payment.failed` → `Shop.subscriptionStatus = "PAST_DUE"`.
   - `subscription.cancelled` → `Shop.subscriptionStatus = "CANCELLED"`.

### Manual sales-led overrides

Super-admin's PATCH `/api/superadmin/shops/[id]` accepts `startTrialDays`,
`extendDays`, `subscriptionStatus`, `planTier` for sales-led upgrades. See
[`app/api/superadmin/shops/[id]/route.js:76-100`](../app/api/superadmin/shops/[id]/route.js).
This is the upgrade path currently used in production.

### Side effects

- `Shop.subscriptionStatus`, `trialEndsAt`, `currentPeriodEndsAt`,
  `paymentProvider`, `paymentProviderRef`.
- `Invoice` rows (`Restrict` FK; block hard shop deletion).
- `ProcessedWebhookEvent` rows (idempotency dedup).

### Failure modes / gaps

| Symptom | Cause |
|---|---|
| 503 from checkout | iyzico SDK not wired |
| Webhook silently ignored | Stub returns null until creds set |
| Banner copy doesn't match status | Status flipped manually without clearing trial fields |
| `Shop.status === "SUSPENDED"` (platform suspend) | Hard-blocks login + booking regardless of subscription |
| TRIAL never transitions | Cron not running; `expireTrials` is the only mover |
| Grace period extended forever | `suspendPastDue` uses `updatedAt < now - 3d`; any unrelated update to `Shop` resets the grace clock |

---

## 9. Super-Admin Overview

**Trigger:** Super-admin logs in via `/superadmin/login`.

### Login — [`app/superadmin/login/page.js`](../app/superadmin/login/page.js)

- Same `useAuth().login(identifier, password)` as tenant admins (POST
  `/api/auth/login`).
- After login, the page checks `user.role === "SUPER_ADMIN"` and shows
  an error otherwise (the cookie has already been set, but the redirect is
  blocked).

### Dashboard — [`app/superadmin/page.js`](../app/superadmin/page.js) →
[`components/superadmin/SuperAdminDashboard.js`](../components/superadmin/SuperAdminDashboard.js)

- Client-side guard: if `role !== "superadmin"` (derived from `user.role`),
  redirect to `/superadmin/login`.
- On mount, parallel:
  - GET `/api/superadmin/stats`
    ([`route.js`](../app/api/superadmin/stats/route.js)) — totals: shops,
    active/suspended shops, barbers, users, all-time + monthly appointment
    counts, all-time + monthly revenue (sum of `Appointment.price` where
    `status = COMPLETED`).
  - GET `/api/superadmin/shops` — every shop with `_count` for barbers,
    services, appointments, users.
- The UI exposes pages "Dashboard", "Salonlar", "Analitik" with create + edit
  modals (which call PATCH `/api/superadmin/shops/[id]`).

### Tenant impersonation

- There is no impersonation route. The dashboard exposes a `previewShopId`
  helper (`setPreviewShopId` in [`lib/api.js`](../lib/api.js)) — this only
  passes `?shopId=` on admin GETs that super-admin already supports. There is
  no "login as admin of shop X" mechanism.

### Tenant deletion

- DELETE `/api/superadmin/shops/[id]` ([`route.js:118`](../app/api/superadmin/shops/[id]/route.js))
  is a **soft delete**: sets `Shop.deletedAt = now` and
  `Shop.status = "SUSPENDED"`. Hard delete is blocked by `Invoice.shopId` and
  platform-level `AuditLog.shopId` (both `Restrict`).

### Side effects

- Read-only for most of the dashboard; writes are limited to:
  - Shop create (flow 6)
  - Shop update (status, subscription, slug, plan, trial extensions)
  - Soft delete

### Failure modes

| Symptom | Cause |
|---|---|
| 403 on /superadmin* | `SUPER_ADMIN_IP_ALLOWLIST` set and IP not in list |
| Empty stats | New install, no completed appointments |
| Edit changes don't reach tenant | 5-min proxy cache for custom-domain rewrites; tenants on platform host don't have this delay |
| Slug rename breaks tenant | Existing magic links / Google reviews keyed to old slug stop working — proxy.js still serves the new slug |

---

## 10. Auth

**Trigger:** Any request to a protected route or a deliberate POST
`/api/auth/login`.

### Login — POST `/api/auth/login`
[`app/api/auth/login/route.js`](../app/api/auth/login/route.js)

- 10 attempts per IP per 15 min.
- Identifier is lower-cased & trimmed; matched against either `User.email` or
  `User.username` (both `@unique`).
- `bcrypt.compare` against `passwordHash`.
- If `user.shop.status === "SUSPENDED"`, return 403 "Bu salon askıya
  alındı..." (super-admin has `shop = null` so this never fires for them).
- `signToken({ userId, role, shopId, barberId, tokenVersion })` — HS256 with
  `JWT_SECRET`, 7-day expiry. Token returned both in the JSON body **and** as
  the `makas-token` httpOnly cookie (`sameSite: lax`, `secure` in prod).

### Verification — `requireAuth(request)` in
[`lib/auth.js:46`](../lib/auth.js)

- Token resolved from `Authorization: Bearer …` or the `makas-token` cookie.
- `jwtVerify` against `JWT_SECRET`.
- `tokenVersion` cross-check: fresh DB lookup (with a 15-second in-process
  cache keyed by `userId`). If DB `tokenVersion !== payload.tokenVersion`, the
  session is invalidated.
- `payload.shopId` is filled in from the DB lookup if missing (defensive).

### Logout — DELETE `/api/auth/me`
[`app/api/auth/me/route.js`](../app/api/auth/me/route.js)

- Increments `User.tokenVersion`, clears the in-process auth cache, sets the
  `makas-token` cookie to expire immediately. Every other live JWT for this
  user is now invalid on next `requireAuth`.

### Role-based redirects

`/admin` ([`app/admin/page.js`](../app/admin/page.js)) is the single landing
URL post-login:

| Role | Destination |
|---|---|
| `SUPER_ADMIN` | `/superadmin` |
| `BARBER` (with `barber.slug`) | `/<shopSlug>/barber/<barberSlug>` |
| `ADMIN` / `RECEPTIONIST` / `CUSTOMER` with `shop.slug` | `/<shopSlug>/admin` |
| No shop | `/` |

`RECEPTIONIST` shares the admin dashboard route. `CUSTOMER` is a placeholder
role (the public booking flow does not require auth), so a CUSTOMER landing
on `/admin` hits the admin dashboard with the same JWT shopId scope as an
ADMIN — there is no separate customer portal.

### Side effects

- `User.tokenVersion += 1` on logout.
- `makas-token` cookie (httpOnly, 7-day) set on login, cleared on logout.
- 15-second in-process auth cache hit avoids one DB round-trip per
  authenticated API call.

### Failure modes

| Symptom | Cause |
|---|---|
| 401 silently on every request | Token expired (7d) — UI shows the login page |
| Session not invalidated after logout on other devices | `tokenVersion` lookup cached for up to 15s; logout takes effect on next cache evict |
| 403 on login | Shop SUSPENDED |
| 429 on login | Rate limit |
| `JWT_SECRET required` crash | Production boot without env set |
| Super-admin redirected to `/` after login | `user.shop` is null; `/admin` correctly routes to `/superadmin` instead — see redirect table |

---

## Cross-flow notes

- **Soft delete** is opt-in at the query layer. Every new public endpoint that
  resolves a shop must filter `deletedAt: null` (e.g.
  [`lib/shop.js:8`](../lib/shop.js) does it; the booking POST also checks at
  [`route.js:163`](../app/api/appointments/route.js)).
- **Audit log** is referenced in the data model but writes are limited to one
  call site (`walkin_price_mismatch`). The status route, the cancel path, the
  reschedule path, and the super-admin overrides do not write `AuditLog`
  rows. Plan around this if you need attribution.
- **No webhook secret for Netgsm callbacks** — outbound dispatch only.
  Incoming SMS DLR is not consumed.
- **Cron cadence** — notifications + reviews share one daily run at 09:00 UTC
  (`/api/cron/notifications`) and billing runs at 03:00 UTC
  (`/api/cron/billing`). Photos cleanup at 04:00 UTC on Sundays
  (`/api/cron/cleanup-photos`, schedule only — body not covered here).
- **Timezone math** lives in `lib/utils.js` (`todayStr`, `nowMinutes`,
  `toDateStr`) and is Europe/Istanbul-aware. Direct `new Date()` math anywhere
  the date format `"YYYY-MM-DD"` is involved will silently misfire across the
  UTC midnight boundary.
- **Rate limits** are in-process (per Node instance). They do not survive
  redeploys and do not coordinate across Vercel instances. Adequate for
  current traffic; not adequate for a coordinated attack.

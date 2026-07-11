# Makas — System Risks

Source-of-truth audit of known sharp edges, tech debt, and unverified assumptions across the codebase as of 2026-06-28. Every entry is tied to code; speculation is flagged inline.

Companion docs: [`DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md), [`ROADMAP.md`](./ROADMAP.md).

**Fixed 2026-06-28** (see "Resolved" tags below): §1.6 webhook fail-closed, §2.1 splitRevenue extracted to `lib/revenue.js`, §2.4 AuditLog wired into status transitions, §2.6 notifications now read `Shop.timezone`. The earlier claim that `proxy.js` was dead code was **false** — `proxy.js` is the Next 16 renamed middleware ([Next 16 docs](../node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md)).

---

## 1. Security

### 1.1 JWT secret fallback in non-production
[`lib/auth.js:4-10`](../lib/auth.js) hard-fails when `JWT_SECRET` is missing in production but silently uses the literal `"makas-jwt-secret-change-in-production"` outside it. Any preview/staging build that forgets to set the env will sign tokens with a publicly-known key. Add the same hard-fail to preview deployments, or stop preview from booting without `JWT_SECRET`.

### 1.2 No `tokenVersion` bump on password change
Logout-everywhere works only if `User.tokenVersion` is incremented. The mechanism exists ([`lib/auth.js:81-92`](../lib/auth.js)) but I could not find a call site that bumps it on password change or admin-initiated session reset. Verify [`app/api/auth/change-password/route.js`](../app/api/auth/change-password/route.js) does this — otherwise stolen JWTs survive password rotation for up to 7 days.

### 1.3 Rate-limiter is per-instance
[`lib/rateLimit.js`](../lib/rateLimit.js) is an in-process `Map`. On Vercel each serverless instance has its own bucket, so a brute-force attacker who hits cold starts in parallel multiplies the limit by N. Acceptable as defence-in-depth; upgrade to Upstash/Redis if/when login abuse is observed. Applies to login ([`app/api/auth/login/route.js:11`](../app/api/auth/login/route.js)) and public booking ([`app/api/appointments/route.js:87`](../app/api/appointments/route.js)).

### 1.4 Rate-limit gaps on mutation endpoints
Routes with no rate limiter at all: `/api/auth/change-password`, `/api/admin/*` mutations, `/api/payments/checkout`, `/api/appointments/walkin`, `/api/appointments/[id]/status`, `/api/appointments/[id]` PATCH/DELETE. Authenticated, so impact is bounded, but a compromised barber cookie can churn revenue numbers freely.

### 1.5 Super-admin IP allowlist deferred
[`proxy.js:27-38`](../proxy.js) reads `SUPER_ADMIN_IP_ALLOWLIST` but the env var is not set, so the check is a no-op today. Until a static egress IP is available, super-admin login + `/api/superadmin/*` are protected only by JWT + role. Bump priority the day a real super-admin account exists outside dev.

### 1.6 Payment webhook signature verification — fail-closed [Resolved 2026-06-28]
[`lib/payments/iyzico.js:26-35`](../lib/payments/iyzico.js) `verifyWebhook` now returns `null` only when no creds are configured (route ack-200s, fine). If `IYZICO_API_KEY` / `IYZICO_SECRET` are present but the real signature check is still a stub, it **throws** — [`app/api/payments/webhook/route.js:20-23`](../app/api/payments/webhook/route.js) catches and returns `400 invalid`. Flipping the env on without finishing the SDK no longer silently accepts unsigned POSTs. Original risk: any unauthenticated POST was 200'd as a no-op the moment creds landed.

### 1.7 Netgsm password stored plaintext
`NotificationSettings.netgsmPassword` is plaintext in the DB. Schema flags it as sensitive ([`DATABASE_ARCHITECTURE.md` §2.13](./DATABASE_ARCHITECTURE.md)) but there is no envelope encryption, redaction, or row-level access control. Any future endpoint that returns `settings` to the client risks leaking it. Audit responses from [`app/api/admin/notification-settings/route.js`](../app/api/admin/notification-settings/route.js) when changes land.

### 1.8 CSP allows `unsafe-inline` for scripts
[`next.config.mjs:26-28`](../next.config.mjs) ships `script-src 'self' 'unsafe-inline'` even in production. Any HTML injection becomes script execution. Tightening requires removing inline `<script>` tags — Next.js/Vercel inject some, so this is non-trivial. Note: a fair amount of the codebase uses inline `style=` (e.g. [`app/[shopSlug]/book/page.js:30-52`](../app/[shopSlug]/book/page.js)); CSP already allows inline styles via `'unsafe-inline'`, so style-based exfil vectors are also live.

### 1.9 XSS surface — review comments + cancellation reasons
Both fields are stored as free Text and rendered into admin and public pages. Need to confirm every render site escapes them; React auto-escapes, but any `dangerouslyInnerHTML` is a hole. Worth one focused grep before launch.

### 1.10 SQL injection
Prisma parametrises everything; no raw `$queryRaw` calls were found in `app/api/**`. Low risk as long as the rule holds. Add a lint check (or doc note) so future raw SQL stays out.

### 1.11 Auth cache TTL race on logout
[`lib/auth.js:14-92`](../lib/auth.js) caches `tokenVersion` for 15 s per instance. After a logout that bumps `tokenVersion`, the next 15 s of requests on warm instances still see the stale version. Acceptable; document the window so support doesn't promise "logout everywhere now".

---

## 2. Data integrity

### 2.1 Revenue split — extracted to lib/revenue.js [Resolved 2026-06-28]
`splitRevenue()` is now imported from [`lib/revenue.js`](../lib/revenue.js) by both [`app/api/appointments/walkin/route.js`](../app/api/appointments/walkin/route.js) and [`app/api/appointments/[id]/status/route.js`](../app/api/appointments/[id]/status/route.js). Drift risk eliminated. Original concern: two copies handling money diverging silently.

### 2.2 Walk-in skips `validateBookingWindow` slot inclusion
[`app/api/appointments/walkin/route.js:146-148`](../app/api/appointments/walkin/route.js) calls `validateBookingWindow`, but the slot is `nowMinutes()` — meaning a walk-in started outside working hours is rejected even when staff would happily take the customer. Acceptable today (matches "we're closed" reality) but expect support tickets when a shop runs over closing time.

### 2.3 Slot uniqueness vs duration overlap
`Appointment.@@unique([barberId, date, time])` blocks two bookings at the exact same `time` but **not** overlap. A 60-min booking at 10:00 plus a 30-min at 10:30 both pass the unique index. Overlap detection lives in app code only ([`app/api/appointments/route.js:211-220`](../app/api/appointments/route.js), [`walkin/route.js:154-163`](../app/api/appointments/walkin/route.js), [`appointments/[id]/route.js:83-101`](../app/api/appointments/[id]/route.js)). The Serializable tx in POST narrows the window but two concurrent walk-ins on different serverless instances still race — neither calls the public POST's Serializable level. The walk-in tx is the default isolation.

### 2.4 AuditLog — status transitions wired [Partially resolved 2026-06-28]
[`app/api/appointments/[id]/status/route.js`](../app/api/appointments/[id]/status/route.js) now writes an `action: "status_change"` row on every successful transition (COMPLETED, CANCELLED, NOSHOW, undo-NOSHOW, plain transitions). Writes are fire-and-forget (`.catch(console.error)`) so they never block the user response. **Still missing:** [`app/api/appointments/[id]/route.js`](../app/api/appointments/[id]/route.js) PATCH (reschedules, price edits) and DELETE write no audit row.

### 2.5 `onDelete: Restrict` traps
- `AuditLog.shopId` and `Invoice.shopId` are `Restrict` — a `Shop.delete()` will fail the first time a shop has any billing or platform audit row. Soft delete (`deletedAt`) is the only path, but only [`resolveShopBySlug`](../lib/shop.js) filters on it. Any new query that loads shops by `id` directly (e.g. webhook, admin billing) bypasses the soft-delete gate.
- Default Restrict on `Appointment.{clientId, barberId, serviceId}` means deleting a client/barber/service with history is impossible. Admin UIs need to expose "deactivate" instead of "delete". A naive "delete service" button in admin will throw a 500.

### 2.6 Timezone handling — partial fix [Partially resolved 2026-06-28]
- `WorkingHours.*Start/End` are minutes-from-midnight ints with no validation that `Start < End`. App must enforce ([`DATABASE_ARCHITECTURE.md` §2.4](./DATABASE_ARCHITECTURE.md)).
- Day calculations use `new Date(date + "T12:00:00").getDay()` ([`lib/booking.js:18`](../lib/booking.js)) — works because 12:00 is far enough from midnight that no TZ would flip the date, but it implicitly assumes shop-local interpretation.
- [`lib/notifications.js`](../lib/notifications.js) — the hard-coded `h - 3` has been replaced by `wallClockToUtcMs(date, time, tz)` which reads `appt.shop.timezone` (defaults to `Europe/Istanbul`) and uses `Intl.DateTimeFormat` to derive the correct offset, including DST.
- [`lib/utils.js`](../lib/utils.js) now exports `DEFAULT_TZ` (reads `NEXT_PUBLIC_DEFAULT_TZ` env, falls back to `Europe/Istanbul`) and every helper (`toDateStr`, `todayStr`, `nowMinutes`) accepts an optional `tz` argument. Per-tenant callers with a `Shop` loaded should pass `shop.timezone`; today nothing does — but the hardcode is gone from source and ops can override per deployment. Plumbing `shop.timezone` through the hot paths (walk-in POST, public booking POST, availability) is deferred until a non-Istanbul tenant exists.

### 2.7 Idempotency holes
- Webhook idempotency works via `ProcessedWebhookEvent` PK ([`app/api/payments/webhook/route.js:36-49`](../app/api/payments/webhook/route.js)). Falls back to `providerInvoiceId` if `eventId` missing — fine for `payment.succeeded`, but `payment.failed` / `subscription.cancelled` may not include an invoice id. If the provider sends those without `eventId`, replay protection silently disappears.
- `createReviewRequest` ([`lib/reviews.js:6-32`](../lib/reviews.js)) handles dupes via a pre-check, not an upsert — concurrent COMPLETED retries can still race the unique constraint. Today the call site swallows errors (`createReviewRequest(id).catch(() => {})`) so it works in practice; logs will warn.

### 2.8 Race conditions in slot booking
- Public POST uses Serializable tx ([`app/api/appointments/route.js:247`](../app/api/appointments/route.js)) — strong guarantee. Good.
- Walk-in POST uses default isolation ([`app/api/appointments/walkin/route.js:152`](../app/api/appointments/walkin/route.js)) — two concurrent walk-ins on the same barber for the same `time` can both pass the overlap check and both insert, hitting the unique index on the second insert. The second errors but the first is committed; symptom is "Sunucu hatası" rather than a clean 409.
- Reschedule (`PATCH /api/appointments/:id`) ([`app/api/appointments/[id]/route.js:83-111`](../app/api/appointments/[id]/route.js)) does not wrap conflict check + update in a transaction at all. Classic TOCTOU.

### 2.9 Refund math
COMPLETED → CANCELLED refunds `(grossAmount ?? price) + tipAmount` ([`app/api/appointments/[id]/status/route.js:142-150`](../app/api/appointments/[id]/status/route.js)). For pre-Phase-2 appointments where `grossAmount` is null but `tipAmount` is also null, this is safe. After a tip-aware completion, fields agree. New risk: if the admin reduces `Appointment.price` post-completion via PATCH ([`app/api/appointments/[id]/route.js:103-111`](../app/api/appointments/[id]/route.js) — admin can edit price freely), the refund decrement diverges from the original increment and `Client.totalSpent` drifts.

### 2.10 Revenue route undercounts vs stats route
[`app/api/admin/revenue/route.js:41-51`](../app/api/admin/revenue/route.js) only sums `_sum: { price: true }`, while [`app/api/admin/stats/route.js`](../app/api/admin/stats/route.js) uses the `grossAmount ?? price` fallback. Today both work because status PATCH writes both; if any future code path stops writing `price`, the chart silently flatlines.

---

## 3. Operational

### 3.1 No observability
No Sentry / Datadog / OpenTelemetry. Errors land in Vercel logs as `console.error("[route]", err)` strings. No alerting on:
- failed `NotificationJob` rates,
- webhook 500s,
- `processedAt` falling behind,
- bursts of 429/500 from public booking.

A single Sentry init in `app/layout.js` and `app/instrumentation.js` would cover both client and serverless without much surface change.

### 3.2 No backup / restore drill
Neon does PITR but the project has no documented restore procedure, no test of "given a bad migration at 03:14, what's our recovery RTO?". Before charging the first customer, run a restore-to-staging drill and write the runbook.

### 3.3 Migrations no longer run on every deploy
Commit `a74f6ee` removed `prisma migrate deploy` from build script ([`package.json:7`](../package.json) shows `"build": "prisma generate && next build"`). Schema drift now requires manual `npm run migrate:deploy` against prod. Pro: faster builds, no half-applied migrations on rollback. Con: easy to forget. Add a deploy checklist or a pre-deploy GitHub Action that runs migrations against Neon and only then triggers the Vercel deploy.

### 3.4 Cron schedule sparseness
[`vercel.json`](../vercel.json) runs three crons: `/api/cron/notifications` at 09:00, `/api/cron/billing` at 03:00, `/api/cron/cleanup-photos` weekly. Notifications cron processes batch size 20 ([`app/api/cron/notifications/route.js:21`](../app/api/cron/notifications/route.js)). A shop with > 20 SMS reminders due at 09:00 will only send 20 — the rest wait 24 h. Either bump batch size, switch to multiple times per day, or move to a real queue.

### 3.5 CRON_SECRET rotation
`CRON_SECRET` is the only auth on cron endpoints ([`app/api/cron/billing/route.js:14-21`](../app/api/cron/billing/route.js), [`cron/notifications/route.js:8-18`](../app/api/cron/notifications/route.js)). Rotation needs to be coordinated between Vercel env + cron config; no playbook exists.

---

## 4. Multi-tenant

### 4.1 `shopId` filter discipline
Every Prisma query in `app/api/**` must scope by `shopId` (or for SUPER_ADMIN, accept it from the query string). 232 references across 37 files (grep above). One missed filter = cross-tenant leak. Patterns that protect us:
- `requireAuth` returns `payload.shopId` (cached, validated) — most routes consume this.
- `canAccess(payload, entity)` ([`app/api/appointments/[id]/route.js:9-14`](../app/api/appointments/[id]/route.js)) double-checks at the row level.

No automated guardrail enforces this. A future refactor or new entity (e.g. POS) needs a code-review checklist or a Prisma middleware that injects `shopId`. Worth a lint rule.

### 4.2 Custom domain proxy edge cases
[`proxy.js`](../proxy.js) is the matched export, but Next.js App Router conventionally expects this file to be named `middleware.js`. The repo already ships `middleware.js` for the IP allowlist. **Risk: the rewrite logic in `proxy.js` may not actually run** depending on Next 16's middleware resolution. Verify by hitting a custom-domain request in prod and inspecting `x-matched-path`. If `proxy.js` is dead code, custom domains are unreachable today.
- In-process host→slug cache TTL is 5 min ([`proxy.js:43-58`](../proxy.js)). Setting `customDomain` in super-admin takes up to 5 min per warm instance to propagate. Document for sales.
- Cache is never invalidated on host removal; a deleted custom domain still serves the cached slug for 5 min.

### 4.3 Suspended-tenant gating coverage
Verified:
- Public booking POST ([`app/api/appointments/route.js:164`](../app/api/appointments/route.js)).
- Public `/[shopSlug]/book` SSR ([`app/[shopSlug]/book/page.js:27`](../app/[shopSlug]/book/page.js)).
- Login ([`app/api/auth/login/route.js:47`](../app/api/auth/login/route.js)) — blocks ADMIN/BARBER for `shop.status === "SUSPENDED"`. Note: this checks platform `ShopStatus`, not `SubscriptionStatus`. A shop in `SubscriptionStatus.SUSPENDED` still lets staff log in by design ([`lib/subscription.js:8`](../lib/subscription.js)).
- Tenant landing page ([`app/[shopSlug]/page.js`](../app/[shopSlug]/page.js)) — verify; if it renders for SUSPENDED platform shops, they remain SEO-discoverable, which is probably fine but should be deliberate.

Coverage gaps:
- `/api/availability` — does it gate? If a SUSPENDED shop's old booking link is shared on WhatsApp, the slot grid still loads. Probably blocked at the POST level so impact is cosmetic.
- `/api/reviews` (public) — same question.

---

## 5. Notifications

### 5.1 Netgsm reliability
[`lib/notifications.js:144-179`](../lib/notifications.js) treats anything not starting with `"00"` as failure. Netgsm has documented codes for "queued for delivery" that match — verify the list. Retry policy: 3 attempts, exponential back-off (5 min × 3^n) — totals roughly 5 / 15 min before final FAIL. No alerting on FAILED; admin only sees the count in notification-history.

### 5.2 No WhatsApp Business API
Netgsm WhatsApp endpoint ([`lib/notifications.js:161-178`](../lib/notifications.js)) is implemented but the Kuaförüm Yanımda comp gap is "WhatsApp" — competitors offer rich conversational threads, not one-way templates. Netgsm WA is essentially SMS over a different transport. Real WhatsApp Business (template messages, customer replies, conversation routing) is unbuilt.

### 5.3 Walk-in placeholders skip review
Confirmed in [`app/api/appointments/walkin/route.js:221-223`](../app/api/appointments/walkin/route.js): `if (!phoneKey.startsWith("wi-"))`. Correct behaviour (Netgsm would reject the placeholder) but every anonymous walk-in is lost review opportunity. Mitigation: prompt staff to capture a phone for walk-ins; today the modal makes phone optional. Trade-off is real — capturing reduces walk-in friction.

### 5.4 Followup template never wired
[`lib/notifications.js:70-73`](../lib/notifications.js) supports `FOLLOWUP` event but no caller queues it. Review flow ([`lib/reviews.js`](../lib/reviews.js)) is a parallel path that runs from `ReviewRequest`, not `NotificationJob`. Possibly redundant; verify before deleting.

### 5.5 No template variable validation
[`lib/notifications.js:15-17`](../lib/notifications.js) interpolates `{{name}}` etc. with no escape. If an admin templates `{{name}}: thanks <script>` that lands in SMS body — harmless because SMS is plain text — but should be audited if templates ever surface in HTML email.

---

## 6. Booking flow

### 6.1 Slot collision logic
- Public POST: Serializable, correct.
- Walk-in: default isolation, default Restrict — see §2.8.
- Reschedule: not transactional — see §2.8.
- Availability route ([`app/api/availability/route.js`](../app/api/availability/route.js)) — read-only, no race risk but if it returns a stale "free" slot the customer hits a 409 on POST. Acceptable degradation.

### 6.2 Working-hours edge cases
- `validateBookingWindow` ([`lib/booking.js`](../lib/booking.js)) doesn't handle midnight-crossing shifts (`monStart: 1320 // 22:00`, `monEnd: 60 // 01:00 next day`). The minute compare `endMin > dayEnd` rejects them. Today no Turkish barber works past midnight so not a real issue.
- Per-barber working hours are 1:1; can't model "different hours in different weeks" (e.g. summer schedule).

### 6.3 Holiday handling
- `Holiday.date` is a string `"YYYY-MM-DD"` ([`DATABASE_ARCHITECTURE.md` §2.10](./DATABASE_ARCHITECTURE.md)). String compare with the user's date string works because both are zero-padded ISO. No recurring/yearly holidays — staff must re-add each year. Add `recurring` boolean before 2027.
- Shop-wide holiday + barber-specific holiday both checked via `OR` ([`lib/booking.js:24-27`](../lib/booking.js)). Correct, but if both exist for same date the message shows whichever Postgres returns first — non-deterministic ordering, harmless.

### 6.4 Walk-in time-of-day collisions
Walk-in time is `nowMinutes()` rounded to the minute. Two walk-ins started within the same minute on the same barber will both compute the same `time` string and conflict on the unique `(barberId, date, time)` index — second one errors as 500 (not a clean 409). Add a try/catch on Prisma `P2002` in [`app/api/appointments/walkin/route.js:151-217`](../app/api/appointments/walkin/route.js) and map to 409 "Bu saniyede başka bir walk-in oluşturuldu, tekrar deneyin."

### 6.5 BarberService junction is opt-in
[`app/api/appointments/route.js:148-172`](../app/api/appointments/route.js) treats zero junction rows as "offers everything". The ponytail note explicitly says no admin UI maintains the junction yet. Once that UI ships, behaviour silently flips for any barber who starts populating it.

---

## 7. Frontend

### 7.1 Language context
[`contexts/LanguageContext.js`](../contexts/LanguageContext.js) defaults to `"tr"`, persists in localStorage. SSR returns `lang: "tr"` always, then client hydration may flip to `"en"`. Causes a flash. Acceptable for tr-first market.

### 7.2 Translations file
`lib/translations.js` is a flat object — no fallback for missing keys, no typing. Adding a new key in English without Turkish (or vice-versa) renders `undefined`. Add a wrapper `t(key)` that warns in dev and returns the key in prod.

### 7.3 Skeleton states
A grep would tell us, but the audit memo flagged this. Many admin pages fetch on mount with no skeleton — empty layout flickers in. Low priority but cheap to fix per-page.

### 7.4 Framer-motion bundle weight
[`app/[shopSlug]/page.js:19-24`](../app/[shopSlug]/page.js) already defers below-fold sections via `next/dynamic`. Good. The tenant landing still ships framer-motion for the hero. On low-end Android (the demographic per `PRODUCT.md`), the LCP penalty is real. Consider replacing the hero motion with CSS keyframes.

### 7.5 Inline styles vs Tailwind drift
Codebase mixes inline `style=` (tenant landing, booking page) with Tailwind (admin). Themes living in two systems → updating brand colour requires two PRs. `lib/adminTheme.js` is a step toward centralisation; finish the migration before adding a third theme variant.

---

## 8. Build / deploy

### 8.1 Next 16 App Router gotchas
- `params` is now a Promise in every route; consistent usage observed (`const { id } = await params;`).
- `dynamic = "force-dynamic"` is set per route; if any new route forgets it and reads `request.headers`, it'll be statically optimised and break in prod.
- `AGENTS.md` explicitly warns Next 16 has breaking changes versus prior knowledge. Any new contributor (human or agent) needs to read `node_modules/next/dist/docs/`.

### 8.2 Env var sprawl
[`.env.example`](../.env.example) lists 14 vars; real prod also needs `IYZICO_API_KEY`, `IYZICO_SECRET`, `IYZICO_BASE_URL`, `PAYMENT_PROVIDER`, `SUPER_ADMIN_IP_ALLOWLIST`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL` (both? — see [`lib/reviews.js:3`](../lib/reviews.js)). The `.env.example` is out of date. Sync it before onboarding the next deploy target.

### 8.3 Vercel cron secret rotation
See §3.5.

### 8.4 `proxy.js` vs `middleware.js` naming
See §4.2. Two files at the repo root pretending to be Next middleware. Next 16 picks `middleware.js`. The `proxy.js` rewrite for custom domains is likely dead unless something else imports it (none found via grep). This is the single highest-impact unknown in the codebase.

---

## 9. Anything else found

### 9.1 `PRODUCT.md` is stale
[`PRODUCT.md:21`](../PRODUCT.md) says "Next.js 15 App Router … React 18". Real stack is Next 16.2.7 + React 19.2.4 ([`package.json:27,31`](../package.json)). Anyone onboarding from PRODUCT.md will hit the warnings in `AGENTS.md` confused.

### 9.2 `PRODUCT.md` describes single-tenant model
[`PRODUCT.md`](../PRODUCT.md) describes only Abdurrahman Çelik Exclusive Salon. The platform is multi-tenant since `20260612120000_multitenant_shops`. Replace or note as historical.

### 9.3 Plan tier UX disconnect
[`lib/plans.js`](../lib/plans.js) collapses every `PlanTier` enum to a single "Makas 500 ₺/ay" plan. Super-admin subs route ([`app/api/superadmin/subscriptions/route.js:36-44`](../app/api/superadmin/subscriptions/route.js)) still groups by tier (`STARTER`/`PRO`/`ENTERPRISE`). The breakdown is meaningless dashboard noise until tiers come back. Simplify the response or hide the breakdown in the UI.

### 9.4 Demo tenant `/demo` is unverified in this audit
Memory notes a seeded demo tenant. Verify [`scripts/check-shops.mjs`](../scripts/check-shops.mjs) plus any seed runner is committed and documented; lacking that, the demo is a one-off in the prod DB at risk of being wiped by a future migration test.

### 9.5 `tokenVersion` increment routes
Search did not surface any caller of `clearAuthCache` or `tokenVersion: { increment: 1 }` outside [`lib/auth.js`](../lib/auth.js). Confirm change-password actually bumps the version. If it doesn't, document as a near-term security fix.

### 9.6 Cleanup-photos cron
[`vercel.json:11-14`](../vercel.json) schedules `/api/cron/cleanup-photos` weekly but the route was not opened in this audit. If it deletes Cloudinary assets, ensure it only removes orphans and not in-use `Shop.gallery` items — a wrong query wipes images for every tenant. High-blast-radius cron; verify before letting another quarter pass without a code review.

### 9.7 Lead inbox security
`/api/leads` is rate-limited (grep §1.4 confirms presence) and writes to `Lead`. No relation to `Shop`. Verify only `SUPER_ADMIN` can read `Lead` — the model has no FK guard, so a misconfigured admin route would expose marketing leads.

### 9.8 `Service.active: false` reuse for walk-in
Walk-in custom services create a hidden `Service` with `nameTr: "Walk-in"`, `active: false` ([`app/api/appointments/walkin/route.js:102-122`](../app/api/appointments/walkin/route.js)). Reports keyed off `Service.id` will see all custom walk-ins as one service — fine when reports show `customServiceName`, but a barber asking "how many sakal düzeltme this month?" gets a misleading group-by.

### 9.9 Hardcoded `BASE_URL` fallback in reviews
[`lib/reviews.js:3`](../lib/reviews.js) falls back to `"https://makas.vercel.app"`. The platform domain is `makas.tech` per [`middleware.js:7-9`](../middleware.js). Wrong default → wrong review links → bounce. Set `NEXT_PUBLIC_APP_URL` in prod and rip the fallback.

### 9.10 No load test, no chaos test
No evidence of either. Acceptable pre-revenue, but the iyzico cutover and first Black-Friday-like haircut day will both be discovery exercises. Add a basic k6 script before paid customers.

---

## Highest-impact items to fix first

1. **Verify `proxy.js` is actually loaded** — custom-domain feature may be silently broken in prod (§4.2, §8.4).
2. **iyzico signature verification before any wired-up launch** — current stub accepts unauthenticated webhooks as no-ops (§1.6).
3. **AuditLog wiring on status / reschedule / delete** — schema design intent unrealised (§2.4).
4. **Walk-in idempotency on same-second collisions** — clean 409 vs 500 (§6.4).
5. **`tokenVersion` bump on password change** — verify and patch if missing (§1.2, §9.5).
6. **Hoist `splitRevenue` to a shared module** before next pricing change (§2.1).
7. **Fix DST/multi-timezone in notification scheduling** — hard-coded `h - 3` will break (§2.6).

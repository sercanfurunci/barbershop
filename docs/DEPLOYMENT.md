# MAKAS — Deployment

## Platform

Deployed to **Vercel** (Next.js 16, Node.js runtime). Database on **Neon** (PostgreSQL). Redis on **Upstash**.

---

## 1. Vercel Deployment

### First deploy

```bash
npm i -g vercel
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard and push to `main`.

**Build command** (Vercel auto-detects, or set manually):
```
prisma generate && next build
```

**Output directory:** `.next` (default)

**Node.js version:** 20.x (set in Vercel project settings)

---

## 2. Required Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**.

Do not put secrets in `.env.local` for production — they won't be picked up by Vercel.

The app validates required vars at startup via `lib/env.js` / `instrumentation.ts`. A missing required var will throw on cold start and surface as a 500 in Vercel function logs.

### Always required

| Variable | How to generate |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (include `?pgbouncer=true`) |
| `DIRECT_URL` | Neon direct connection string (for migrations — no pgBouncer) |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://makas.app` |

### Required in production

| Variable | How to generate |
|---|---|
| `JWT_SECRET` | `openssl rand -hex 64` |
| `UPSTASH_REDIS_REST_URL` | Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash dashboard |
| `NETGSM_USER` | Netgsm account |
| `NETGSM_PASSWORD` | Netgsm account |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard |
| `CRON_SECRET` | `openssl rand -hex 32` |

### Optional (graceful degradation when unset)

| Variable | Effect if unset |
|---|---|
| `RESEND_API_KEY` | Password reset links logged to console instead of emailed |
| `GOOGLE_PLACES_API_KEY` | Geocoding and Places search disabled |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map embeds on public shop pages disabled |
| `NETGSM_HEADER` | Defaults to `"MAKAS"` |
| `SUPER_ADMIN_IP_ALLOWLIST` | Super-admin panel accessible from any IP |
| `NEXT_PUBLIC_DEFAULT_TZ` | Defaults to `"Europe/Istanbul"` |

---

## 3. Database Migrations in CI/CD

Migrations must run **before** the new code goes live. The safe pattern:

### Option A — Run before deploy (recommended for Neon)

```bash
# In your CI pipeline, before `vercel --prod`
npx prisma migrate deploy
```

### Option B — Vercel Build Command

Add migration to the Vercel build command:

```
npx prisma migrate deploy && prisma generate && next build
```

> Requires `DIRECT_URL` set in Vercel env (not `DATABASE_URL`) — migrations bypass pgBouncer.

### Notes

- `prisma migrate deploy` is safe to re-run — it's idempotent (only applies unapplied migrations).
- Never run `prisma migrate dev` in production (it creates new migration files and may prompt interactively).
- Neon free tier: migrations execute against the direct connection. Ensure `DIRECT_URL` uses the non-pooled Neon host.

---

## 4. Cron Jobs

Cron jobs are configured in `vercel.json` and require `CRON_SECRET` to be set in both Vercel env and as the `Authorization: Bearer` header in `vercel.json`.

```json
{
  "crons": [
    { "path": "/api/cron/notifications", "schedule": "0 9 * * *" },
    { "path": "/api/cron/billing",       "schedule": "0 3 * * *" },
    { "path": "/api/cron/shop-metrics",  "schedule": "0 0 * * *" },
    { "path": "/api/cron/cleanup-photos","schedule": "0 4 * * 0" }
  ]
}
```

All cron handlers validate `Authorization: Bearer <CRON_SECRET>` and return 401 if the header is missing or wrong.

Verify cron execution in **Vercel Dashboard → Deployments → Functions → Cron**.

---

## 5. Health Check

```
GET /api/health
```

Returns `200` with `{ "status": "ok" }` when database and Redis (if configured) are reachable. Returns `503` when the database is down.

**Uptime monitor setup (Better Stack / UptimeRobot / Vercel):**
- URL: `https://your-domain.com/api/health`
- Method: GET
- Expected status: 200
- Check interval: 1 min
- Alert threshold: 2 consecutive failures

Vercel's built-in health checks can be configured under **Project → Settings → Health Checks**.

---

## 6. Observability

`lib/observability.ts` provides a swappable abstraction over error tracking and event logging.

### Current state (structured console logging)

All errors and events are emitted as JSON to stdout. Vercel captures these in **Dashboard → Deployments → Functions → Logs**.

```json
{ "type": "exception", "time": "...", "msg": "...", "stack": "...", "shopId": "..." }
{ "type": "event", "time": "...", "event": "booking.created", ... }
{ "type": "slow_span", "op": "prisma.query", "name": "...", "ms": 1200 }
```

### Adding Sentry

1. Install: `npm install @sentry/nextjs`
2. Run wizard: `npx @sentry/wizard@latest -i nextjs`
3. Set `SENTRY_DSN` in Vercel env
4. Replace the `captureException` stub in `lib/observability.ts` with `Sentry.captureException()`

### Adding Better Stack Logs

1. Create a source in Better Stack, get the ingestion token
2. Set `BETTERSTACK_SOURCE_TOKEN` in Vercel env
3. Replace console output in `lib/observability.ts` with Better Stack HTTP sink

---

## 7. Custom Tenant Domains

Shops can be served on custom domains (e.g. `mehmetberber.com`). The setup is:

1. Super-admin sets `Shop.customDomain` via the super-admin panel
2. Shop owner adds a CNAME record pointing their domain to Vercel
3. Super-admin adds the domain in Vercel Dashboard → Project → Domains
4. `proxy.js` (Next.js middleware) reads the `Host` header and resolves the tenant by `customDomain`

---

## 8. Post-Deploy Checklist

Run after every production deploy:

```bash
# Verify migrations applied
npx prisma migrate status

# Verify health
curl https://your-domain.com/api/health

# Spot-check a public shop page
curl https://your-domain.com/api/shops/<known-slug>
```

See `docs/PRODUCTION_CHECKLIST.md` for the full pre-launch checklist.

# MAKAS — Production Launch Checklist

Last updated: 2026-07-12

Use this checklist before every production deploy. Items marked ✅ are confirmed done by the team. Items marked ⬜ require action.

---

## 1. Environment Variables

Run `node -e "require('./lib/env')"` to verify all required vars are set.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ Always | Pooled (pgBouncer) |
| `DIRECT_URL` | ✅ Always | For migrations |
| `JWT_SECRET` | ✅ Prod | `openssl rand -hex 64` |
| `NETGSM_USER` | ✅ Prod | SMS notifications |
| `NETGSM_PASSWORD` | ✅ Prod | SMS notifications |
| `NETGSM_HEADER` | ⬜ Optional | Default: "MAKAS" |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ Prod | Image uploads |
| `CLOUDINARY_API_KEY` | ✅ Prod | Server-side signing |
| `CLOUDINARY_API_SECRET` | ✅ Prod | Server-side signing |
| `UPSTASH_REDIS_REST_URL` | ✅ Prod | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Prod | Distributed rate limiting |
| `CRON_SECRET` | ✅ Prod | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ Prod | e.g. `https://makas.furunci.tech` |
| `RESEND_API_KEY` | ⬜ Prod | Password reset emails |
| `GOOGLE_PLACES_API_KEY` | ⬜ Optional | Geocoding + Places |

---

## 2. Database

- [ ] `npx prisma migrate deploy` — apply all pending migrations
- [ ] Verify production DB has all 84 indexes (`SELECT count(*) FROM pg_indexes WHERE schemaname='public'`)
- [ ] Seed at least one shop + SUPER_ADMIN user (`prisma/create-superadmin.js`)
- [ ] Verify connection pooling is configured (pgBouncer or Neon's built-in)

---

## 3. Authentication & Security

- [ ] `JWT_SECRET` is a unique 64-byte hex string (never default)
- [ ] `CRON_SECRET` is set in both Vercel env AND `vercel.json` cron Authorization header
- [ ] `SUPER_ADMIN_IP_ALLOWLIST` set if platform console should be IP-restricted
- [ ] Cookie `secure: true` in production (auto-enforced — `NODE_ENV=production`)
- [ ] CSP headers active (verified in `next.config.mjs`)
- [ ] HSTS header active for production (auto, via `next.config.mjs`)

---

## 4. Third-Party Services

### Cloudinary
- [ ] Account created and cloud name matches `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] Upload preset configured (unsigned, folder: `makas-photos`)
- [ ] Max file size limit set in Cloudinary dashboard (recommend 10MB)

### Netgsm (SMS/WhatsApp)
- [ ] Account approved for SMS delivery
- [ ] OBD header (`NETGSM_HEADER`) registered with GSM operators
- [ ] Test SMS sent to a Turkish mobile number
- [ ] WhatsApp Business account approved (if using WhatsApp channel)

### Upstash Redis
- [ ] Database created in closest region to Vercel deployment
- [ ] REST URL and token copied to Vercel env

### Google Places (optional)
- [ ] Places API enabled in Google Cloud Console
- [ ] API key restricted to your domain + Places API only
- [ ] Billing alert set

### Resend Email (optional)
- [ ] Domain verified in Resend dashboard
- [ ] From address matches `EMAIL_FROM` env var
- [ ] SPF/DKIM records added to DNS

---

## 5. Performance

- [ ] `next build` completes without errors or warnings
- [ ] Largest JS bundle < 500KB (check `.next/analyze/` if `ANALYZE=true`)
- [ ] Images served from Cloudinary CDN (not raw base64)
- [ ] ISR (`revalidate = 300`) active on public shop pages
- [ ] API health check `/api/health` returns `{"status":"ok"}`

---

## 6. Testing

Run before every deploy:
```bash
npm test              # unit tests (46 tests)
npm run build         # production build check
npm run lint          # ESLint
```

---

## 7. Vercel Configuration

- [ ] `vercel.json` cron jobs configured and authorized
- [ ] All environment variables set in Vercel dashboard (not just `.env.local`)
- [ ] Custom domain DNS pointed to Vercel (if using custom domain)
- [ ] Preview deployments tested on a feature branch

---

## 8. Monitoring

- [ ] `/api/health` endpoint is being polled (set up uptime monitor in Vercel, Better Stack, or UptimeRobot)
- [ ] Alert on 5xx error rate > 1% 
- [ ] Alert on DB latency > 500ms (via health check)
- [ ] Vercel function logs reviewed after first deploy

---

## 9. Data Backup

- [ ] Neon database has auto-backup enabled (check Neon dashboard)
- [ ] Verify backup restore procedure is documented and tested
- [ ] Cloudinary media backups configured if >1GB of images

---

## 10. Post-Launch

- [ ] Create first real tenant: `POST /api/superadmin/shops`
- [ ] Set trial `trialEndsAt` appropriately
- [ ] Send first notification test: book + complete an appointment
- [ ] Verify review flow: complete appointment → SMS → review link → submit
- [ ] Verify cron is running: check Vercel cron logs 24h after deploy

---

## Known Risks Before Launch

| Risk | Severity | Mitigation |
|---|---|---|
| Payment integration not active | High | Manual subscription management via SUPER_ADMIN panel |
| Email delivery not verified | Medium | Test password reset flow end-to-end before launch |
| SMS quota exhaustion | Medium | Set Netgsm balance alert |
| In-process EventBus loses events on cold start | Low | Acceptable before AI; migrate to BackgroundJob table when AI ships |

---

## Next Milestone: Shipping to First Paying Customers

1. Wire iyzico payment → `lib/payments/iyzico.js` stub → `/api/payments/webhook`
2. Add billing dashboard for admins (currently shows plan info only)
3. Implement Phone OTP login (Netgsm already wired)
4. Load test with k6: target 100 concurrent bookings/min

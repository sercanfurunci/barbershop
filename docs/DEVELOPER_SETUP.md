# MAKAS — Developer Setup

## Prerequisites

- **Node.js 20+** (`node -v`)
- **PostgreSQL** — local install, Docker, or a [Neon](https://neon.tech) free tier project
- **Redis** — optional; Upstash REST API or local Redis. Without it, rate limiting falls back to an in-process bucket (single instance only, fine for dev).

---

## 1. Clone and install

```bash
git clone <repo-url> makas
cd makas
npm install
```

---

## 2. Environment variables

Copy the example file and fill in the required values:

```bash
cp .env.example .env.local
```

**Minimum required for local development:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL pooled connection string (pgBouncer format for Neon; plain for local). e.g. `postgresql://user:pass@localhost:5432/makas` |
| `DIRECT_URL` | Same as `DATABASE_URL` without pgBouncer for migrations. Required by `prisma.config.ts`. |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

Everything else is optional in dev. Missing production-required vars produce a console warning, not an error.

**Optional but recommended locally:**

| Variable | Description |
|---|---|
| `JWT_SECRET` | Falls back to `dev-secret-change-in-prod` if unset. Set it to anything for realistic JWT behaviour. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Image uploads won't work without this. |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Server-side image signing. |

See `.env.example` for the full list with inline comments.

---

## 3. Database setup

Run migrations (creates all tables):

```bash
npx prisma migrate dev
```

Generate the Prisma client (also runs automatically on `npm run build`):

```bash
npx prisma generate
```

Open Prisma Studio to browse data:

```bash
npx prisma studio
```

---

## 4. Start the dev server

```bash
npm run dev
```

The app is at `http://localhost:3000`.

**Build (includes `prisma generate`):**

```bash
npm run build
npm start
```

---

## 5. Seed demo data

**Full seed** (creates shop, barbers, services, admin user):

```bash
node prisma/seed.js
```

**Demo tenant** (creates the `/demo` auto-login barbershop):

```bash
node prisma/seed-demo.js
```

Default demo credentials:
- Email: `demo-admin@makas.tech`
- Password: `demo123`
- Login URL: `http://localhost:3000/demo` (auto-logs in)

**Create a super-admin account:**

```bash
SUPERADMIN_EMAIL=you@example.com SUPERADMIN_PASSWORD=secret node prisma/create-superadmin.js
```

---

## 6. Running tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Interactive UI
npm run test:ui
```

Tests live in `tests/unit/` (Vitest + jsdom). Integration tests are in `tests/integration/`. The test environment skips required env var validation (`NODE_ENV=test`).

---

## 7. Linting

```bash
npm run lint
```

---

## 8. Database management

| Command | Purpose |
|---|---|
| `npx prisma migrate dev` | Create + apply a migration during development |
| `npx prisma migrate deploy` | Apply pending migrations (used in CI/CD) |
| `npx prisma migrate reset` | Drop and recreate the database (dev only) |
| `npx prisma db push` | Push schema changes without creating a migration file (prototyping only) |
| `npx prisma studio` | Browse data in a web UI |

---

## 9. Useful scripts

```bash
node scripts/check-shops.mjs        # List all shops and their subscription status
node prisma/update-barbers.js       # Backfill barber data
```

---

## Project conventions

- **Services** (`lib/services/`) hold all business logic. Route handlers are thin HTTP adapters — no Prisma queries in routes directly (use a service).
- **Auth** flows through `lib/middleware/withRole.js`. Never trust `shopId` from the request body — always read it from the JWT payload (`payload.shopId`).
- **Response helpers** from `lib/apiResponse.js` — use `ok()`, `created()`, `err()`, `notFound()`, etc. instead of raw `NextResponse.json()`.
- **Dates** are stored as `"YYYY-MM-DD"` strings. Working hours are stored as minutes from midnight (`540` = 09:00). Use `lib/utils.js` helpers for conversions.

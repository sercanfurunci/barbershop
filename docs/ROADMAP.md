# Makas — Production Roadmap

Last updated: 2026-07-06

Unified web + mobile roadmap. Tags: ✅ Done · 🔨 In Progress · 🟡 Scaffolded (TODO) · ⬜ Future

---

## Phase 1 — Account System

| # | Feature | Backend | Mobile | Status |
|---|---------|---------|--------|--------|
| 1.1 | Guest booking (phone-only) | ✅ | ✅ | Done |
| 1.2 | Customer email/password registration | ✅ | ✅ | Done |
| 1.3 | Customer email/password login | ✅ | ✅ | Done |
| 1.4 | Guest appointments linked on register | ✅ | — | Done (phone match) |
| 1.5 | Token refresh / session management | ✅ | ✅ | Done |
| 1.6 | Phone OTP login | ⬜ | ⬜ | TODO: SMS provider |
| 1.7 | Google Sign In | ⬜ | ⬜ | TODO: OAuth |
| 1.8 | Apple Sign In (iOS) | ⬜ | ⬜ | TODO: Apple Dev |

```
// TODO: Phone OTP Login
// 1. POST /api/auth/otp/send — 6-digit code stored in Redis (10min TTL)
// 2. POST /api/auth/otp/verify — validate, upsert User by phone, return token
// 3. SMS via Netgsm (already wired in lib/netgsm.js)
// Requires: Upstash Redis ✅, Netgsm credentials in env ✅

// TODO: Google Sign In
// 1. Install expo-auth-session, expo-web-browser
// 2. Google OAuth client at console.cloud.google.com
// 3. POST /api/auth/google — verify id_token, upsert User

// TODO: Apple Sign In (iOS only)
// 1. Enable in Xcode + Apple Developer portal
// 2. Install expo-apple-authentication
// 3. POST /api/auth/apple — verify identity_token, upsert User
```

---

## Phase 2 — Customer Profile

| # | Feature | Backend | Mobile | Status |
|---|---------|---------|--------|--------|
| 2.1 | Profile fields (name, phone, birthday, gender) | ✅ | ✅ | Done |
| 2.2 | Notification preferences | ✅ | ✅ | Done |
| 2.3 | Favorite salons (backend-synced for accounts) | ✅ | ✅ | Done |
| 2.4 | Avatar upload | 🟡 | ⬜ | TODO: Cloudinary |
| 2.5 | Appointment history (authenticated) | ✅ | 🟡 | Backend done |
| 2.6 | Cancel appointment (customer) | ✅ | 🟡 | Backend done |
| 2.7 | Leave review from history | ✅ | 🟡 | Backend done |
| 2.8 | Reschedule appointment | ⬜ | ⬜ | Future |
| 2.9 | Favorite barbers | ⬜ | ⬜ | Future |

```
// TODO: Avatar Upload
// Reuse /api/uploads/sign (Cloudinary unsigned upload)
// Mobile: expo-image-picker → pick → upload → PATCH /customer/profile { avatarUrl }

// TODO: Wire authenticated appointment history in appointments.tsx
// If user is logged in (role === CUSTOMER): fetch GET /customer/appointments
// Else: keep existing phone-based lookup
// Add "Değerlendir" button on COMPLETED rows → in-app review modal
// Add "İptal Et" button on PENDING/CONFIRMED rows → POST /customer/appointments/:id/cancel
```

---

## Phase 3 — Salon Page

| # | Feature | Web | Mobile | Status |
|---|---------|-----|--------|--------|
| 3.1 | Hero gallery | ✅ | ✅ | Done |
| 3.2 | Team + barber cards | ✅ | ✅ | Done |
| 3.3 | Services list | ✅ | ✅ | Done |
| 3.4 | Working hours (derived from barbers) | ✅ | ✅ | Done |
| 3.5 | Address + Google Maps directions | ✅ | ✅ | Done |
| 3.6 | Call / WhatsApp | ✅ | ✅ | Done |
| 3.7 | Website / Instagram / Facebook / TikTok | ✅ | ✅ | Done |
| 3.8 | Rating summary + reviews | ✅ | ✅ | Done |
| 3.9 | FAQ section | 🟡 | ✅ | Schema TODO |
| 3.10 | Barber individual profile page | ✅ | ⬜ | Future |

```
// TODO: FAQ Schema
// model ShopFaq {
//   id        String @id @default(cuid())
//   shopId    String
//   shop      Shop   @relation(...)
//   question  String @db.Text
//   answer    String @db.Text
//   sortOrder Int    @default(0)
// }
// Add to GET /shops/:slug response
// Admin CRUD for FAQ items
```

---

## Phase 4 — Reviews

| # | Feature | Backend | Mobile | Status |
|---|---------|---------|--------|--------|
| 4.1 | SMS review link after COMPLETED | ✅ | — | Done (Netgsm) |
| 4.2 | In-app review submission | ✅ | 🟡 | Backend done |
| 4.3 | "Share on Google" CTA (≥4 stars) | ✅ | 🟡 | Backend returns URL |
| 4.4 | Push notification review reminder | 🟡 | 🟡 | TODO: Push provider |
| 4.5 | Rating breakdown bars | ✅ | ✅ | Done |

```
// Review Flow:
// COMPLETED → in history screen → "Değerlendir" button
//   → POST /api/customer/reviews { appointmentId, shopRating, barberRating, comment }
//   → response.googleReviewUrl (if rating ≥ 4 AND shop has it)
//   → show "Google'da Paylaş" → Linking.openURL(googleReviewUrl)
```

---

## Phase 5 — Notifications

| # | Feature | Status |
|---|---------|--------|
| 5.1 | SMS: confirmed, cancelled, reminders | ✅ Done (Netgsm) |
| 5.2 | Push token storage | ✅ Done |
| 5.3 | Push delivery worker | 🟡 TODO: FCM/Expo Push |
| 5.4 | Push: appointment confirmed | 🟡 TODO |
| 5.5 | Push: reminder 24h / 2h before | 🟡 TODO |
| 5.6 | Push: cancelled, review reminder | 🟡 TODO |
| 5.7 | Birthday / promotional push | ⬜ Future |

```
// TODO: Push Notification Worker
// Choose: Expo Push API (free, simple) OR Firebase FCM (more control)
// In /api/cron/notifications when channel === "PUSH":
//   → query PushToken by userId
//   → send via @expo-server-sdk/expo-server-sdk OR firebase-admin
//   → update NotificationJob.status
// PushToken schema ✅, NotificationJob.channel = "PUSH" ✅
```

---

## Phase 6 — Permissions (Mobile)

| # | Permission | Status |
|---|-----------|--------|
| 6.1 | Push notifications | ✅ On launch |
| 6.2 | Location | 🟡 TODO: before Map screen |
| 6.3 | Camera / Photo Library | 🟡 TODO: before avatar picker |
| 6.4 | Calendar | ⬜ Future |

```
// TODO: expo-location (included in SDK, no install needed)
// Request only when user opens Map tab:
// const { status } = await Location.requestForegroundPermissionsAsync();
// if (status !== 'granted') → show explanation, no crash

// TODO: expo-image-picker permissions for avatar
// await ImagePicker.requestMediaLibraryPermissionsAsync() before launching
```

---

## Phase 7 — Customer Home Improvements

| # | Feature | Status |
|---|---------|--------|
| 7.1 | Featured salons (scoring: rating+reviews+cover+fav) | ✅ Done |
| 7.2 | All salons (rating → reviews → name) | ✅ Done |
| 7.3 | Service tags on cards | ✅ Done |
| 7.4 | Recently viewed | 🟡 TODO: AsyncStorage list |
| 7.5 | Nearby salons (distance sort) | ⬜ TODO: expo-location |
| 7.6 | Category filter | ⬜ TODO: filter bar |
| 7.7 | Campaigns / promotions | ⬜ Future |
| 7.8 | Recommended (history-based) | ⬜ Future |

```
// TODO: Recently Viewed
// AsyncStorage key "recentlyViewed" → shopId[] (max 10, push to front on view)
// In salon/[slug].tsx mount: push shop.id to front of list
// Home screen: load IDs → fetch shop stubs → show horizontal scroll

// TODO: Nearby salons
// expo-location.getCurrentPositionAsync() → { latitude, longitude }
// GET /api/shops?lat=X&lng=Y → add Haversine sort on API
// Request permission only when user scrolls to "Yakın Salonlar" section
```

---

## Phase 8 — Search

| # | Feature | Status |
|---|---------|--------|
| 8.1 | By salon name / city / description | ✅ Done |
| 8.2 | By barber name | ✅ Done |
| 8.3 | By service name | ✅ Done |
| 8.4 | By district | ⬜ TODO: district field on Shop |
| 8.5 | Filter by category | ⬜ TODO |
| 8.6 | Filter by rating | ⬜ TODO (client-side) |
| 8.7 | Filter by open now | ⬜ TODO (compute from workingHours) |

---

## Phase 9 — Map Screen

```
// TODO: Map Screen — apps/mobile/app/(customer)/map.tsx
// 1. react-native-maps (or expo's built-in MapView)
// 2. Add "Harita" tab to (customer)/_layout.tsx
// 3. MapView + Marker per shop (latitude/longitude in schema ✅)
// 4. User location pin
// 5. Tap marker → bottom sheet with PremiumShopCard
// 6. Distance badge on cards (Haversine from user to shop)
// Shop lat/lng in schema ✅, nullable — populate via Google Places API
```

---

## Phase 10 — Booking

| # | Feature | Status |
|---|---------|--------|
| 10.1–10.6 | Full booking flow (service→barber→date→contact→summary→confirm) | ✅ Done |
| 10.7 | Autofill contact from account | 🟡 TODO |
| 10.8 | Add to calendar (ICS) | 🟡 TODO: Linking to ICS endpoint |
| 10.9 | Payment integration | ⬜ TODO: iyzico/Stripe |

```
// TODO: Autofill contact fields when user is logged in
// In book.tsx, before rendering contact step:
// if (user?.role === "CUSTOMER") prefill name/phone/email from user profile

// TODO: Payment
// /api/payments/checkout is scaffolded
// Mobile: expo-web-browser → redirect to payment URL → handle callback
```

---

## Phase 11 — Loyalty Infrastructure

```prisma
// TODO: Loyalty Schema
// model LoyaltyAccount {
//   id           String @id @default(cuid())
//   clientId     String @unique
//   shopId       String
//   points       Int    @default(0)
//   totalEarned  Int    @default(0)
//   totalRedeemed Int   @default(0)
// }
// model LoyaltyTransaction {
//   id            String   @id @default(cuid())
//   accountId     String
//   type          String   // "earn" | "redeem" | "expire"
//   points        Int
//   reason        String   // "appointment_completed" | "referral" | "birthday_bonus"
//   appointmentId String?
//   createdAt     DateTime @default(now())
// }
// Earn rate: configurable per shop (e.g. 1 point per ₺1 spent)
// Redeem: 100 points = ₺10 discount
```

---

## Phase 12 — Security

| # | Feature | Status |
|---|---------|--------|
| 12.1 | JWT + tokenVersion (logout invalidation) | ✅ Done |
| 12.2 | bcrypt password hashing | ✅ Done |
| 12.3 | Rate limiting (login, register) | ✅ Done |
| 12.4 | Token in SecureStore (mobile) | ✅ Done |
| 12.5 | httpOnly cookie (web) | ✅ Done |
| 12.6 | Input sanitization | ✅ Prisma parameterized |
| 12.7 | Biometric login | ⬜ TODO |
| 12.8 | Super admin IP allowlist | 🟡 Ready in middleware.js |

```typescript
// TODO: Biometric login
// import * as LocalAuthentication from 'expo-local-authentication';
// App opens → token exists → prompt biometric → on success → proceed
// This is UI-only — JWT stays in SecureStore, biometric just gates the UI
// Add toggle: profile settings → "Biyometrik Giriş"
```

---

## Phase 13 — Analytics Events

```typescript
// TODO: Fire analytics events from mobile
// POST /api/events { shopId, eventType, metadata } — already exists, non-blocking
// On salon detail mount: "SHOP_VIEWED" { shopId }
// On book.tsx step 1: "BOOKING_STARTED" { shopId }
// On booking confirmed: "BOOKING_COMPLETED" { shopId, serviceId, barberId }
// On review submitted: "REVIEW_SUBMITTED" { shopId }
// Fire-and-forget: api.post("/events", payload).catch(() => {})
```

---

## Architecture: Future Capabilities

| Capability | Approach |
|-----------|---------|
| Payments | iyzico (TR) / Stripe — /api/payments scaffolded |
| SMS | Netgsm — already wired |
| WhatsApp | Netgsm — already wired |
| Email | Add Resend/Sendgrid to lib/email.js |
| Multi-branch | Shop.parentId (nullable FK) |
| Marketplace mode | shopId = null on listings |
| Coupons | LoyaltyTransaction (see Phase 11) |

## Migration Required

```bash
# After pulling schema changes:
npx prisma migrate dev --name customer-accounts-push-favorites

# New tables: PushToken, CustomerFavorite
# New columns on User: phone, birthday, gender, avatarUrl, notifAppt, notifReminder, notifPromo
# New column on Shop: website
```

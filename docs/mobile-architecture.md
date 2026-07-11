# Mobile Architecture

## Overview

Single Expo React Native app serving two user types:
- **Customers**: Browse salons, book appointments, manage bookings
- **Business users**: Dashboard, appointments, calendar, customers (ADMIN/BARBER/SUPER_ADMIN)

One account can hold both identities. Mode is selected at launch and persisted.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54, React Native 0.79 |
| Navigation | Expo Router v5 (file-based) |
| State | Zustand (in-memory) |
| Persistence | SecureStore (token), AsyncStorage (mode, favorites) |
| Server state | TanStack Query v5 |
| HTTP | Axios with 401-refresh interceptor |
| Styling | NativeWind v4 (Tailwind) + inline StyleSheet |
| Fonts | Outfit via @expo-google-fonts |
| Images | Cloudinary (signed upload from backend) |
| Notifications | expo-notifications |
| Build | EAS Build (development/preview/production) |

## App Architecture

```
Root (_layout.tsx)
  └── Providers: GestureHandlerRootView, QueryClientProvider, ErrorBoundary
        └── app/index.tsx  ← traffic director
              ├── (welcome)/       ← unauthenticated, no stored mode
              ├── (mode-select)/   ← authenticated, no stored mode
              ├── (auth)/login     ← business login
              ├── (customer)/      ← customer tabs
              └── (business)/      ← business tabs
```

## Navigation Flow

```
App open
  │
  ├── isLoading (auth bootstrap)  →  spinner
  │
  ├── mode = null + no user       →  (welcome)
  │     ├── "Kuaför Bul"          →  set mode=customer → (customer)
  │     └── "İşletme Girişi"      →  set mode=business → (auth)/login
  │
  ├── mode = null + user          →  (mode-select)
  │     ├── "Müşteri"             →  set mode=customer → (customer)
  │     └── "İşletme"             →  set mode=business → (business)
  │
  ├── mode = customer             →  (customer) tabs
  │
  └── mode = business
        ├── user exists           →  (business) tabs
        └── no user               →  (auth)/login
```

## Role Flow

```
SUPER_ADMIN / ADMIN    → full business dashboard (all tabs visible)
BARBER                 → business dashboard (no customers tab)
No role (customer)     → customer tabs only
Dual (business + customer) → mode switcher in Profile tab
```

## Authentication Flow

```
1. App opens → tokenStore.get() (SecureStore)
2. Token found → authService.me() → populate useAuthStore
3. Token missing → user = null
4. API returns 401 → interceptor → POST /api/auth/refresh → retry
5. Refresh fails → tokenStore.delete() → user = null → redirect to (auth)/login or (welcome)
6. Logout → tokenStore.delete() + useAuthStore.clear() + queryClient.clear() + setMode(null)
```

## API Communication

- Base URL: `EXPO_PUBLIC_API_URL` (env var, set per network)
- All requests: `Authorization: Bearer <token>` header set by Axios interceptor
- Public endpoints (shop browse, availability): no auth header needed — interceptor only adds header if token exists
- Error shape: `{ error: string }` from all API endpoints

## Deep Linking

Scheme: `makas://`

| URL | Destination |
|---|---|
| `makas://shop/[slug]` | (customer)/salon/[slug] |
| `makas://appointment/[id]` | (customer)/appointments?id=[id] |
| `makas://review/[id]` | review flow |
| `makas://customer/history` | (customer)/appointments |

QR code in salon → `makas://shop/[slug]` → switches to customer mode if needed, opens salon detail.

## Push Notification Architecture

### Registration
```
POST /api/notifications/push-token
{ token: string, mode: "customer" | "business" }
```

### Customer notifications
- Appointment confirmed
- Appointment reminder (24h before)
- Review request (after appointment)

### Business notifications  
- New appointment
- Appointment cancelled
- Walk-in alert
- Daily revenue summary

### Channels (future)
- Push (expo-notifications)
- WhatsApp (via backend)
- SMS
- Email (Resend)

## Offline Strategy

Phase 1 (current): React Query staleTime + gcTime provides short-term cache.

Phase 2 (future): `@tanstack/react-query-persist-client` + AsyncStorage persists cache to disk. Appointments, customers, services, profile survive app restart. Sync on reconnect via React Query's `refetchOnReconnect`.

Critical writes (new booking, status change) are queued when offline and flushed on reconnect.

## Folder Structure

```
apps/mobile/
  app/
    _layout.tsx              # Root providers + bootstrap
    index.tsx                # Traffic director
    (welcome)/index.tsx      # First launch screen
    (mode-select)/index.tsx  # Role picker (post-login)
    (auth)/
      _layout.tsx
      login.tsx
    (customer)/
      _layout.tsx            # 5 customer tabs
      index.tsx              # Home
      search.tsx             # Search
      appointments.tsx       # My bookings
      favorites.tsx          # Saved salons
      profile.tsx            # Profile + mode switch
      salon/[slug].tsx       # Salon detail (future)
      booking/[shopSlug].tsx # Booking flow (future)
    (business)/
      _layout.tsx            # 5 business tabs
      index.tsx              # Dashboard
      appointments.tsx       # Appointments
      calendar.tsx           # Calendar
      customers.tsx          # Customers
      profile.tsx            # Profile + mode switch
  components/
    ErrorBoundary.tsx
    ui/
      EmptyState.tsx
  hooks/
    useAuth.ts
    useAppointments.ts
  services/
    api.ts                   # Axios + 401 interceptor
    auth.ts
    appointments.ts
    shops.ts                 # Public shop queries
    uploads.ts
  store/
    auth.ts                  # User + token (in-memory)
    mode.ts                  # App mode (AsyncStorage)
    favorites.ts             # Customer favorites (AsyncStorage)
  types/
    api.ts                   # User, Appointment, PublicShop, etc.
  utils/
    queryKeys.ts
    constants.ts
    format.ts
  theme/
    colors.ts
    typography.ts
```

## Future Expansion

| Feature | Approach |
|---|---|
| Customer auth | Add CUSTOMER role to backend User; extend auth flow |
| WhatsApp booking | Backend webhook → push notification |
| Loyalty / memberships | New Prisma models; exposed via existing REST pattern |
| Online payments | iyzico integration on backend; mobile shows payment sheet |
| Offline writes | React Query mutation queuing + AsyncStorage journal |
| Tablet support | Expo Router layouts + responsive StyleSheet |
| Camera | expo-camera + expo-media-library; existing /uploads/sign endpoint |

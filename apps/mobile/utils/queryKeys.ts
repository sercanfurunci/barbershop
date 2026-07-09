// Centralized query key factory — prevents key drift across hooks and screens.
// Every useQuery/useMutation that touches the server must use these keys.
export const queryKeys = {
  appointments: {
    all:      () => ["appointments"] as const,
    filtered: (f: object) => ["appointments", f] as const,
  },
  stats: {
    all:    () => ["stats"] as const,
    byShop: (shopId: string) => ["stats", shopId] as const,
  },
  clients: {
    all:    () => ["clients"] as const,
    byShop: (shopId: string) => ["clients", shopId] as const,
  },
  barbers: {
    all:    () => ["barbers"] as const,
    byShop: (shopId: string) => ["barbers", shopId] as const,
  },
  services: {
    all:    () => ["services"] as const,
    byShop: (shopId: string) => ["services", shopId] as const,
  },
  availability: {
    day:   (p: { shopId: string; barberId: string; serviceId: string; date: string }) =>
      ["availability", "day", p] as const,
    range: (p: { shopId: string; barberId: string; serviceId: string; from: string; to: string }) =>
      ["availability", "range", p] as const,
  },
  shops: {
    all: () => ["shops"] as const,
    filtered: (f: Record<string, unknown>) => ["shops", f] as const,
    bySlug: (slug: string) => ["shops", slug] as const,
    reviews: (slug: string) => ["shops", slug, "reviews"] as const,
  },
  publicAppointments: {
    byPhone: (phone: string) => ["publicAppointments", phone] as const,
  },
  customer: {
    profile:      () => ["customer", "profile"] as const,
    favorites:    () => ["customer", "favorites"] as const,
    appointments: () => ["customer", "appointments"] as const,
  },
  staff: {
    list:     (shopId: string) => ["staff", shopId] as const,
    detail:   (id: string)     => ["staff", "detail", id] as const,
    holidays: (shopId: string) => ["staff", "holidays", shopId] as const,
    myLeave:  ()               => ["staff", "my-leave"] as const,
  },
};

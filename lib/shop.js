import { prisma } from "@/lib/prisma";

// Default shop slug used by public endpoints (services list, barber list,
// availability lookup, booking submission) until tenant routing exists.
// Set MAKAS_DEFAULT_SHOP_SLUG to override (useful for multi-shop staging).
export const DEFAULT_SHOP_SLUG =
  process.env.MAKAS_DEFAULT_SHOP_SLUG || "abdurrahman";

let cachedDefaultShopId = null;

// Resolve the public-facing shop for unauthenticated traffic.
// Cached in module scope — the default shop slug doesn't change at runtime.
export async function getDefaultShopId() {
  if (cachedDefaultShopId) return cachedDefaultShopId;
  const shop = await prisma.shop.findUnique({
    where: { slug: DEFAULT_SHOP_SLUG },
    select: { id: true, status: true },
  });
  if (!shop) {
    throw new Error(
      `Default shop "${DEFAULT_SHOP_SLUG}" not found. Run prisma migrate and seed.`,
    );
  }
  cachedDefaultShopId = shop.id;
  return shop.id;
}

// Authenticated routes call this to get the shopId for queries.
// SUPER_ADMIN's payload has shopId = null; they must pass ?shopId= explicitly.
// Everyone else is scoped to the shopId baked into their JWT.
export function getShopIdFromPayload(payload, { allowQuery } = {}) {
  if (!payload) return null;
  if (payload.role === "SUPER_ADMIN") {
    return allowQuery ?? null; // SUPER_ADMIN supplies shopId via query/body
  }
  return payload.shopId ?? null;
}

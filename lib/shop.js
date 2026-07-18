import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Resolve shop by slug — deduplicated per request via React cache().
// Layout and page both call this; they share the same DB hit.
export const resolveShopBySlug = cache(async (slug) => {
  if (!slug) return null;
  return prisma.shop.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true, slug: true, name: true, logo: true, coverImage: true,
      address: true, addressLine: true, city: true,
      latitude: true, longitude: true,
      phone: true, whatsappNumber: true, email: true,
      description: true, about: true,
      ownerName: true, foundedYear: true, shopType: true,
      instagramUrl: true, facebookUrl: true, tiktokUrl: true,
      gallery: true,
      social: true, timezone: true, status: true,
      subscriptionStatus: true, planTier: true, trialEndsAt: true,
      googlePlaceId: true, mapsEmbed: true, customDomain: true,
      avgRating: true, totalReviews: true,
      aiChatEnabled: true,
      // googlePlacesKey intentionally omitted — sensitive, server-side only
    },
  });
});

// ponytail: add hostname → slug mapping here when subdomain tenancy goes live
export function resolveShopFromHost(_host) {
  return null;
}

// Authenticated routes call this to get the shopId for queries.
// SUPER_ADMIN's payload has shopId = null; they must pass ?shopId= explicitly.
// Everyone else is scoped to the shopId baked into their JWT.
export function getShopIdFromPayload(payload, { allowQuery } = {}) {
  if (!payload) return null;
  if (payload.role === "SUPER_ADMIN") {
    return allowQuery ?? null;
  }
  return payload.shopId ?? null;
}

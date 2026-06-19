import { notFound } from "next/navigation";
import { resolveShopBySlug } from "@/lib/shop";
import { prisma } from "@/lib/prisma";
import ShopProvider from "@/contexts/ShopContext";

export default async function ShopLayout({ children, params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop || shop.status !== "ACTIVE") notFound();

  // Build embed URL server-side so the API key never reaches the client raw
  let mapsEmbed = shop.mapsEmbed ?? null;
  if (!mapsEmbed && shop.googlePlaceId) {
    const keyRow = await prisma.shop.findUnique({
      where: { id: shop.id },
      select: { googlePlacesKey: true },
    });
    const key = keyRow?.googlePlacesKey ?? process.env.GOOGLE_PLACES_API_KEY;
    if (key) mapsEmbed = `https://www.google.com/maps/embed/v1/place?key=${key}&q=place_id:${shop.googlePlaceId}&language=tr`;
  }

  return <ShopProvider shop={{ ...shop, mapsEmbed }}>{children}</ShopProvider>;
}

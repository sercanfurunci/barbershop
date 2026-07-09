import type { PublicShop, CoverStyle } from "@/types/api";

const STREET_VIEW_PATTERNS = [
  "maps.googleapis.com",
  "streetviewpixels",
  "maps.google.com/maps/api/streetview",
  "cbk0.google.com",
  "geo0.ggpht.com",
];

function isStreetView(url: string): boolean {
  return STREET_VIEW_PATTERNS.some((p) => url.includes(p));
}

// Returns the best cover URI respecting the shop's configured coverStyle.
// Falls back gracefully: no Street View, no broken logic.
export function shopCoverUri(
  shop: Pick<PublicShop, "coverImage" | "gallery" | "logo" | "featuredImage" | "mobileSettings">
): string | null {
  const style: CoverStyle = (shop.mobileSettings?.coverStyle as CoverStyle) ?? "auto";
  const gallery = shop.gallery ?? [];
  const featured = shop.featuredImage ?? null;

  switch (style) {
    case "custom":
      if (shop.coverImage && !isStreetView(shop.coverImage)) return shop.coverImage;
      return null;

    case "gallery_hero":
      // featured image first, then gallery[0]
      if (featured && gallery.includes(featured)) return featured;
      if (gallery.length > 0) return gallery[0];
      return null;

    case "logo_hero":
      return null; // caller renders logo-on-gradient when null + logo present

    case "no_hero":
      return null; // caller skips hero entirely when coverStyle === "no_hero"

    case "auto":
    default:
      // featured > coverImage > gallery[0] > null (logo gradient handled by caller)
      if (featured) return featured;
      if (shop.coverImage && !isStreetView(shop.coverImage)) return shop.coverImage;
      if (gallery.length > 0) return gallery[0];
      return null;
  }
}

// Returns true when the salon page should render no hero section at all.
export function shopHeroMode(
  shop: Pick<PublicShop, "mobileSettings">
): CoverStyle {
  return (shop.mobileSettings?.coverStyle as CoverStyle) ?? "auto";
}

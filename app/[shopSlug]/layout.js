import { notFound } from "next/navigation";
import { resolveShopBySlug } from "@/lib/shop";
import ShopProvider from "@/contexts/ShopContext";

export default async function ShopLayout({ children, params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop || shop.status !== "ACTIVE") notFound();
  return <ShopProvider shop={shop}>{children}</ShopProvider>;
}

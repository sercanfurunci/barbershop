import { prisma } from "@/lib/prisma";

const BASE = "https://makas.furunci.tech";

export default async function sitemap() {
  const shops = await prisma.shop.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
  }).catch(() => []);

  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/kullanim-kosullari`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/cerez-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...shops.map((s) => ({
      url: `${BASE}/${s.slug}`,
      lastModified: s.updatedAt ?? now,
      changeFrequency: "daily",
      priority: 0.8,
    })),
  ];
}

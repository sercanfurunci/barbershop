import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Platform hosts that should never be rewritten — landing page + admin live here.
// Add prod domain(s) below as they go live.
const PLATFORM_HOSTS = new Set([
  "makas.tech",
  "www.makas.tech",
  "makas.furunci.tech",
  "localhost",
  "localhost:3000",
  "127.0.0.1",
  "127.0.0.1:3000",
]);

// In-process cache: host → slug (or null = "not a custom domain").
// ponytail: per-instance Map, 5 min TTL. Swap for Redis if instances proliferate
// or if you need cache invalidation on customDomain updates faster than 5 min.
const cache = new Map();
const TTL_MS = 5 * 60 * 1000;

async function resolveSlug(host) {
  const hit = cache.get(host);
  const now = Date.now();
  if (hit && hit.expires > now) return hit.slug;

  const shop = await prisma.shop.findUnique({
    where: { customDomain: host },
    select: { slug: true },
  });
  const slug = shop?.slug ?? null;
  cache.set(host, { slug, expires: now + TTL_MS });
  return slug;
}

export async function proxy(request) {
  const host = request.headers.get("host")?.toLowerCase();
  if (!host) return NextResponse.next();

  // Platform domain or Vercel preview → no rewrite, serve as-is.
  if (PLATFORM_HOSTS.has(host) || host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  const slug = await resolveSlug(host);
  if (!slug) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Already prefixed → leave alone (defensive).
  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${slug}` : `/${slug}${pathname}`;
  return NextResponse.rewrite(url);
}

// Skip assets, image opt, API (already shop-scoped via body), and any path with a file extension.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};

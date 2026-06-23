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

// ponytail: opt-in super-admin IP allowlist. Unset = no enforcement.
const SUPERADMIN_PATH = /^\/(superadmin|api\/superadmin)(\/|$)/;
const TRUSTED_PROXY_HOPS = 0;

function clientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return null;
  const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
  return ips[Math.max(0, TRUSTED_PROXY_HOPS)] ?? null;
}

function checkSuperadminAllowlist(req) {
  if (!SUPERADMIN_PATH.test(req.nextUrl.pathname)) return null;
  const allowlist = process.env.SUPER_ADMIN_IP_ALLOWLIST;
  if (!allowlist) return null;
  const allowed = new Set(allowlist.split(",").map((s) => s.trim()).filter(Boolean));
  const ip = clientIp(req);
  if (ip && allowed.has(ip)) return null;
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

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
  const blocked = checkSuperadminAllowlist(request);
  if (blocked) return blocked;

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

// Skip assets, image opt, most API (already shop-scoped via body), and any path with a file extension.
// /api/superadmin is allow-listed so the IP-allowlist check above can run.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
    "/api/superadmin/:path*",
  ],
};

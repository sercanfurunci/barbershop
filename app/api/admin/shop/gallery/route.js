import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { uploadShopAsset, deleteShopAsset } from "@/lib/cloudinary";
import { validateImageDataUrl } from "@/lib/validation";
import { withRole } from "@/lib/middleware/withRole";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const GALLERY_MAX = 12;

function resolveShopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// The public shop page is ISR-cached (`revalidate = 300`). Without this call,
// gallery edits stay invisible to visitors for up to 5 minutes. Custom-domain
// hosts route to the same underlying `/${slug}` so one revalidate covers both.
function revalidateShopPage(slug) {
  if (!slug) return;
  try { revalidatePath(`/${slug}`); } catch {}
}

// POST { dataUrl } — appends one image to gallery (max 12)
export const POST = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const ip = getIp(request);
  const rl = await rateLimit(`shop-gallery:${ip}`, { limit: 30, windowMs: 5 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });
  }

  const shopId = resolveShopId(payload, request);
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const { dataUrl } = await request.json().catch(() => ({}));
  const err = validateImageDataUrl(dataUrl);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const current = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true, gallery: true } });
  const existing = current?.gallery ?? [];
  if (existing.length >= GALLERY_MAX) {
    return NextResponse.json({ error: `Galeri en fazla ${GALLERY_MAX} fotoğraf alır` }, { status: 400 });
  }

  const slot = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { url } = await uploadShopAsset(dataUrl, shopId, "gallery", slot);

  // ponytail: atomic push avoids race where two concurrent appends both read the
  // same `existing` array and clobber each other — array_append is one statement.
  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { gallery: { push: url } },
    select: { gallery: true },
  });
  revalidateShopPage(current?.slug);
  return NextResponse.json(updated);
});

// PUT { order: string[] } — reorder gallery. Must be a permutation of the
// existing URLs (no add/remove here, just sort).
export const PUT = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopId = resolveShopId(payload, request);
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const { order } = await request.json().catch(() => ({}));
  if (!Array.isArray(order) || !order.every((u) => typeof u === "string")) {
    return NextResponse.json({ error: "order: string[] bekleniyor" }, { status: 400 });
  }

  const current = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true, gallery: true } });
  const existing = current?.gallery ?? [];
  if (order.length !== existing.length || new Set(order).size !== new Set(existing).size
      || order.some((u) => !existing.includes(u))) {
    return NextResponse.json({ error: "order mevcut galeriyle eşleşmiyor" }, { status: 400 });
  }

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { gallery: order },
    select: { gallery: true },
  });
  revalidateShopPage(current?.slug);
  return NextResponse.json(updated);
});

// DELETE { index } — removes one image by index (so we don't need an extra row id)
export const DELETE = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopId = resolveShopId(payload, request);
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const { index } = await request.json().catch(() => ({}));
  const idx = Number(index);
  if (!Number.isInteger(idx) || idx < 0) {
    return NextResponse.json({ error: "Geçersiz index" }, { status: 400 });
  }

  const current = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true, gallery: true } });
  const list = current?.gallery ?? [];
  if (idx >= list.length) return NextResponse.json({ error: "Index dışı" }, { status: 400 });

  const [removed] = list.splice(idx, 1);

  // Update DB first — if Cloudinary fails we have an orphan asset (harmless) not a broken URL.
  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { gallery: list },
    select: { gallery: true },
  });
  if (removed) await deleteShopAsset(removed).catch(() => {});
  revalidateShopPage(current?.slug);
  return NextResponse.json(updated);
});

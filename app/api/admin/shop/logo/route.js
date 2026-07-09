import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { uploadShopAsset, deleteShopAsset } from "@/lib/cloudinary";
import { validateImageDataUrl } from "@/lib/validation";

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN"];

function guard(payload) {
  if (!payload) return { error: unauthorized() };
  if (!ALLOWED_ROLES.includes(payload.role)) return { error: forbidden() };
  if (payload.role === "SUPER_ADMIN") return { shopId: null };
  if (!payload.shopId) return { error: forbidden() };
  return { shopId: payload.shopId };
}

async function resolveShopId(request, g) {
  return g.shopId ?? new URL(request.url).searchParams.get("shopId");
}

export async function POST(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  const ip = getIp(request);
  const rl = await rateLimit(`shop-logo:${ip}`, { limit: 10, windowMs: 5 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });
  }

  const shopId = await resolveShopId(request, g);
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const { dataUrl } = await request.json().catch(() => ({}));
  const err = validateImageDataUrl(dataUrl);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { url } = await uploadShopAsset(dataUrl, shopId, "logo");
  const shop = await prisma.shop.update({
    where: { id: shopId },
    data: { logo: url },
    select: { logo: true },
  });
  return NextResponse.json(shop);
}

export async function DELETE(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  const shopId = await resolveShopId(request, g);
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const current = await prisma.shop.findUnique({ where: { id: shopId }, select: { logo: true } });
  if (current?.logo) await deleteShopAsset(current.logo);

  await prisma.shop.update({ where: { id: shopId }, data: { logo: null } });
  return NextResponse.json({ logo: null });
}

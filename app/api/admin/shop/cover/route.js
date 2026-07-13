import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { uploadShopAsset, deleteShopAsset } from "@/lib/cloudinary";
import { validateImageDataUrl } from "@/lib/validation";
import { withRole } from "@/lib/middleware/withRole";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

function resolveShopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

export const POST = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const ip = getIp(request);
  const rl = await rateLimit(`shop-cover:${ip}`, { limit: 10, windowMs: 5 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });
  }

  const shopId = resolveShopId(payload, request);
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const { dataUrl } = await request.json().catch(() => ({}));
  const err = validateImageDataUrl(dataUrl);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { url } = await uploadShopAsset(dataUrl, shopId, "cover");
  const shop = await prisma.shop.update({
    where: { id: shopId },
    data: { coverImage: url },
    select: { coverImage: true },
  });
  return NextResponse.json(shop);
});

export const DELETE = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopId = resolveShopId(payload, request);
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const current = await prisma.shop.findUnique({ where: { id: shopId }, select: { coverImage: true } });
  if (current?.coverImage) await deleteShopAsset(current.coverImage);

  await prisma.shop.update({ where: { id: shopId }, data: { coverImage: null } });
  return NextResponse.json({ coverImage: null });
});

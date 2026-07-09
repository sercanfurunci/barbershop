import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Accepted upload kinds and their folder + transform config
const KINDS = {
  "customer-avatar": {
    folder:     () => `makas/customers`,
    publicId:   (ids) => `makas/customers/${ids.userId}`,
    eager:      "c_fill,g_face,w_400,h_400/q_auto:good,f_auto",
    roles:      ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
  },
  "barber-avatar": {
    folder:     (ids) => `makas/barbers`,
    publicId:   (ids) => `makas/barbers/${ids.barberId}`,
    eager:      "c_fill,g_auto,w_800,h_800/q_auto:good,f_auto",
    roles:      ["ADMIN", "SUPER_ADMIN", "BARBER"],
  },
  "shop-logo": {
    folder:     (ids) => `makas/shops/${ids.shopId}`,
    publicId:   (ids) => `makas/shops/${ids.shopId}/logo`,
    eager:      "c_fit,w_512,h_512/q_auto:good,f_auto",
    roles:      ["ADMIN", "SUPER_ADMIN"],
  },
  "shop-cover": {
    folder:     (ids) => `makas/shops/${ids.shopId}`,
    publicId:   (ids) => `makas/shops/${ids.shopId}/cover`,
    eager:      "c_fill,g_auto,w_1920,h_1080/q_auto:good,f_auto",
    roles:      ["ADMIN", "SUPER_ADMIN"],
  },
  "shop-gallery": {
    folder:     (ids) => `makas/shops/${ids.shopId}/gallery`,
    publicId:   (ids) => `makas/shops/${ids.shopId}/gallery/${ids.slot ?? Date.now()}`,
    eager:      "c_limit,w_1600,h_1600/q_auto:good,f_auto",
    roles:      ["ADMIN", "SUPER_ADMIN"],
  },
};

// POST /api/uploads/sign
// body: { kind, barberId?, shopId?, slot? }
// Returns signed Cloudinary upload params — client posts directly to Cloudinary.
// Server never handles image bytes, keeping payloads small and API fast.
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const { kind, barberId, shopId, slot } = body;

  const cfg = KINDS[kind];
  if (!cfg) {
    return NextResponse.json({ error: "Geçersiz upload türü" }, { status: 400 });
  }

  if (!cfg.roles.includes(payload.role)) return forbidden();

  // BARBER role: can only sign for their own barberId
  if (payload.role === "BARBER" && kind === "barber-avatar" && barberId !== payload.barberId) {
    return forbidden();
  }

  // CUSTOMER: can only upload their own avatar
  if (kind === "customer-avatar" && payload.role !== "CUSTOMER") return forbidden();

  // ADMIN: scoped to their shop
  const effectiveShopId = payload.role === "SUPER_ADMIN" ? shopId : payload.shopId;
  if (!effectiveShopId && kind !== "barber-avatar" && kind !== "customer-avatar") {
    return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });
  }

  const ids = { barberId, shopId: effectiveShopId, slot, userId: payload.userId };
  const publicId  = cfg.publicId(ids);
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = { public_id: publicId, timestamp, eager: cfg.eager, overwrite: true };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

  return NextResponse.json({
    signature,
    timestamp,
    public_id:  publicId,
    eager:      cfg.eager,
    overwrite:  true,
    api_key:    process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  });
}

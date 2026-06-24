import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Upload a base64 data URL or existing URL to Cloudinary.
// Stores under makas/barbers/<barberId> so delete is cheap (known public_id).
export async function uploadBarberPhoto(dataUrl, barberId) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY_CLOUD_NAME env var is not set");
  }
  const result = await cloudinary.uploader.upload(dataUrl, {
    public_id:     `makas/barbers/${barberId}`,
    overwrite:     true,
    resource_type: "image",
    transformation: [
      { width: 800, height: 800, crop: "fill", gravity: "auto" },
      { quality: "auto:good", fetch_format: "auto" },
    ],
  });
  return result.secure_url;
}

// Deletes the stored photo. Safe to call even if no photo exists.
export async function deleteBarberPhoto(barberId) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return;
  await cloudinary.uploader.destroy(`makas/barbers/${barberId}`).catch(() => {});
}

// ─── Shop assets ──────────────────────────────────────────────────────────────
// Cover (16:9 banner), logo (square), gallery (free aspect). Cloudinary strips
// EXIF by default and `f_auto,q_auto` handles WebP delivery + compression.

const SHOP_TRANSFORMS = {
  cover:   { width: 1920, height: 1080, crop: "fill", gravity: "auto" },
  logo:    { width: 512,  height: 512,  crop: "fit"                  },
  gallery: { width: 1600, height: 1600, crop: "limit"                },
};

export async function uploadShopAsset(dataUrl, shopId, kind, slot = null) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY_CLOUD_NAME env var is not set");
  }
  if (!SHOP_TRANSFORMS[kind]) throw new Error(`unknown shop asset kind: ${kind}`);
  // gallery uses a slot so we can upload multiple deterministic public_ids
  const id = kind === "gallery"
    ? `makas/shops/${shopId}/gallery/${slot ?? Date.now()}`
    : `makas/shops/${shopId}/${kind}`;
  const result = await cloudinary.uploader.upload(dataUrl, {
    public_id:     id,
    overwrite:     true,
    resource_type: "image",
    transformation: [
      SHOP_TRANSFORMS[kind],
      { quality: "auto:good", fetch_format: "auto" },
    ],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteShopAsset(publicIdOrUrl) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !publicIdOrUrl) return;
  // accept either a Cloudinary URL or a raw public_id
  const m = /\/upload\/(?:[^/]+\/)*v\d+\/(.+)\.[a-z]+$/.exec(publicIdOrUrl);
  const publicId = m ? m[1] : publicIdOrUrl;
  await cloudinary.uploader.destroy(publicId).catch(() => {});
}

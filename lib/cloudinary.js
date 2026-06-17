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

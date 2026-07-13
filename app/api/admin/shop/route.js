import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";
import {
  validateHttpUrl, normalizePhoneTR, sanitizeString, validateLatLng, SHOP_TYPES,
} from "@/lib/validation";
import { ok, err, badRequest, notFound, tooManyRequests } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const PROFILE_SELECT = {
  id: true, name: true, slug: true,
  logo: true, coverImage: true, gallery: true,
  address: true, addressLine: true, city: true,
  latitude: true, longitude: true,
  formattedAddress: true, locationUpdatedAt: true,
  phone: true, whatsappNumber: true, email: true,
  description: true, about: true,
  ownerName: true, foundedYear: true, shopType: true,
  instagramUrl: true, facebookUrl: true, tiktokUrl: true, website: true,
  social: true,
  googlePlaceId: true, googlePlacesKey: true, googleReviewUrl: true, mapsEmbed: true,
  reviewReminderEnabled: true,
  timezone: true, currency: true, status: true,
};

// google.com (and any *.google.com subdomain). Reject look-alikes like
// "evilgoogle.com" by checking exact match or strict subdomain suffix.
function isGoogleHost(host) {
  const h = host.toLowerCase();
  return h === "google.com" || h.endsWith(".google.com");
}

function resolveShopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/shop — full shop profile
export const GET = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopId = resolveShopId(payload, request);
  if (!shopId) return badRequest("shopId gerekli");

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: PROFILE_SELECT,
  });

  if (!shop) return notFound("Salon bulunamadı");
  return ok(shop);
});

// PATCH /api/admin/shop — update shop settings + salon profile
export const PATCH = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  // ponytail: 20 PATCH / 5 min per IP per shop is plenty for a manual edit form.
  const ip = getIp(request);
  const rl = await rateLimit(`shop-profile:${ip}:${payload.shopId ?? "super"}`, { limit: 20, windowMs: 5 * 60_000 });
  if (!rl.ok) {
    return tooManyRequests(rl.retryAfter);
  }

  const shopId = resolveShopId(payload, request);
  if (!shopId) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  const data = {};

  // ── Basic identity ──
  if (body.name !== undefined) {
    const n = sanitizeString(body.name, { max: 120 });
    if (!n) return badRequest("Salon adı boş olamaz");
    data.name = n;
  }
  if (body.ownerName   !== undefined) data.ownerName   = sanitizeString(body.ownerName,   { max: 120 });
  if (body.email       !== undefined) data.email       = sanitizeString(body.email,       { max: 120 });
  if (body.description !== undefined) data.description = sanitizeString(body.description, { max: 2000 });
  if (body.about       !== undefined) data.about       = sanitizeString(body.about,       { max: 500  });

  if (body.foundedYear !== undefined) {
    const y = body.foundedYear == null || body.foundedYear === "" ? null : Number(body.foundedYear);
    if (y !== null && (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear() + 1)) {
      return badRequest("Geçersiz kuruluş yılı");
    }
    data.foundedYear = y;
  }
  if (body.shopType !== undefined) {
    if (body.shopType && !SHOP_TYPES.includes(body.shopType)) {
      return badRequest("Geçersiz salon tipi");
    }
    data.shopType = body.shopType || null;
  }

  // ── Contact ──
  if (body.phone !== undefined) {
    data.phone = body.phone ? normalizePhoneTR(body.phone) : null;
    if (body.phone && !data.phone) {
      return badRequest("Geçersiz telefon — Türkiye cep numarası girin");
    }
  }
  if (body.whatsappNumber !== undefined) {
    data.whatsappNumber = body.whatsappNumber ? normalizePhoneTR(body.whatsappNumber) : null;
    if (body.whatsappNumber && !data.whatsappNumber) {
      return badRequest("Geçersiz WhatsApp numarası — Türkiye cep numarası girin");
    }
  }

  // ── Address / location ──
  if (body.addressLine !== undefined) data.addressLine = sanitizeString(body.addressLine, { max: 300 });
  if (body.city        !== undefined) data.city        = sanitizeString(body.city,        { max: 80  });
  // Auto-compose legacy `address` from new fields when caller doesn't send it.
  if (body.address !== undefined) {
    data.address = sanitizeString(body.address, { max: 500 });
  } else if (body.addressLine !== undefined || body.city !== undefined) {
    data.address = [data.addressLine, data.city].filter(Boolean).join(", ") || null;
  }
  if (body.latitude !== undefined || body.longitude !== undefined) {
    if (body.latitude == null && body.longitude == null) {
      data.latitude = null; data.longitude = null;
    } else {
      const ll = validateLatLng(body.latitude, body.longitude);
      if (!ll) return badRequest("Geçersiz koordinatlar");
      data.latitude  = ll.lat;
      data.longitude = ll.lng;
    }
  } else if ((body.addressLine !== undefined || body.city !== undefined) && process.env.GOOGLE_PLACES_API_KEY) {
    // Auto-geocode when address changes but caller didn't send explicit coordinates
    const current = await prisma.shop.findUnique({ where: { id: shopId }, select: { latitude: true, longitude: true, addressLine: true, city: true } });
    if (!current?.latitude || !current?.longitude) {
      const query = [data.addressLine ?? current?.addressLine, data.city ?? current?.city, "Türkiye"].filter(Boolean).join(", ");
      try {
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`);
        const geoJson = await geoRes.json();
        const loc = geoJson.results?.[0]?.geometry?.location;
        if (loc) { data.latitude = loc.lat; data.longitude = loc.lng; }
      } catch {}
    }
  }

  // ── Social URLs (strict http(s) check) ──
  for (const [key, host] of [
    ["instagramUrl", null],
    ["facebookUrl",  null],
    ["tiktokUrl",    null],
    ["website",      null],
  ]) {
    if (body[key] !== undefined) {
      const r = validateHttpUrl(body[key], host ? { host } : undefined);
      if (!r.ok) return badRequest(`${key}: ${r.error}`);
      data[key] = r.value;
    }
  }

  // ── Legacy social JSON (kept for back-compat) ──
  if (body.social !== undefined && body.social && typeof body.social === "object") {
    const out = {};
    for (const k of ["instagram", "facebook", "tiktok", "twitter", "website"]) {
      if (body.social[k] != null) {
        const r = validateHttpUrl(body.social[k]);
        if (!r.ok) return badRequest(`social.${k}: ${r.error}`);
        out[k] = r.value;
      }
    }
    data.social = out;
  }

  // ── Google / map ──
  if (body.mapsEmbed        !== undefined) data.mapsEmbed        = sanitizeString(body.mapsEmbed, { max: 1000 });
  if (body.googlePlaceId    !== undefined) data.googlePlaceId    = sanitizeString(body.googlePlaceId,   { max: 200 });
  // placeId is the short-form alias sent by the location picker (maps to googlePlaceId)
  if (body.placeId          !== undefined) data.googlePlaceId    = sanitizeString(body.placeId, { max: 200 });
  if (body.googlePlacesKey  !== undefined) data.googlePlacesKey  = sanitizeString(body.googlePlacesKey, { max: 200 });
  if (body.formattedAddress !== undefined) {
    data.formattedAddress  = sanitizeString(body.formattedAddress, { max: 500 });
    if (body.formattedAddress) data.locationUpdatedAt = new Date();
  }
  if (body.googleReviewUrl !== undefined) {
    const r = validateHttpUrl(body.googleReviewUrl);
    if (!r.ok) return badRequest(`googleReviewUrl: ${r.error}`);
    if (r.value) {
      let parsed;
      try { parsed = new URL(r.value); } catch { parsed = null; }
      if (!parsed || !isGoogleHost(parsed.hostname)) {
        return badRequest("googleReviewUrl: Sadece google.com adresleri kabul edilir");
      }
    }
    data.googleReviewUrl = r.value;
  }

  // ── Review reminder toggle ──
  if (body.reviewReminderEnabled !== undefined) {
    data.reviewReminderEnabled = Boolean(body.reviewReminderEnabled);
  }

  const shop = await prisma.shop.update({
    where: { id: shopId },
    data,
    select: PROFILE_SELECT,
  });

  // The public shop page is ISR-cached (`revalidate = 300`). Without this call,
  // profile edits (logo, cover, hours, social, about, …) stay invisible to
  // visitors for up to 5 minutes.
  if (shop?.slug) {
    try { revalidatePath(`/${shop.slug}`); } catch {}
  }

  return ok(shop);
});

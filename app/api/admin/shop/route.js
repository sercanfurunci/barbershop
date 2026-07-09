import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import {
  validateHttpUrl, normalizePhoneTR, sanitizeString, validateLatLng, SHOP_TYPES,
} from "@/lib/validation";

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN"];

function guard(payload) {
  if (!payload) return { error: unauthorized() };
  if (!ALLOWED_ROLES.includes(payload.role)) return { error: forbidden() };
  if (payload.role === "SUPER_ADMIN") return { shopId: null };
  if (!payload.shopId) return { error: forbidden() };
  return { shopId: payload.shopId };
}

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

// GET /api/admin/shop — full shop profile
export async function GET(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  const shopId = g.shopId ?? new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: PROFILE_SELECT,
  });

  if (!shop) return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
  return NextResponse.json(shop);
}

// PATCH /api/admin/shop — update shop settings + salon profile
export async function PATCH(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  // ponytail: 20 PATCH / 5 min per IP per shop is plenty for a manual edit form.
  const ip = getIp(request);
  const rl = await rateLimit(`shop-profile:${ip}:${g.shopId ?? "super"}`, { limit: 20, windowMs: 5 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok fazla istek. Birazdan dene." }, { status: 429 });
  }

  const shopId = g.shopId ?? new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const data = {};

  // ── Basic identity ──
  if (body.name !== undefined) {
    const n = sanitizeString(body.name, { max: 120 });
    if (!n) return NextResponse.json({ error: "Salon adı boş olamaz" }, { status: 400 });
    data.name = n;
  }
  if (body.ownerName   !== undefined) data.ownerName   = sanitizeString(body.ownerName,   { max: 120 });
  if (body.email       !== undefined) data.email       = sanitizeString(body.email,       { max: 120 });
  if (body.description !== undefined) data.description = sanitizeString(body.description, { max: 2000 });
  if (body.about       !== undefined) data.about       = sanitizeString(body.about,       { max: 500  });

  if (body.foundedYear !== undefined) {
    const y = body.foundedYear == null || body.foundedYear === "" ? null : Number(body.foundedYear);
    if (y !== null && (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear() + 1)) {
      return NextResponse.json({ error: "Geçersiz kuruluş yılı" }, { status: 400 });
    }
    data.foundedYear = y;
  }
  if (body.shopType !== undefined) {
    if (body.shopType && !SHOP_TYPES.includes(body.shopType)) {
      return NextResponse.json({ error: "Geçersiz salon tipi" }, { status: 400 });
    }
    data.shopType = body.shopType || null;
  }

  // ── Contact ──
  if (body.phone !== undefined) {
    data.phone = body.phone ? normalizePhoneTR(body.phone) : null;
    if (body.phone && !data.phone) {
      return NextResponse.json({ error: "Geçersiz telefon — Türkiye cep numarası girin" }, { status: 400 });
    }
  }
  if (body.whatsappNumber !== undefined) {
    data.whatsappNumber = body.whatsappNumber ? normalizePhoneTR(body.whatsappNumber) : null;
    if (body.whatsappNumber && !data.whatsappNumber) {
      return NextResponse.json({ error: "Geçersiz WhatsApp numarası — Türkiye cep numarası girin" }, { status: 400 });
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
      if (!ll) return NextResponse.json({ error: "Geçersiz koordinatlar" }, { status: 400 });
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
      if (!r.ok) return NextResponse.json({ error: `${key}: ${r.error}` }, { status: 400 });
      data[key] = r.value;
    }
  }

  // ── Legacy social JSON (kept for back-compat) ──
  if (body.social !== undefined && body.social && typeof body.social === "object") {
    const out = {};
    for (const k of ["instagram", "facebook", "tiktok", "twitter", "website"]) {
      if (body.social[k] != null) {
        const r = validateHttpUrl(body.social[k]);
        if (!r.ok) return NextResponse.json({ error: `social.${k}: ${r.error}` }, { status: 400 });
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
    if (!r.ok) return NextResponse.json({ error: `googleReviewUrl: ${r.error}` }, { status: 400 });
    if (r.value) {
      let parsed;
      try { parsed = new URL(r.value); } catch { parsed = null; }
      if (!parsed || !isGoogleHost(parsed.hostname)) {
        return NextResponse.json({ error: "googleReviewUrl: Sadece google.com adresleri kabul edilir" }, { status: 400 });
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

  return NextResponse.json(shop);
}

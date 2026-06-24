import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import {
  validateHttpUrl, normalizePhone, sanitizeString, validateLatLng, SHOP_TYPES,
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
  phone: true, whatsappNumber: true, email: true,
  description: true, about: true,
  ownerName: true, foundedYear: true, shopType: true,
  instagramUrl: true, facebookUrl: true, tiktokUrl: true,
  social: true,
  googlePlaceId: true, googlePlacesKey: true, mapsEmbed: true,
  timezone: true, currency: true, status: true,
};

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
  if (!rateLimit(`shop-profile:${ip}:${g.shopId ?? "super"}`, { limit: 20, windowMs: 5 * 60_000 })) {
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
    data.phone = body.phone ? normalizePhone(body.phone) : null;
    if (body.phone && !data.phone) {
      return NextResponse.json({ error: "Geçersiz telefon" }, { status: 400 });
    }
  }
  if (body.whatsappNumber !== undefined) {
    data.whatsappNumber = body.whatsappNumber ? normalizePhone(body.whatsappNumber) : null;
    if (body.whatsappNumber && !data.whatsappNumber) {
      return NextResponse.json({ error: "Geçersiz WhatsApp numarası" }, { status: 400 });
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
  }

  // ── Social URLs (strict http(s) check) ──
  for (const [key, host] of [
    ["instagramUrl", null],
    ["facebookUrl",  null],
    ["tiktokUrl",    null],
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
  if (body.mapsEmbed       !== undefined) data.mapsEmbed       = sanitizeString(body.mapsEmbed, { max: 1000 });
  if (body.googlePlaceId   !== undefined) data.googlePlaceId   = sanitizeString(body.googlePlaceId,   { max: 200 });
  if (body.googlePlacesKey !== undefined) data.googlePlacesKey = sanitizeString(body.googlePlacesKey, { max: 200 });

  const shop = await prisma.shop.update({
    where: { id: shopId },
    data,
    select: PROFILE_SELECT,
  });

  return NextResponse.json(shop);
}

"use client";

// Hero-banner that fronts the public shop page. Renders the cover image (or a
// neutral gradient if none), shop identity, trust metadata, and primary +
// secondary CTAs. Designed to sit ABOVE the booking widget hero so the page
// reads as "salon brand → take action" before the booking module loads.

import Image from "next/image";
import Link from "next/link";
import { Star, Phone, MessageCircle, MapPin, Calendar } from "lucide-react";
import { track } from "@/lib/track";
import { telHref, waHref } from "@/lib/validation";

const C = {
  bg: "var(--makas-bg)",
  primary: "var(--makas-ink)",
  muted: "rgba(255,255,255,0.7)",
};

const SHOP_TYPE_LABEL = { male: "Erkek", female: "Kadın", unisex: "Unisex" };

// Slug → human title fallback when shop.name is blank ("acme-barber-shop" → "Acme Barber Shop").
function prettifySlug(slug) {
  if (!slug) return "Salon";
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CoverBanner({ shop, googleReviews }) {
  if (!shop) return null;
  const displayName = (shop.name?.trim()) || prettifySlug(shop.slug);
  // ponytail: gallery[0] as fallback so a new tenant who only uploads photos
  // still gets a real hero image instead of the dark gradient.
  const heroImage = shop.coverImage || (Array.isArray(shop.gallery) && shop.gallery[0]) || null;

  const bookHref = `/${shop.slug}/book`;
  const phoneHref = telHref(shop.phone);
  const whatsappHref = waHref(shop.whatsappNumber);
  const mapHref = shop.latitude && shop.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`
    : shop.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`
      : null;

  const meta = [];
  if (shop.ownerName)   meta.push(shop.ownerName);
  if (shop.foundedYear) meta.push(`Kuruluş ${shop.foundedYear}`);
  if (shop.shopType && SHOP_TYPE_LABEL[shop.shopType]) meta.push(SHOP_TYPE_LABEL[shop.shopType]);
  if (shop.city)        meta.push(shop.city);

  return (
    <section data-hero style={{ position: "relative", background: "#0f0f0f", color: "#fff" }}>
      <div style={{ position: "relative", width: "100%", height: "clamp(420px, 64vh, 640px)", overflow: "hidden" }}>
        {/* Layer 0: media */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {heroImage ? (
            <Image
              src={heroImage}
              alt={displayName}
              fill
              sizes="100vw"
              priority
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, #1a1a1a 0%, #2a2522 60%, #3b302a 100%)",
            }} />
          )}
        </div>

        {/* Layer 1: overlay — protects Navbar at top AND text at bottom */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.75) 100%)",
        }} />

        {/* Layer 10: content (identity + CTAs) */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", alignItems: "flex-end",
          padding: "clamp(24px, 5vw, 56px)",
          paddingTop: "clamp(96px, 12vw, 120px)",
        }}>
          <div style={{
            width: "min(1100px, 100%)", marginInline: "auto",
            display: "flex", flexDirection: "column", gap: "18px",
          }}>
            {/* Identity row */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                position: "relative", width: 64, height: 64, flexShrink: 0,
                borderRadius: 14, overflow: "hidden",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {shop.logo ? (
                  <Image src={shop.logo} alt="" fill sizes="64px" style={{ objectFit: "cover" }} />
                ) : (
                  <span className="font-display" style={{
                    fontSize: 28, fontWeight: 400, color: "#fff", letterSpacing: "0.02em",
                  }}>
                    {displayName[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 className="font-display line-clamp-2" style={{
                  fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 300,
                  letterSpacing: "-0.025em", lineHeight: 1.05, margin: 0,
                  color: "#fff", textWrap: "balance",
                }}>
                  {displayName}
                </h1>
                {meta.length > 0 && (
                  <div style={{
                    marginTop: 6, fontSize: 13, color: C.muted, letterSpacing: "0.02em",
                    display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px",
                  }}>
                    {meta.map((m, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        {i > 0 && <span style={{ opacity: 0.4 }}>·</span>}
                        {m}
                      </span>
                    ))}
                    {googleReviews?.rating != null && (
                      <>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Star size={12} fill="#fbbf24" color="#fbbf24" strokeWidth={0} />
                          <span style={{ color: "#fff", fontWeight: 600 }}>{googleReviews.rating.toFixed(1)}</span>
                          <span>({googleReviews.totalRatings})</span>
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <Link
                href={bookHref}
                style={primaryCta}
                onClick={() => track(shop.id, "book_click", { source: "cover" })}
              >
                <Calendar size={16} /> Randevu Al
              </Link>
              {phoneHref && (
                <a
                  href={phoneHref}
                  style={secondaryCta}
                  onClick={() => track(shop.id, "call_click", { source: "cover" })}
                >
                  <Phone size={15} /> Ara
                </a>
              )}
              {whatsappHref && (
                <a
                  href={whatsappHref} target="_blank" rel="noopener noreferrer"
                  style={secondaryCta}
                  onClick={() => track(shop.id, "whatsapp_click", { source: "cover" })}
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              )}
              {mapHref && (
                <a
                  href={mapHref} target="_blank" rel="noopener noreferrer"
                  style={secondaryCta}
                  onClick={() => track(shop.id, "directions_click", { source: "cover" })}
                >
                  <MapPin size={15} /> Yol Tarifi
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const primaryCta = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "13px 22px",
  background: "#fff", color: "#111",
  fontSize: 14, fontWeight: 700, letterSpacing: "0.02em",
  borderRadius: 100, textDecoration: "none",
  minHeight: 46, boxSizing: "border-box",
};

const secondaryCta = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "13px 18px",
  background: "rgba(255,255,255,0.08)", color: "#fff",
  border: "1px solid rgba(255,255,255,0.18)",
  fontSize: 13, fontWeight: 600, letterSpacing: "0.02em",
  borderRadius: 100, textDecoration: "none",
  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
  minHeight: 46, boxSizing: "border-box",
};

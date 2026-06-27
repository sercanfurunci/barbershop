import { ImageResponse } from "next/og";
import { resolveShopBySlug } from "@/lib/shop";
import { getGoogleReviews } from "@/lib/googleReviews";
import { prisma } from "@/lib/prisma";

// ponytail: Node runtime — Prisma needs `node:util/types`, not available on Edge.
export const alt = "Online Randevu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateImageMetadata({ params }) {
  const { shopSlug } = await params;
  if (!shopSlug) return [{ id: "default", alt: "Online Randevu" }];
  const shop = await resolveShopBySlug(shopSlug);
  return [{ id: shopSlug, alt: shop?.name ?? shopSlug }];
}

// Brand tokens — mirror --makas-* CSS vars so the share card reads as the
// same surface as the live page.
const INK         = "#111111";
const INK_SOFT    = "#3F3A35";
const INK_MUTED   = "#8B847C";
const BG          = "#F5F1EB";
const SURFACE     = "#FFFFFF";
const BORDER      = "rgba(17,17,17,0.10)";
const ACCENT_GOLD = "#D4A24A";

export default async function OgImage({ params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop) {
    return new ImageResponse(
      <div style={{ background: BG, width: "1200px", height: "630px" }} />,
      { ...size },
    );
  }

  const [barbers, googleReviews] = await Promise.all([
    prisma.barber.findMany({
      where: { shopId: shop.id, available: true },
      select: { nameTr: true, titleTr: true, avatar: true, yearsExp: true },
      orderBy: { createdAt: "asc" },
      take: 4,
    }),
    getGoogleReviews(shop.id),
  ]);

  const initial   = (shop.name ?? "S")[0].toUpperCase();
  const rating    = googleReviews?.rating != null ? googleReviews.rating.toFixed(1) : null;
  const ratingCnt = googleReviews?.totalRatings ?? null;

  // Meta line: built from whatever's available, joined with bullets.
  const metaBits = [];
  if (shop.foundedYear) metaBits.push(`Kuruluş ${shop.foundedYear}`);
  if (shop.city)        metaBits.push(shop.city);
  else if (shop.addressLine) metaBits.push(shop.addressLine.split(",")[0]);

  const url = shop.customDomain || `makas.furunci.tech/${shop.slug}`;

  return new ImageResponse(
    (
      <div style={{
        width: "1200px", height: "630px",
        background: BG,
        display: "flex", flexDirection: "column",
        fontFamily: "sans-serif",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Subtle top gold hairline — premium accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: ACCENT_GOLD, opacity: 0.55,
        }} />

        {/* ── Top: identity row ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "48px 64px 0",
        }}>
          {/* Logo + small uppercase mark */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "56px", height: "56px", background: INK,
              borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: "24px", fontWeight: 700, fontFamily: "serif" }}>
                {initial}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{
                fontSize: "12px", color: INK_MUTED,
                letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600,
              }}>
                Online Randevu
              </span>
              <span style={{ fontSize: "14px", color: INK_SOFT, letterSpacing: "0.02em" }}>
                {url}
              </span>
            </div>
          </div>

          {/* Rating chip — only if Google reviews are linked */}
          {rating && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: "999px",
              padding: "10px 18px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={ACCENT_GOLD}>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              <span style={{ fontSize: "18px", color: INK, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {rating}
              </span>
              {ratingCnt != null && (
                <span style={{ fontSize: "13px", color: INK_MUTED, fontVariantNumeric: "tabular-nums" }}>
                  ({ratingCnt})
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Middle: shop name + meta ── */}
        <div style={{
          padding: "32px 64px 24px",
          display: "flex", flexDirection: "column", gap: "14px",
          flex: 1, justifyContent: "center",
        }}>
          <span
            style={{
              color: INK,
              fontSize: shop.name && shop.name.length > 22 ? "78px" : "108px",
              fontWeight: 300, letterSpacing: "-0.035em",
              lineHeight: 1.02, fontFamily: "serif",
              maxWidth: "1072px",
            }}
          >
            {shop.name}
          </span>

          {metaBits.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              fontSize: "20px", color: INK_SOFT, fontWeight: 500, letterSpacing: "-0.005em",
            }}>
              {metaBits.map((bit, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  {i > 0 && (
                    <span style={{
                      width: "4px", height: "4px", borderRadius: "50%",
                      background: INK_MUTED, opacity: 0.6,
                    }} />
                  )}
                  <span>{bit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Barbers row + CTA footer ── */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          padding: "0 64px 48px",
          gap: "32px",
        }}>
          {/* Barber avatars — Fresha-style circles, up to 4 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
            {barbers.length > 0 ? barbers.map((b) => (
              <div key={b.nameTr} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                width: "92px",
              }}>
                <div style={{
                  width: "88px", height: "88px", borderRadius: "50%",
                  background: INK, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "30px", fontWeight: 600, fontFamily: "serif",
                  border: `3px solid ${SURFACE}`,
                  boxShadow: "0 4px 14px rgba(17,17,17,0.18)",
                }}>
                  {b.avatar ?? b.nameTr[0]}
                </div>
                <span style={{
                  fontSize: "13px", color: INK, fontWeight: 600,
                  maxWidth: "92px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {b.nameTr.split(" ")[0]}
                </span>
              </div>
            )) : (
              <span style={{ color: INK_MUTED, fontSize: "16px" }}>
                Online randevu için hazır.
              </span>
            )}
          </div>

          {/* CTA pill — dark, mirrors Book Now button */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: INK, color: "#fff",
            borderRadius: "12px",
            padding: "18px 28px",
            boxShadow: "0 10px 24px rgba(17,17,17,0.28)",
          }}>
            <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.03em" }}>
              Randevu Al
            </span>
            <span style={{ fontSize: "20px", fontWeight: 700 }}>→</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

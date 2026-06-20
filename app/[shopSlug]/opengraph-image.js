import { ImageResponse } from "next/og";
import { resolveShopBySlug } from "@/lib/shop";
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

export default async function OgImage({ params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop) return new ImageResponse(<div style={{ background: "#111", width: "1200px", height: "630px" }} />, { ...size });

  const barbers = await prisma.barber.findMany({
    where: { shopId: shop.id, available: true },
    select: { nameTr: true, titleTr: true, avatar: true, yearsExp: true },
    orderBy: { createdAt: "asc" },
    take: 4,
  });

  const initial = (shop.name ?? "S")[0].toUpperCase();

  return new ImageResponse(
    (
      <div style={{
        width: "1200px", height: "630px",
        background: "#F2EDE4",
        display: "flex",
        fontFamily: "sans-serif",
        overflow: "hidden",
      }}>
        {/* Left */}
        <div style={{
          width: "580px", flexShrink: 0,
          padding: "64px 72px",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", background: "#111",
              borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: "18px", fontWeight: 700 }}>{initial}</span>
            </div>
            <span style={{ color: "#111", fontSize: "15px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
              {shop.name}
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#111">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.0 }}>
              <span style={{ color: "#111", fontSize: "68px", fontWeight: 300, letterSpacing: "-0.03em", fontFamily: "serif" }}>Ustalar</span>
              <span style={{ color: "#111", fontSize: "68px", fontWeight: 300, letterSpacing: "-0.03em", fontStyle: "italic", fontFamily: "serif" }}>sizi bekliyor.</span>
            </div>
            {shop.description && (
              <span style={{ color: "#57514B", fontSize: "15px", lineHeight: 1.5, marginTop: "4px" }}>
                {shop.description.slice(0, 80)}
              </span>
            )}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              background: "#111", padding: "12px 24px", borderRadius: "8px",
              display: "flex", alignItems: "center",
            }}>
              <span style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>Randevu Al</span>
            </div>
            {shop.address && (
              <span style={{ color: "#8E8A93", fontSize: "12px" }}>{shop.address.split("\n")[0]}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", background: "rgba(0,0,0,0.08)", alignSelf: "stretch" }} />

        {/* Right — barbers */}
        <div style={{
          flex: 1, padding: "56px 48px",
          display: "flex", flexDirection: "column",
          justifyContent: "center", gap: "12px",
        }}>
          <span style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#8E8A93", marginBottom: "4px" }}>
            EKİBİMİZ
          </span>
          {barbers.length > 0 ? barbers.map((b) => (
            <div key={b.nameTr} style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: "10px", padding: "10px 14px",
            }}>
              <div style={{
                width: "38px", height: "38px",
                background: "#111", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700 }}>{b.avatar ?? b.nameTr[0]}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#111", lineHeight: 1 }}>{b.nameTr}</span>
                <span style={{ fontSize: "10px", color: "#8E8A93", letterSpacing: "0.04em" }}>{b.titleTr}</span>
              </div>
              {b.yearsExp > 0 && (
                <span style={{ fontSize: "11px", color: "#8E8A93", flexShrink: 0 }}>{b.yearsExp} yıl</span>
              )}
            </div>
          )) : (
            <div style={{ color: "#8E8A93", fontSize: "14px" }}>Online randevu için hazır.</div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "MAKAS — Berber Randevu Sistemi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function logoDataUrl() {
  // Dark mark on cream BG. logo-dark = ink-on-transparent, used on light surfaces.
  const buf = await readFile(path.join(process.cwd(), "public/logo-dark.svg"));
  return `data:image/svg+xml;base64,${buf.toString("base64")}`;
}

// Brand tokens — match the same identity-first surface the rest of the site
// uses. Cream BG keeps the share→click transition consistent.
const INK         = "#111111";
const INK_SOFT    = "#3F3A35";
const INK_MUTED   = "#8B847C";
const BG          = "#F5F1EB";
const SURFACE     = "#FFFFFF";
const BORDER      = "rgba(17,17,17,0.10)";
const ACCENT_GOLD = "#D4A24A";

const FEATURES = [
  "Online Randevu",
  "Çoklu Berber",
  "Salon Yönetimi",
  "Google Yorumları",
];

export default async function OgImage() {
  const logo = await logoDataUrl();
  return new ImageResponse(
    (
      <div style={{
        width: "1200px", height: "630px",
        background: BG,
        display: "flex", flexDirection: "column",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Top gold hairline — same accent as the shop OG */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: ACCENT_GOLD, opacity: 0.55,
        }} />

        {/* ── Top: brand row ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "48px 64px 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img src={logo} width={52} height={52} alt="" />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{
                color: INK, fontSize: "18px",
                letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700,
              }}>
                MAKAS
              </span>
              <span style={{ color: INK_MUTED, fontSize: "13px", letterSpacing: "0.04em" }}>
                Berber Randevu Sistemi
              </span>
            </div>
          </div>

          {/* Trial chip — premium "free trial" pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: "999px",
            padding: "10px 18px",
          }}>
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: ACCENT_GOLD,
              boxShadow: `0 0 8px ${ACCENT_GOLD}`,
            }} />
            <span style={{ color: INK, fontSize: "14px", fontWeight: 600, letterSpacing: "0.04em" }}>
              14 gün ücretsiz dene
            </span>
          </div>
        </div>

        {/* ── Middle: hero headline ── */}
        <div style={{
          flex: 1,
          padding: "40px 64px 0",
          display: "flex", flexDirection: "column", gap: "20px",
          justifyContent: "center",
        }}>
          <span style={{
            color: INK_MUTED, fontSize: "13px",
            letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600,
          }}>
            Berberlere Özel Platform
          </span>

          <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.95 }}>
            <span style={{
              color: INK, fontSize: "104px", fontWeight: 300,
              letterSpacing: "-0.035em", fontFamily: "serif",
            }}>
              Randevuları
            </span>
            <span style={{
              color: INK, fontSize: "104px", fontWeight: 300,
              letterSpacing: "-0.035em", fontFamily: "serif",
              fontStyle: "italic",
            }}>
              otomatikleştir.
            </span>
          </div>

          <span style={{
            color: INK_SOFT, fontSize: "20px", lineHeight: 1.5,
            maxWidth: "780px", marginTop: "4px",
          }}>
            Salonuna özel randevu sayfası, berber yönetimi ve müşteri takibi — hepsi bir arada.
          </span>
        </div>

        {/* ── Bottom: features row + CTA pill ── */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          padding: "0 64px 48px",
          gap: "32px",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
            {FEATURES.map((f) => (
              <div key={f} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: "999px",
                padding: "10px 16px",
              }}>
                <span style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  background: ACCENT_GOLD, opacity: 0.9,
                }} />
                <span style={{ color: INK_SOFT, fontSize: "14px", fontWeight: 500, letterSpacing: "0.01em" }}>
                  {f}
                </span>
              </div>
            ))}
          </div>

          {/* CTA pill — dark on cream, mirrors the shop OG */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: INK, color: "#fff",
            borderRadius: "12px",
            padding: "16px 26px",
            boxShadow: "0 10px 28px rgba(17,17,17,0.28)",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "0.03em" }}>
              Ücretsiz Başla
            </span>
            <span style={{ fontSize: "19px", fontWeight: 700 }}>→</span>
          </div>
        </div>

        {/* URL footer micro-line */}
        <span style={{
          position: "absolute",
          bottom: "12px", left: "64px",
          color: INK_MUTED, fontSize: "11px", letterSpacing: "0.06em",
        }}>
          makas.furunci.tech
        </span>
      </div>
    ),
    { ...size },
  );
}

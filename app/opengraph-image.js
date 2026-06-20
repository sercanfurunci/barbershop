import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "MAKAS — Berber Randevu Sistemi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function logoDataUrl() {
  const buf = await readFile(path.join(process.cwd(), "public/logo-dark.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

const FEATURES = [
  { icon: "📅", label: "Online Randevu" },
  { icon: "👥", label: "Çoklu Berber" },
  { icon: "📊", label: "Salon Yönetimi" },
  { icon: "⭐", label: "Google Yorumları" },
];

export default async function OgImage() {
  const logo = await logoDataUrl();
  return new ImageResponse(
    (
      <div style={{
        width: "1200px", height: "630px",
        background: "#111111",
        display: "flex",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background pattern */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 60% at 80% 50%, #1E1A16 0%, transparent 60%)",
        }} />

        {/* Left content */}
        <div style={{
          flex: 1, padding: "72px 80px",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          position: "relative", zIndex: 1,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <img src={logo} width={56} height={56} alt="" style={{ borderRadius: "10px" }} />
            <span style={{ color: "#F7F4EE", fontSize: "18px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
              MAKAS
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ color: "#9A9490", fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
              Berberlere Özel Platform
            </span>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.0 }}>
              <span style={{ color: "#F7F4EE", fontSize: "68px", fontWeight: 300, letterSpacing: "-0.03em", fontFamily: "serif" }}>
                Randevuları
              </span>
              <span style={{ color: "#F7F4EE", fontSize: "68px", fontWeight: 300, letterSpacing: "-0.03em", fontStyle: "italic", fontFamily: "serif" }}>
                otomatikleştir.
              </span>
            </div>
            <span style={{ color: "#9A9490", fontSize: "16px", lineHeight: 1.6, marginTop: "8px", maxWidth: "460px" }}>
              Salonuna özel randevu sayfası, berber yönetimi ve müşteri takibi — hepsi bir arada.
            </span>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              background: "#F7F4EE", padding: "14px 28px", borderRadius: "8px",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{ color: "#111", fontSize: "15px", fontWeight: 600 }}>Ücretsiz Başla</span>
            </div>
            <span style={{ color: "#555250", fontSize: "13px" }}>makas.furunci.tech</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          width: "380px", flexShrink: 0,
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          padding: "72px 48px",
          display: "flex", flexDirection: "column",
          justifyContent: "center", gap: "16px",
          position: "relative", zIndex: 1,
        }}>
          <span style={{ color: "#555250", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>
            ÖZELLİKLER
          </span>
          {FEATURES.map((f) => (
            <div key={f.label} style={{
              display: "flex", alignItems: "center", gap: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              padding: "14px 18px",
            }}>
              <span style={{ fontSize: "22px" }}>{f.icon}</span>
              <span style={{ color: "#F7F4EE", fontSize: "14px", fontWeight: 500 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

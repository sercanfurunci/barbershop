import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Abdurrahman Çelik Exclusive Salon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#070707",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div style={{
          position: "absolute",
          top: "-120px",
          left: "-80px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(204,26,26,0.12) 0%, transparent 70%)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-100px",
          right: "-60px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180,120,60,0.06) 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* Top: Logo + location */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "48px", height: "48px",
              background: "#CC1A1A",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: "22px", fontWeight: 700 }}>A</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ color: "#F0EDE8", fontSize: "18px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 300 }}>
                Abdurrahman Çelik
              </span>
              <span style={{ color: "#CC1A1A", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Exclusive Salon
              </span>
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 18px",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "40px",
          }}>
            <span style={{ color: "#9A96A0", fontSize: "13px", letterSpacing: "0.04em" }}>
              Darıca, Kocaeli
            </span>
          </div>
        </div>

        {/* Center: Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#CC1A1A">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{
              color: "#F0EDE8",
              fontSize: "72px",
              fontWeight: 300,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>
              Ustalar
            </span>
            <span style={{
              color: "#CC1A1A",
              fontSize: "72px",
              fontWeight: 300,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontStyle: "italic",
            }}>
              sizi bekliyor.
            </span>
          </div>
          <span style={{ color: "#9A96A0", fontSize: "18px", lineHeight: 1.5, maxWidth: "600px" }}>
            Darıca'nın en seçkin berberi. Premium saç &amp; sakal bakımı. Online randevu alın, bekleme yok.
          </span>
        </div>

        {/* Bottom: Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
          {[
            { value: "4.9", label: "Ortalama Puan" },
            { value: "175+", label: "Google Yorum" },
            { value: "12+", label: "Yıllık Deneyim" },
            { value: "4", label: "Usta Berber" },
          ].map((stat, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", gap: "4px",
              paddingRight: i < 3 ? "32px" : "0",
              paddingLeft: i > 0 ? "32px" : "0",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}>
              <span style={{ color: "#F0EDE8", fontSize: "28px", fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {stat.value}
              </span>
              <span style={{ color: "#8E8A93", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {stat.label}
              </span>
            </div>
          ))}

          <div style={{ flex: 1 }} />

          {/* CTA pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "#CC1A1A",
            padding: "14px 28px",
            borderRadius: "40px",
          }}>
            <span style={{ color: "#fff", fontSize: "15px", fontWeight: 600, letterSpacing: "0.03em" }}>
              Randevu Al
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>→</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

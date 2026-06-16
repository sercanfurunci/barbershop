import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Abdurrahman Çelik Exclusive Salon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BARBERS = [
  { initials: "AÇ", name: "Abdurrahman Çelik", title: "Baş Berber", exp: "20 yıl" },
  { initials: "EÇ", name: "Egemen Çelik",      title: "Kıdemli Berber", exp: "8 yıl" },
  { initials: "ÖF", name: "Ömer Efe Furunci",  title: "Berber", exp: "5 yıl" },
  { initials: "EF", name: "Emin Fırtına",      title: "Berber", exp: "12 yıl" },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#F2EDE4",
          display: "flex",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Left panel */}
        <div style={{
          width: "580px",
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px",
              background: "#C62828",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: "18px", fontWeight: 700 }}>A</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <span style={{ color: "#111", fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
                Abdurrahman Çelik
              </span>
              <span style={{ color: "#C62828", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Exclusive Salon
              </span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "3px" }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#C62828">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              ))}
              <span style={{ color: "#57514B", fontSize: "13px", marginLeft: "6px" }}>4.9 · 176 yorum</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.0 }}>
              <span style={{ color: "#111", fontSize: "72px", fontWeight: 300, letterSpacing: "-0.03em", fontFamily: "serif" }}>Ustalar</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
                <span style={{ color: "#111", fontSize: "72px", fontWeight: 300, letterSpacing: "-0.03em", fontStyle: "italic", fontFamily: "serif" }}>sizi</span>
                <span style={{ color: "#C62828", fontSize: "72px", fontWeight: 300, letterSpacing: "-0.03em", fontFamily: "serif" }}>bekliyor.</span>
              </div>
            </div>
            <span style={{ color: "#57514B", fontSize: "15px", lineHeight: 1.5, marginTop: "4px" }}>
              Darıca'nın en seçkin berberi. Online randevu, bekleme yok.
            </span>
          </div>

          {/* CTA + location */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              background: "#C62828", padding: "12px 24px", borderRadius: "40px",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>Randevu Al</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>→</span>
            </div>
            <span style={{ color: "#8E8A93", fontSize: "12px" }}>Darıca, Kocaeli</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", background: "rgba(0,0,0,0.08)", alignSelf: "stretch", flexShrink: 0 }} />

        {/* Right panel — barber cards */}
        <div style={{
          flex: 1,
          padding: "48px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "12px",
        }}>
          <span style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#C62828", marginBottom: "4px", fontWeight: 500 }}>
            USTA BERBERLERİ
          </span>
          {BARBERS.map((b) => (
            <div key={b.initials} style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: "10px",
              padding: "10px 14px",
            }}>
              <div style={{
                width: "38px", height: "38px",
                background: "linear-gradient(135deg, #C62828, #7f1d1d)",
                borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.03em" }}>{b.initials}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#111", lineHeight: 1 }}>{b.name}</span>
                <span style={{ fontSize: "10px", color: "#C62828", letterSpacing: "0.06em", textTransform: "uppercase" }}>{b.title}</span>
              </div>
              <span style={{ fontSize: "11px", color: "#8E8A93", flexShrink: 0 }}>{b.exp}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

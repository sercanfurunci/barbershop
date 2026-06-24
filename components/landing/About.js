"use client";

// "Hakkımızda" editorial block. Centered, narrow column, premium serif heading.

export default function About({ about }) {
  if (!about || !about.trim()) return null;
  const isShort = about.trim().length < 80; // tighten vertical rhythm for one-liners
  return (
    <section style={{
      background: "#F7F4EE",
      padding: isShort
        ? "clamp(40px, 5vw, 64px) clamp(20px, 5vw, 40px)"
        : "clamp(56px, 8vw, 96px) clamp(20px, 5vw, 40px)",
    }}>
      <div style={{
        maxWidth: 700, marginInline: "auto", textAlign: "center",
        display: "flex", flexDirection: "column", gap: isShort ? "12px" : "18px",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.22em",
          textTransform: "uppercase", color: "rgba(17,17,17,0.45)",
        }}>
          Hikayemiz
        </div>
        <h2 className="font-display" style={{
          fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300,
          letterSpacing: "-0.02em", lineHeight: 1.08, color: "#111", margin: 0,
        }}>
          Hakkımızda
        </h2>
        <p style={{
          fontSize: "clamp(15px, 1.6vw, 17px)",
          lineHeight: 1.75, color: "#3a3633",
          whiteSpace: "pre-wrap",
          textWrap: "pretty",
          margin: 0,
        }}>
          {about.length > 2000 ? about.slice(0, 2000) + "…" : about}
        </p>
      </div>
    </section>
  );
}

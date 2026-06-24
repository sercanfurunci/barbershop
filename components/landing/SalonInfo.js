"use client";

// Dark, edge-to-edge contact section. Sits as the last section before the
// (dark) Footer so the two flow into one cinematic block — no margin, no card.

import { motion } from "framer-motion";
import { MapPin, Phone, Clock, ArrowUpRight } from "lucide-react";

const DAYS = [
  ["mon", "Pazartesi"],
  ["tue", "Salı"],
  ["wed", "Çarşamba"],
  ["thu", "Perşembe"],
  ["fri", "Cuma"],
  ["sat", "Cumartesi"],
  ["sun", "Pazar"],
];

function fmtMin(m) {
  if (m == null) return null;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function todayKey() {
  // JS getDay(): 0=Sun..6=Sat → map to our keys (mon..sun)
  return DAYS[(new Date().getDay() + 6) % 7][0];
}

export default function SalonInfo({ shop, hours, googleReviews }) {
  if (!shop) return null;

  const placeHref = googleReviews?.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${googleReviews.placeId}`
    : shop.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`
      : null;

  const todayHours = hours?.find((h) => h.day === todayKey());
  const isOpen = (() => {
    if (!todayHours?.start || !todayHours?.end) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= todayHours.start && cur < todayHours.end;
  })();

  const mapsHref = shop.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`
    : null;

  return (
    <section
      style={{
        background: "#0f0f0f",
        color: "#fff",
        marginBottom: 0,
        position: "relative",
      }}
    >
      <div
        style={{
          width: "min(1440px, 100%)",
          marginInline: "auto",
          display: "grid",
          gridTemplateColumns: "1fr",
          minHeight: "520px",
        }}
        className="md:!grid-cols-[45fr_55fr]"
      >
        {/* ── Left: dark info panel ── */}
        <div
          style={{
            padding: "clamp(40px, 6vw, 72px) clamp(24px, 4vw, 56px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "32px",
            background: "#111111",
            position: "relative",
            zIndex: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
              marginBottom: "18px",
            }}>
              Bizi Ziyaret Edin
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: "clamp(32px, 4.5vw, 56px)",
                fontWeight: 300,
                letterSpacing: "-0.025em",
                lineHeight: 1.02,
                color: "#fff",
                marginBottom: shop.description ? "18px" : "0",
              }}
            >
              {shop.name}
            </h2>

            {shop.description && (
              <p style={{
                fontSize: "14.5px", color: "rgba(255,255,255,0.62)",
                lineHeight: 1.7, maxWidth: "460px", margin: 0,
              }}>
                {shop.description}
              </p>
            )}
          </motion.div>

          {/* Info blocks */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: "22px" }}
          >
            {shop.address && (
              <Block Icon={MapPin} label="Adres">
                <div style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.88)", lineHeight: 1.55 }}>
                  {shop.address}
                </div>
              </Block>
            )}

            {shop.phone && (
              <Block Icon={Phone} label="Telefon">
                <a
                  href={`tel:${shop.phone}`}
                  style={{
                    fontSize: "14.5px", color: "rgba(255,255,255,0.88)",
                    textDecoration: "none", letterSpacing: "0.02em",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.88)")}
                >
                  {shop.phone}
                </a>
              </Block>
            )}

            {hours && hours.some((h) => h.start != null) && (
              <Block Icon={Clock} label="Çalışma Saatleri" badge={
                <span style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                  padding: "3px 9px", borderRadius: "100px",
                  background: isOpen ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)",
                  color: isOpen ? "#86efac" : "rgba(255,255,255,0.55)",
                  border: `1px solid ${isOpen ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.12)"}`,
                }}>
                  {isOpen ? "AÇIK" : "KAPALI"}
                </span>
              }>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {hours.map(({ day, start, end }) => {
                    const isToday = day === todayKey();
                    const label   = DAYS.find(([k]) => k === day)[1];
                    return (
                      <div key={day} style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: "13px",
                        color: isToday ? "#fff" : "rgba(255,255,255,0.55)",
                        fontWeight: isToday ? 600 : 400,
                        letterSpacing: "0.01em",
                      }}>
                        <span>{label}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {start != null && end != null ? `${fmtMin(start)} – ${fmtMin(end)}` : "Kapalı"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Block>
            )}
          </motion.div>

          {/* CTA */}
          {mapsHref && (
            <motion.a
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: 0.2 }}
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                alignSelf: "flex-start",
                padding: "14px 24px",
                background: "#fff", color: "#111",
                fontSize: "13px", fontWeight: 700,
                letterSpacing: "0.04em", textTransform: "uppercase",
                borderRadius: "100px",
                textDecoration: "none",
                transition: "transform 0.2s, box-shadow 0.2s",
                minHeight: "48px", boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Yol Tarifi Al
              <ArrowUpRight size={16} strokeWidth={2.2} />
            </motion.a>
          )}
        </div>

        {/* ── Right: map fills its column ── */}
        <div style={{ position: "relative", minHeight: "320px", padding: "clamp(16px, 2vw, 24px)" }}>
          <style>{`
            .salon-map-card {
              position: relative;
              width: 100%;
              height: 100%;
              min-height: 280px;
              border-radius: 18px;
              overflow: hidden;
              background: #000;
              box-shadow: 0 20px 50px rgba(0,0,0,0.45);
              border: 1px solid rgba(255,255,255,0.06);
            }
            @media (min-width: 768px) {
              .salon-map-card { border-radius: 24px; }
            }
            .salon-map-frame {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              border: 0; display: block;
              filter: saturate(0.85) brightness(0.95);
            }
          `}</style>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="salon-map-card"
          >
            {shop.mapsEmbed ? (
              <iframe
                className="salon-map-frame"
                src={shop.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Konum"
              />
            ) : shop.address ? (
              <iframe
                className="salon-map-frame"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(shop.address)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Konum"
              />
            ) : (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)", fontSize: "13px",
              }}>
                Konum belirtilmemiş
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Block({ Icon, label, badge, children }) {
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
      <div style={{
        width: "36px", height: "36px", borderRadius: "10px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={15} color="rgba(255,255,255,0.75)" strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.42)",
          marginBottom: "7px",
        }}>
          {label}
          {badge}
        </div>
        {children}
      </div>
    </div>
  );
}

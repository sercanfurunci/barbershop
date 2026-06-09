"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { barbers } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Scissors, ArrowRight } from "lucide-react";

const C = {
  bg:      "#070707",
  card:    "#0f0f14",
  border:  "rgba(255,255,255,0.07)",
  surface: "#16161e",
  primary: "#F0EDE8",
  secondary:"#6b6870",
  muted:   "#2e2d35",
  red:     "#CC1A1A",
};

export default function BarberLoginPage() {
  const { login, role, loaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;
    if (role === "admin") router.replace("/admin");
    else if (role) router.replace(`/barber/${role}`);
  }, [role, loaded, router]);

  const handleLogin = (r) => {
    login(r);
    if (r === "admin") router.push("/admin");
    else router.push(`/barber/${r}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: C.bg }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <div style={{ fontSize: "11px", letterSpacing: "0.3em", color: C.red, textTransform: "uppercase", fontWeight: 600, marginBottom: "6px" }}>
          MAKAS
        </div>
        <h1
          className="font-display font-light"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1 }}
        >
          Çalışan <span style={{ fontStyle: "italic", color: C.red }}>Girişi</span>
        </h1>
        <p style={{ fontSize: "13px", color: C.secondary, marginTop: "8px" }}>
          Devam etmek için hesabınızı seçin
        </p>
      </motion.div>

      <div style={{ width: "100%", maxWidth: "720px" }}>
        {/* Admin card */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          onClick={() => handleLogin("admin")}
          className="w-full text-left flex items-center gap-5 mb-4"
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "14px",
            padding: "24px 28px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(204,26,26,0.4)";
            e.currentTarget.style.background = "#121218";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.background = C.card;
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: "52px", height: "52px",
              background: `linear-gradient(135deg, ${C.red}, #9a1212)`,
              borderRadius: "12px",
            }}
          >
            <Crown size={22} color="#fff" />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: "15px", color: C.primary, fontWeight: 600, marginBottom: "3px" }}>Süper Admin</div>
            <div style={{ fontSize: "12px", color: C.secondary }}>Tüm randevular, kasa, berber yönetimi</div>
          </div>
          <ArrowRight size={16} style={{ color: C.red }} />
        </motion.button>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-4"
        >
          <div style={{ flex: 1, height: "1px", background: C.border }} />
          <span style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.08em" }}>BERBERLER</span>
          <div style={{ flex: 1, height: "1px", background: C.border }} />
        </motion.div>

        {/* Barber cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {barbers.map((barber, i) => (
            <motion.button
              key={barber.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.07 }}
              onClick={() => handleLogin(barber.id)}
              className="text-left flex items-center gap-4"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(204,26,26,0.3)";
                e.currentTarget.style.background = "#121218";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = C.card;
              }}
            >
              <div
                className="flex items-center justify-center font-bold text-white shrink-0"
                style={{
                  width: "40px", height: "40px",
                  background: `linear-gradient(135deg, ${C.red}, #9a1212)`,
                  borderRadius: "10px",
                  fontSize: "12px",
                  letterSpacing: "0.04em",
                }}
              >
                {barber.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontSize: "13px", color: C.primary, fontWeight: 500,
                    marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {barber.name}
                </div>
                <div
                  style={{
                    fontSize: "10px", color: barber.available ? "#22c55e" : C.muted,
                    display: "flex", alignItems: "center", gap: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "5px", height: "5px", borderRadius: "50%",
                      background: barber.available ? "#22c55e" : C.muted,
                      flexShrink: 0,
                    }}
                  />
                  {barber.available ? "Müsait" : "İzinli"}
                </div>
              </div>
              <Scissors size={13} style={{ color: C.muted, flexShrink: 0 }} />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Back to site */}
      <motion.a
        href="/"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ fontSize: "12px", color: C.muted, marginTop: "40px", textDecoration: "none" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = C.secondary; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
      >
        ← Siteye dön
      </motion.a>
    </div>
  );
}

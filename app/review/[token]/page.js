"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Star, CheckCircle, MessageSquare, ArrowRight, ArrowLeft } from "lucide-react";

const C = {
  bg:        "#F6F3EE",
  card:      "#FFFFFF",
  border:    "#E5DFD6",
  primary:   "#111111",
  secondary: "#44403C",
  muted:     "#6B7280",
};

function BarberAvatar({ barber, size = 80 }) {
  if (barber?.profilePhoto) {
    return (
      <img
        src={barber.profilePhoto}
        alt={barber.nameTr}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
          border: `2px solid ${C.border}`,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${C.primary}, #7f1d1d)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.28, fontWeight: 700, color: "#fff",
      letterSpacing: "0.04em",
    }}>
      {barber?.avatar || "?"}
    </div>
  );
}

function StarPicker({ value, onChange, size = 40 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            transform: hovered >= n ? "scale(1.15)" : "scale(1)",
            transition: "transform 0.15s",
          }}
        >
          <Star
            size={size}
            fill={n <= (hovered || value) ? C.primary : "none"}
            style={{ color: n <= (hovered || value) ? C.primary : C.border }}
          />
        </button>
      ))}
    </div>
  );
}

const LABELS = ["Yıldıza tıklayın", "Hayal kırıklığı", "Gelişebilir", "İyi", "Çok iyi!", "Mükemmel!"];

export default function ReviewPage() {
  const { token } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [shopRating,   setShopRating]   = useState(0);
  const [barberRating, setBarberRating] = useState(0);
  const [comment, setComment] = useState("");
  const [step, setStep] = useState("shop"); // shop | barber | comment | done
  const [submitting, setSubmitting] = useState(false);
  const [googleUrl, setGoogleUrl]   = useState(null);
  const [finalShopRating, setFinalShopRating] = useState(0);

  useEffect(() => {
    fetch(`/api/review/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.alreadyReviewed) setStep("done");
        else if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Bağlantı hatası"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleShopRate = (n) => {
    setShopRating(n);
    setTimeout(() => setStep("barber"), 250);
  };
  const handleBarberRate = (n) => {
    setBarberRating(n);
    setTimeout(() => setStep("comment"), 250);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/review/${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ shopRating, barberRating, comment }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Bir hata oluştu");
        return;
      }
      setFinalShopRating(shopRating);
      if (result.redirectToGoogle && result.googleUrl) setGoogleUrl(result.googleUrl);
      setStep("done");
    } catch {
      alert("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.primary, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 24 }}>
        <p style={{ color: C.muted, textAlign: "center" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, background: C.primary, borderRadius: "10px",
          fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 12,
        }}>{(data?.shop?.name || "M")[0]}</div>
        <p style={{ fontSize: 12, color: C.muted, letterSpacing: "0.06em" }}>
          {data?.shop?.name || "Salon"}
        </p>
      </div>

      <div style={{
        width: "100%", maxWidth: 440,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "36px 32px",
        boxShadow: "0 4px 24px rgba(17,17,17,0.07)",
      }}>
        {step === "done" ? (
          <DoneState rating={finalShopRating} googleUrl={googleUrl} />
        ) : (
          <>
            {data && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${C.border}` }}>
                <BarberAvatar barber={data.barber} size={60} />
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: C.primary, lineHeight: 1.3 }}>{data.barber?.nameTr}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{data.barber?.titleTr}</p>
                  {data.appointment && (
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      {data.appointment.service?.nameTr} · {formatDate(data.appointment.date)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <StepDots step={step} />

            {step === "shop" && (
              <>
                <p style={{ fontSize: 20, fontWeight: 600, color: C.primary, textAlign: "center", marginBottom: 8 }}>
                  Salonu değerlendirin
                </p>
                <p style={{ fontSize: 14, color: C.muted, textAlign: "center", marginBottom: 28 }}>
                  Merhaba {data?.customerName?.split(" ")[0]}, salon deneyiminiz nasıldı?
                </p>
                <StarPicker value={shopRating} onChange={handleShopRate} />
                <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 20 }}>
                  {LABELS[shopRating]}
                </p>
              </>
            )}

            {step === "barber" && (
              <>
                <p style={{ fontSize: 20, fontWeight: 600, color: C.primary, textAlign: "center", marginBottom: 8 }}>
                  {data?.barber?.nameTr?.split(" ")[0]} nasıldı?
                </p>
                <p style={{ fontSize: 14, color: C.muted, textAlign: "center", marginBottom: 28 }}>
                  Berberinizi değerlendirin.
                </p>
                <StarPicker value={barberRating} onChange={handleBarberRate} />
                <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 20 }}>
                  {LABELS[barberRating]}
                </p>
                <button
                  type="button"
                  onClick={() => setStep("shop")}
                  style={{
                    marginTop: 24, display: "flex", alignItems: "center", gap: 4,
                    background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={12} /> Geri
                </button>
              </>
            )}

            {step === "comment" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
                  <RatingSummary label="Salon"   value={shopRating} />
                  <RatingSummary label="Berber"  value={barberRating} />
                </div>

                <p style={{ fontSize: 16, fontWeight: 600, color: C.primary, textAlign: "center", marginBottom: 8 }}>
                  Bir şey eklemek ister misiniz?
                </p>
                <p style={{ fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 20 }}>
                  Yorumunuz isteğe bağlıdır.
                </p>

                <div style={{ position: "relative", marginBottom: 16 }}>
                  <MessageSquare size={16} style={{ position: "absolute", left: 12, top: 12, color: C.muted, pointerEvents: "none" }} />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deneyiminizi anlatın..."
                    rows={4}
                    maxLength={1000}
                    style={{
                      width: "100%", padding: "10px 12px 10px 36px",
                      border: `1px solid ${C.border}`, borderRadius: 8,
                      fontSize: 13, color: C.primary, background: C.bg,
                      resize: "vertical", outline: "none", fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "14px",
                    background: C.primary, color: "var(--makas-bg)",
                    border: "none", borderRadius: 9,
                    fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {submitting ? "Gönderiliyor…" : "Değerlendirmeyi Gönder"}
                  {!submitting && <ArrowRight size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("barber")}
                  style={{
                    marginTop: 16, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 4,
                    background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={12} /> Geri
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StepDots({ step }) {
  const order = ["shop", "barber", "comment"];
  const idx = order.indexOf(step);
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 22 }}>
      {order.map((s, i) => (
        <span key={s} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: i <= idx ? C.primary : C.border,
          transition: "background 0.2s",
        }} />
      ))}
    </div>
  );
}

function RatingSummary({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
      <div style={{ display: "flex", gap: 2 }}>
        {[1,2,3,4,5].map((n) => (
          <Star key={n} size={14} fill={n <= value ? C.primary : "none"} style={{ color: n <= value ? C.primary : C.border }} />
        ))}
      </div>
    </div>
  );
}

function DoneState({ rating, googleUrl }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <CheckCircle size={52} style={{ color: rating >= 4 ? "#16a34a" : C.primary }} />
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 8 }}>
        {rating >= 4 ? "Teşekkürler!" : "Geri bildiriminiz alındı"}
      </p>
      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
        {rating >= 4
          ? "Deneyiminizi paylaştığınız için teşekkürler. Sizi tekrar görmekten memnuniyet duyarız!"
          : "Geri bildiriminizi dikkate alacağız ve hizmetimizi iyileştirmek için kullanacağız."}
      </p>

      {googleUrl && (
        <>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
            Memnuniyetinizi Google'da da paylaşır mısınız?
          </p>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.primary, color: "var(--makas-bg)",
              padding: "13px 28px", borderRadius: 9,
              fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}
          >
            Google'da Değerlendir
            <ArrowRight size={15} />
          </a>
        </>
      )}
    </div>
  );
}

function formatDate(str) {
  if (!str) return "";
  const [, m, d] = str.split("-").map(Number);
  const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  return `${d} ${months[m - 1]}`;
}

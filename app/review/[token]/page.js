"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Star, CheckCircle, MessageSquare, ArrowRight } from "lucide-react";

const C = {
  bg:       "#F6F3EE",
  card:     "#FFFFFF",
  border:   "#E5DFD6",
  primary:  "#111111",
  secondary:"#44403C",
  muted:    "#6B7280",
  red:      "#C62828",
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
      background: `linear-gradient(135deg, ${C.red}, #7f1d1d)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.28, fontWeight: 700, color: "#fff",
      letterSpacing: "0.04em",
    }}>
      {barber?.avatar || "?"}
    </div>
  );
}

export default function ReviewPage() {
  const { token } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [step, setStep]       = useState("rate"); // rate | comment | done
  const [submitting, setSubmitting] = useState(false);
  const [googleUrl, setGoogleUrl]   = useState(null);

  useEffect(() => {
    fetch(`/api/review/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.alreadyReviewed) { setStep("done"); setRating(d.rating ?? 0); }
        else setData(d);
      })
      .catch(() => setError("Bağlantı hatası"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRate = (stars) => {
    setRating(stars);
    if (stars >= 5) {
      // High rating — submit immediately then redirect to Google
      submit(stars, "");
    } else {
      // Low rating — show comment form
      setStep("comment");
    }
  };

  const submit = async (r = rating, c = comment) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/review/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: r, comment: c }),
      });
      const result = await res.json();
      if (result.redirectToGoogle && result.googleUrl) {
        setGoogleUrl(result.googleUrl);
      }
      setStep("done");
    } catch {
      alert("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.red, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <p style={{ color: C.muted }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Brand */}
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, background: C.red, borderRadius: "10px",
          fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 12,
        }}>A</div>
        <p style={{ fontSize: 12, color: C.muted, letterSpacing: "0.06em" }}>
          {data?.shop?.name || "ABDURRAHMAN ÇELİK EXCLUSIVE SALON"}
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
          <DoneState rating={rating} googleUrl={googleUrl} />
        ) : (
          <>
            {/* Barber info */}
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

            {step === "rate" && (
              <>
                <p style={{ fontSize: 20, fontWeight: 600, color: C.primary, textAlign: "center", marginBottom: 8 }}>
                  Randevunuz nasıldı?
                </p>
                <p style={{ fontSize: 14, color: C.muted, textAlign: "center", marginBottom: 28 }}>
                  Merhaba {data?.customerName?.split(" ")[0]}, deneyiminizi değerlendirin.
                </p>

                {/* Star rating */}
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => handleRate(n)}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: 4,
                        transform: hovered >= n ? "scale(1.15)" : "scale(1)",
                        transition: "transform 0.15s",
                      }}
                    >
                      <Star
                        size={40}
                        fill={n <= (hovered || rating) ? C.red : "none"}
                        style={{ color: n <= (hovered || rating) ? C.red : C.border }}
                      />
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
                  {hovered === 5 ? "Harika! 🎉" : hovered === 4 ? "Çok iyi!" : hovered === 3 ? "İyi" : hovered === 2 ? "Gelişebilir" : hovered === 1 ? "Hayal kırıklığı" : "Yıldıza tıklayın"}
                </p>
              </>
            )}

            {step === "comment" && (
              <>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={28} fill={n <= rating ? C.red : "none"} style={{ color: n <= rating ? C.red : C.border }} />
                  ))}
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: C.primary, textAlign: "center", marginBottom: 8 }}>
                  Geri bildiriminizi paylaşın
                </p>
                <p style={{ fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 20 }}>
                  Deneyiminizi iyileştirmek için görüşleriniz değerli.
                </p>

                <div style={{ position: "relative", marginBottom: 16 }}>
                  <MessageSquare size={16} style={{ position: "absolute", left: 12, top: 12, color: C.muted, pointerEvents: "none" }} />
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Deneyiminizi anlatın..."
                    rows={4}
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
                  onClick={() => submit()}
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "14px",
                    background: C.red, color: "#fff",
                    border: "none", borderRadius: 9,
                    fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {submitting ? "Gönderiliyor…" : "Geri Bildirimi Gönder"}
                  {!submitting && <ArrowRight size={15} />}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DoneState({ rating, googleUrl }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <CheckCircle size={52} style={{ color: rating >= 5 ? "#16a34a" : C.red }} />
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 8 }}>
        {rating >= 5 ? "Teşekkürler! 🎉" : "Geri bildiriminiz alındı"}
      </p>
      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
        {rating >= 5
          ? "Deneyiminizi paylaştığınız için teşekkürler. Sizi tekrar görmekten memnuniyet duyarız!"
          : "Geri bildiriminizi dikkate alacağız. Sizi tekrar görmekten mutluluk duyarız."}
      </p>

      {googleUrl && (
        <>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
            Memnuniyetinizi Google'da paylaşmak ister misiniz?
          </p>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.red, color: "#fff",
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

import Link from "next/link";

export const metadata = {
  title: "Çerez Politikası — MAKAS",
  description: "MAKAS platformunun çerez kullanımına ilişkin politika.",
};

const C = { bg: "#F7F4EE", primary: "#111111", secondary: "#4A4A4A", muted: "#8A8480", border: "#E5DED3" };

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: C.primary, marginBottom: "14px", letterSpacing: "-0.01em" }}>{title}</h2>
      <div style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.85 }}>{children}</div>
    </section>
  );
}

const COOKIES = [
  { name: "session", type: "Zorunlu", purpose: "Kullanıcı oturumunu sürdürme", duration: "Oturum süresi" },
  { name: "lang", type: "Tercih", purpose: "Dil seçimini hatırlama", duration: "1 yıl" },
];

export default function CerezPolitikasiPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "80px 24px 120px" }}>

        <Link href="/" style={{ fontSize: "12px", color: C.muted, textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-block", marginBottom: "48px" }}>
          ← makas.furunci.tech
        </Link>

        <div style={{ marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: "12px" }}>Son güncelleme: Haziran 2026</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 300, color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "16px" }}>
            Çerez Politikası
          </h1>
          <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.8 }}>
            Bu sayfa, <strong>makas.furunci.tech</strong> platformunun hangi çerezleri neden kullandığını açıklar.
          </p>
        </div>

        <div style={{ width: "48px", height: "1px", background: C.border, marginBottom: "48px" }} />

        <Section title="Çerez Nedir?">
          <p>Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır. Oturum yönetimi, tercih hatırlama ve site performansı gibi amaçlarla kullanılır.</p>
        </Section>

        <Section title="Kullandığımız Çerezler">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Çerez Adı", "Tür", "Amaç", "Süre"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px 10px", color: C.primary, fontWeight: 600, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c, i) => (
                  <tr key={c.name} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)" }}>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "12px", color: C.primary }}>{c.name}</td>
                    <td style={{ padding: "10px 12px", color: C.secondary }}>{c.type}</td>
                    <td style={{ padding: "10px 12px", color: C.secondary }}>{c.purpose}</td>
                    <td style={{ padding: "10px 12px", color: C.muted, whiteSpace: "nowrap" }}>{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Analitik ve Üçüncü Taraf Çerezler">
          <p>Platform şu an harici analitik veya reklam çerezi kullanmamaktadır. Google Maps embed kullanıldığında Google'ın kendi çerez politikası geçerli olabilir.</p>
        </Section>

        <Section title="Çerezleri Kontrol Etme">
          <p>Tarayıcı ayarlarınızdan çerezleri reddedebilir veya silebilirsiniz. Ancak zorunlu çerezlerin devre dışı bırakılması oturum açma gibi temel işlevleri etkileyebilir.</p>
        </Section>

        <Section title="İletişim">
          <p><a href="mailto:sercanfurunci41@gmail.com" style={{ color: C.primary }}>sercanfurunci41@gmail.com</a></p>
        </Section>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "32px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/gizlilik" style={{ fontSize: "12px", color: C.muted, textDecoration: "none" }}>Gizlilik Politikası</Link>
          <Link href="/kullanim-kosullari" style={{ fontSize: "12px", color: C.muted, textDecoration: "none" }}>Kullanım Koşulları</Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Kullanım Koşulları — MAKAS",
  description: "MAKAS randevu platformunu kullanmaya ilişkin hüküm ve koşullar.",
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

export default function KullanimKosullariPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "80px 24px 120px" }}>

        <Link href="/" style={{ fontSize: "12px", color: C.muted, textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-block", marginBottom: "48px" }}>
          ← makas.furunci.tech
        </Link>

        <div style={{ marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: "12px" }}>Son güncelleme: Haziran 2026</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 300, color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "16px" }}>
            Kullanım Koşulları
          </h1>
          <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.8 }}>
            <strong>makas.furunci.tech</strong> platformunu kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız platformu kullanmayınız.
          </p>
        </div>

        <div style={{ width: "48px", height: "1px", background: C.border, marginBottom: "48px" }} />

        <Section title="1. Hizmet Tanımı">
          <p>MAKAS; berber, kuaför ve güzellik merkezi gibi işletmelere yönelik online randevu yönetim sistemi sunan bir yazılım platformudur. Platform üzerinden randevu alınabilir, işletme profilleri yönetilebilir ve müşteri takibi yapılabilir.</p>
        </Section>

        <Section title="2. Hesap Oluşturma">
          <p style={{ marginBottom: "10px" }}>İşletme hesabı açmak için doğru ve güncel bilgi vermeniz zorunludur. Hesabınızın güvenliğinden siz sorumlusunuz; şifrenizi kimseyle paylaşmamanızı öneririz.</p>
          <p>Yanlış bilgi verilerek oluşturulan hesaplar önceden bildirim yapılmaksızın askıya alınabilir.</p>
        </Section>

        <Section title="3. Kullanım Kuralları">
          <p style={{ marginBottom: "12px" }}>Platform üzerinde aşağıdaki eylemler yasaktır:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Yanıltıcı, sahte veya başkasına ait bilgilerle hesap oluşturmak</li>
            <li>Sistemi otomatik araçlarla aşırı yüklemek veya istismar etmek</li>
            <li>Diğer kullanıcıların verilerine izinsiz erişmeye çalışmak</li>
            <li>Platforma zarar verecek yazılım veya içerik yüklemek</li>
          </ul>
        </Section>

        <Section title="4. Hizmet Sürekliliği">
          <p>Platform, planlı bakım ve beklenmedik teknik sorunlar nedeniyle zaman zaman erişime kapatılabilir. Bu durumlarda herhangi bir tazminat yükümlülüğümüz bulunmamaktadır.</p>
        </Section>

        <Section title="5. Ücretlendirme">
          <p>Platformun temel özellikleri ücretsizdir. İleride ücretli planlar sunulması durumunda mevcut kullanıcılar önceden bilgilendirilecektir.</p>
        </Section>

        <Section title="6. Fikri Mülkiyet">
          <p>Platform tasarımı, kodu ve içeriği MAKAS'a aittir. İzinsiz kopyalanamaz, dağıtılamaz veya ticari amaçla kullanılamaz.</p>
        </Section>

        <Section title="7. Sorumluluk Sınırı">
          <p>MAKAS; veri kaybı, gelir kaybı veya üçüncü taraf hizmetlerinden kaynaklanan zararlar için sorumluluk kabul etmez. Platform "olduğu gibi" sunulmaktadır.</p>
        </Section>

        <Section title="8. Hesap Sonlandırma">
          <p>İstediğiniz zaman hesabınızı kapatabilirsiniz. Kullanım koşullarını ihlal eden hesaplar bildirim yapılmaksızın sonlandırılabilir.</p>
        </Section>

        <Section title="9. Uygulanacak Hukuk">
          <p>Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul mahkemeleri yetkilidir.</p>
        </Section>

        <Section title="10. İletişim">
          <p><a href="mailto:sercanfurunci41@gmail.com" style={{ color: C.primary }}>sercanfurunci41@gmail.com</a></p>
        </Section>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "32px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/gizlilik" style={{ fontSize: "12px", color: C.muted, textDecoration: "none" }}>Gizlilik Politikası</Link>
          <Link href="/cerez-politikasi" style={{ fontSize: "12px", color: C.muted, textDecoration: "none" }}>Çerez Politikası</Link>
        </div>
      </div>
    </div>
  );
}

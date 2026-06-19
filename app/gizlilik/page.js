import Link from "next/link";

export const metadata = {
  title: "Gizlilik Politikası — MAKAS",
  description: "MAKAS randevu platformunun kişisel verilerin korunmasına ilişkin gizlilik politikası ve KVKK aydınlatma metni.",
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

export default function GizlilikPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "80px 24px 120px" }}>

        <Link href="/" style={{ fontSize: "12px", color: C.muted, textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-block", marginBottom: "48px" }}>
          ← makas.furunci.tech
        </Link>

        <div style={{ marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: "12px" }}>Son güncelleme: Haziran 2026</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 300, color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "16px" }}>
            Gizlilik Politikası
          </h1>
          <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.8 }}>
            MAKAS olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu politika, <strong>makas.furunci.tech</strong> platformunu kullanan bireyler ve işletmeler hakkında hangi verileri topladığımızı, nasıl kullandığımızı ve koruduğumuzu açıklar. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla hazırlanmıştır.
          </p>
        </div>

        <div style={{ width: "48px", height: "1px", background: C.border, marginBottom: "48px" }} />

        <Section title="1. Veri Sorumlusu">
          <p>Veri sorumlusu <strong>Sercan Furunci</strong>'dir. İletişim: <a href="mailto:sercanfurunci41@gmail.com" style={{ color: C.primary }}>sercanfurunci41@gmail.com</a></p>
        </Section>

        <Section title="2. Toplanan Veriler">
          <p style={{ marginBottom: "12px" }}>Platform üzerinden aşağıdaki kişisel veriler işlenmektedir:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Müşteri verileri:</strong> Ad, soyad, telefon numarası, randevu geçmişi.</li>
            <li><strong>İşletme verileri:</strong> Salon adı, adresi, telefon numarası, çalışma saatleri, berber bilgileri.</li>
            <li><strong>Hesap verileri:</strong> E-posta adresi, şifreli kimlik bilgileri.</li>
            <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı türü, sayfa görüntüleme logları.</li>
          </ul>
        </Section>

        <Section title="3. Verilerin İşlenme Amaçları">
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Online randevu oluşturma ve yönetimi</li>
            <li>Salon ve berber hesabı yönetimi</li>
            <li>Platform güvenliği ve hata tespiti</li>
            <li>Hizmet kalitesinin iyileştirilmesi</li>
          </ul>
        </Section>

        <Section title="4. Verilerin Aktarılması">
          <p>Kişisel verileriniz; yasal yükümlülükler dışında üçüncü taraflarla paylaşılmaz veya satılmaz. Platform altyapısı için kullanılan hizmetler (sunucu, veritabanı) KVKK ve GDPR uyumlu sağlayıcılardan temin edilmektedir.</p>
        </Section>

        <Section title="5. Saklama Süresi">
          <p>Verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap silinmesini talep etmeniz halinde verileriniz 30 gün içinde kalıcı olarak silinir.</p>
        </Section>

        <Section title="6. KVKK Kapsamındaki Haklarınız">
          <p style={{ marginBottom: "12px" }}>KVKK madde 11 uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>Yanlış verilerin düzeltilmesini isteme</li>
            <li>Verilerin silinmesini veya yok edilmesini talep etme</li>
            <li>Otomatik sistemlerle aleyhine sonuç doğuran işlemlere itiraz etme</li>
          </ul>
          <p style={{ marginTop: "12px" }}>Talepleriniz için: <a href="mailto:sercanfurunci41@gmail.com" style={{ color: C.primary }}>sercanfurunci41@gmail.com</a></p>
        </Section>

        <Section title="7. Çerezler">
          <p>Platform oturum yönetimi için zorunlu çerezler kullanmaktadır. Ayrıntılı bilgi için <Link href="/cerez-politikasi" style={{ color: C.primary }}>Çerez Politikası</Link>'nı inceleyebilirsiniz.</p>
        </Section>

        <Section title="8. Değişiklikler">
          <p>Bu politika önceden bildirim yapılmaksızın güncellenebilir. Önemli değişiklikler platform üzerinden duyurulur.</p>
        </Section>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "32px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/kullanim-kosullari" style={{ fontSize: "12px", color: C.muted, textDecoration: "none" }}>Kullanım Koşulları</Link>
          <Link href="/cerez-politikasi" style={{ fontSize: "12px", color: C.muted, textDecoration: "none" }}>Çerez Politikası</Link>
        </div>
      </div>
    </div>
  );
}

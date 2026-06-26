import LegalLayout, { Section, Note } from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Gizlilik Politikası — MAKAS",
  description:
    "MAKAS randevu platformunun kişisel verilerin korunmasına ilişkin gizlilik politikası ve KVKK aydınlatma metni.",
};

const TOC = [
  { id: "veri-sorumlusu", label: "Veri Sorumlusu" },
  { id: "toplanan-veriler", label: "Toplanan Veriler" },
  { id: "isleme-amaclari", label: "İşlenme Amaçları" },
  { id: "aktarma", label: "Verilerin Aktarılması" },
  { id: "saklama", label: "Saklama Süresi" },
  { id: "kvkk-haklari", label: "KVKK Haklarınız" },
  { id: "cerezler", label: "Çerezler" },
  { id: "degisiklikler", label: "Değişiklikler" },
];

export default function GizlilikPage() {
  return (
    <LegalLayout
      eyebrow="Yasal · KVKK"
      title="Gizlilik Politikası"
      updated="Haziran 2026"
      currentSlug="gizlilik"
      toc={TOC}
      lede={
        <>
          MAKAS olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu
          politika, <strong>makas.furunci.tech</strong> platformunu kullanan
          bireyler ve işletmeler hakkında hangi verileri topladığımızı, nasıl
          kullandığımızı ve koruduğumuzu açıklar. 6698 sayılı Kişisel Verilerin
          Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla
          hazırlanmıştır.
        </>
      }
    >
      <Section id="veri-sorumlusu" number={1} title="Veri Sorumlusu">
        <p>
          Veri sorumlusu <strong>Sercan Furunci</strong>'dir. İletişim:{" "}
          <a href="mailto:sercanfurunci41@gmail.com">sercanfurunci41@gmail.com</a>
        </p>
      </Section>

      <Section id="toplanan-veriler" number={2} title="Toplanan Veriler">
        <p>Platform üzerinden aşağıdaki kişisel veriler işlenmektedir:</p>
        <ul>
          <li>
            <strong>Müşteri verileri:</strong> Ad, soyad, telefon numarası,
            randevu geçmişi.
          </li>
          <li>
            <strong>İşletme verileri:</strong> Salon adı, adresi, telefon
            numarası, çalışma saatleri, berber bilgileri.
          </li>
          <li>
            <strong>Hesap verileri:</strong> E-posta adresi, şifreli kimlik
            bilgileri.
          </li>
          <li>
            <strong>Teknik veriler:</strong> IP adresi, tarayıcı türü, sayfa
            görüntüleme logları.
          </li>
        </ul>
      </Section>

      <Section id="isleme-amaclari" number={3} title="Verilerin İşlenme Amaçları">
        <ul>
          <li>Online randevu oluşturma ve yönetimi</li>
          <li>Salon ve berber hesabı yönetimi</li>
          <li>Platform güvenliği ve hata tespiti</li>
          <li>Hizmet kalitesinin iyileştirilmesi</li>
        </ul>
      </Section>

      <Section id="aktarma" number={4} title="Verilerin Aktarılması">
        <p>
          Kişisel verileriniz; yasal yükümlülükler dışında üçüncü taraflarla
          paylaşılmaz veya satılmaz. Platform altyapısı için kullanılan
          hizmetler (sunucu, veritabanı) KVKK ve GDPR uyumlu sağlayıcılardan
          temin edilmektedir.
        </p>
      </Section>

      <Section id="saklama" number={5} title="Saklama Süresi">
        <p>
          Verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap silinmesini
          talep etmeniz halinde verileriniz 30 gün içinde kalıcı olarak silinir.
        </p>
      </Section>

      <Section id="kvkk-haklari" number={6} title="KVKK Kapsamındaki Haklarınız">
        <p>KVKK madde 11 uyarınca aşağıdaki haklara sahipsiniz:</p>
        <ul>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme</li>
          <li>Yanlış verilerin düzeltilmesini isteme</li>
          <li>Verilerin silinmesini veya yok edilmesini talep etme</li>
          <li>Otomatik sistemlerle aleyhine sonuç doğuran işlemlere itiraz etme</li>
        </ul>
        <Note>
          Talepleriniz için{" "}
          <a href="mailto:sercanfurunci41@gmail.com">sercanfurunci41@gmail.com</a>{" "}
          adresine yazılı başvuruda bulunabilirsiniz. Başvurular 30 gün içinde
          ücretsiz olarak yanıtlanır.
        </Note>
      </Section>

      <Section id="cerezler" number={7} title="Çerezler">
        <p>
          Platform oturum yönetimi için zorunlu çerezler kullanmaktadır.
          Ayrıntılı bilgi için{" "}
          <a href="/cerez-politikasi">Çerez Politikası</a>'nı inceleyebilirsiniz.
        </p>
      </Section>

      <Section id="degisiklikler" number={8} title="Değişiklikler">
        <p>
          Bu politika önceden bildirim yapılmaksızın güncellenebilir. Önemli
          değişiklikler platform üzerinden duyurulur.
        </p>
      </Section>
    </LegalLayout>
  );
}

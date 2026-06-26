import LegalLayout, { Section, Note } from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Kullanım Koşulları — MAKAS",
  description: "MAKAS randevu platformunu kullanmaya ilişkin hüküm ve koşullar.",
};

const TOC = [
  { id: "hizmet-tanimi", label: "Hizmet Tanımı" },
  { id: "hesap-olusturma", label: "Hesap Oluşturma" },
  { id: "kullanim-kurallari", label: "Kullanım Kuralları" },
  { id: "hizmet-surekliligi", label: "Hizmet Sürekliliği" },
  { id: "ucretlendirme", label: "Ücretlendirme" },
  { id: "fikri-mulkiyet", label: "Fikri Mülkiyet" },
  { id: "sorumluluk-siniri", label: "Sorumluluk Sınırı" },
  { id: "hesap-sonlandirma", label: "Hesap Sonlandırma" },
  { id: "uygulanacak-hukuk", label: "Uygulanacak Hukuk" },
  { id: "iletisim", label: "İletişim" },
];

export default function KullanimKosullariPage() {
  return (
    <LegalLayout
      eyebrow="Yasal · Hizmet Şartları"
      title="Kullanım Koşulları"
      updated="Haziran 2026"
      currentSlug="kullanim-kosullari"
      toc={TOC}
      lede={
        <>
          <strong>makas.furunci.tech</strong> platformunu kullanarak aşağıdaki
          koşulları kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız
          platformu kullanmayınız.
        </>
      }
    >
      <Section id="hizmet-tanimi" number={1} title="Hizmet Tanımı">
        <p>
          MAKAS; berber, kuaför ve güzellik merkezi gibi işletmelere yönelik
          online randevu yönetim sistemi sunan bir yazılım platformudur.
          Platform üzerinden randevu alınabilir, işletme profilleri yönetilebilir
          ve müşteri takibi yapılabilir.
        </p>
      </Section>

      <Section id="hesap-olusturma" number={2} title="Hesap Oluşturma">
        <p>
          İşletme hesabı açmak için doğru ve güncel bilgi vermeniz zorunludur.
          Hesabınızın güvenliğinden siz sorumlusunuz; şifrenizi kimseyle
          paylaşmamanızı öneririz.
        </p>
        <p>
          Yanlış bilgi verilerek oluşturulan hesaplar önceden bildirim
          yapılmaksızın askıya alınabilir.
        </p>
      </Section>

      <Section id="kullanim-kurallari" number={3} title="Kullanım Kuralları">
        <p>Platform üzerinde aşağıdaki eylemler yasaktır:</p>
        <ul>
          <li>Yanıltıcı, sahte veya başkasına ait bilgilerle hesap oluşturmak</li>
          <li>Sistemi otomatik araçlarla aşırı yüklemek veya istismar etmek</li>
          <li>Diğer kullanıcıların verilerine izinsiz erişmeye çalışmak</li>
          <li>Platforma zarar verecek yazılım veya içerik yüklemek</li>
        </ul>
        <Note tone="warning">
          Bu kuralların ihlali halinde hesabınız bildirim yapılmaksızın askıya
          alınabilir ve yasal süreç başlatılabilir.
        </Note>
      </Section>

      <Section id="hizmet-surekliligi" number={4} title="Hizmet Sürekliliği">
        <p>
          Platform, planlı bakım ve beklenmedik teknik sorunlar nedeniyle zaman
          zaman erişime kapatılabilir. Bu durumlarda herhangi bir tazminat
          yükümlülüğümüz bulunmamaktadır.
        </p>
      </Section>

      <Section id="ucretlendirme" number={5} title="Ücretlendirme">
        <p>
          Platform aylık abonelik modeliyle çalışmaktadır. Güncel fiyatlandırma
          için <a href="/#pricing">fiyat sayfasını</a> inceleyebilirsiniz. Fiyat
          değişiklikleri en az 30 gün öncesinden bildirilir.
        </p>
      </Section>

      <Section id="fikri-mulkiyet" number={6} title="Fikri Mülkiyet">
        <p>
          Platform tasarımı, kodu ve içeriği MAKAS'a aittir. İzinsiz
          kopyalanamaz, dağıtılamaz veya ticari amaçla kullanılamaz.
        </p>
      </Section>

      <Section id="sorumluluk-siniri" number={7} title="Sorumluluk Sınırı">
        <p>
          MAKAS; veri kaybı, gelir kaybı veya üçüncü taraf hizmetlerinden
          kaynaklanan zararlar için sorumluluk kabul etmez. Platform "olduğu
          gibi" sunulmaktadır.
        </p>
      </Section>

      <Section id="hesap-sonlandirma" number={8} title="Hesap Sonlandırma">
        <p>
          İstediğiniz zaman hesabınızı kapatabilirsiniz. Kullanım koşullarını
          ihlal eden hesaplar bildirim yapılmaksızın sonlandırılabilir.
        </p>
      </Section>

      <Section id="uygulanacak-hukuk" number={9} title="Uygulanacak Hukuk">
        <p>
          Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda
          İstanbul mahkemeleri yetkilidir.
        </p>
      </Section>

      <Section id="iletisim" number={10} title="İletişim">
        <p>
          <a href="mailto:sercanfurunci41@gmail.com">sercanfurunci41@gmail.com</a>
        </p>
      </Section>
    </LegalLayout>
  );
}

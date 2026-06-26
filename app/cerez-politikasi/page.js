import LegalLayout, { Section } from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Çerez Politikası — MAKAS",
  description: "MAKAS platformunun çerez kullanımına ilişkin politika.",
};

const TOC = [
  { id: "cerez-nedir", label: "Çerez Nedir?" },
  { id: "kullandigimiz-cerezler", label: "Kullandığımız Çerezler" },
  { id: "ucuncu-taraf", label: "Üçüncü Taraf Çerezler" },
  { id: "kontrol", label: "Çerezleri Kontrol Etme" },
  { id: "iletisim", label: "İletişim" },
];

const COOKIES = [
  { name: "session", type: "Zorunlu", purpose: "Kullanıcı oturumunu sürdürme", duration: "Oturum süresi" },
  { name: "lang",    type: "Tercih",  purpose: "Dil seçimini hatırlama",        duration: "1 yıl" },
];

export default function CerezPolitikasiPage() {
  return (
    <LegalLayout
      eyebrow="Yasal · Çerezler"
      title="Çerez Politikası"
      updated="Haziran 2026"
      currentSlug="cerez-politikasi"
      toc={TOC}
      lede={
        <>
          Bu sayfa, <strong>makas.furunci.tech</strong> platformunun hangi
          çerezleri neden kullandığını açıklar.
        </>
      }
    >
      <Section id="cerez-nedir" number={1} title="Çerez Nedir?">
        <p>
          Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza
          kaydedilen küçük metin dosyalarıdır. Oturum yönetimi, tercih hatırlama
          ve site performansı gibi amaçlarla kullanılır.
        </p>
      </Section>

      <Section id="kullandigimiz-cerezler" number={2} title="Kullandığımız Çerezler">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table>
            <thead>
              <tr>
                <th>Çerez Adı</th>
                <th>Tür</th>
                <th>Amaç</th>
                <th>Süre</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c) => (
                <tr key={c.name}>
                  <td>
                    <code>{c.name}</code>
                  </td>
                  <td>{c.type}</td>
                  <td>{c.purpose}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="ucuncu-taraf" number={3} title="Üçüncü Taraf Çerezler">
        <p>
          Platform şu an harici analitik veya reklam çerezi kullanmamaktadır.
          Google Maps embed kullanıldığında Google'ın kendi çerez politikası
          geçerli olabilir.
        </p>
      </Section>

      <Section id="kontrol" number={4} title="Çerezleri Kontrol Etme">
        <p>
          Tarayıcı ayarlarınızdan çerezleri reddedebilir veya silebilirsiniz.
          Ancak zorunlu çerezlerin devre dışı bırakılması oturum açma gibi temel
          işlevleri etkileyebilir.
        </p>
      </Section>

      <Section id="iletisim" number={5} title="İletişim">
        <p>
          <a href="mailto:sercanfurunci41@gmail.com">sercanfurunci41@gmail.com</a>
        </p>
      </Section>
    </LegalLayout>
  );
}

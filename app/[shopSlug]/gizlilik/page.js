import Link from "next/link";
import { resolveShopBySlug } from "@/lib/shop";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop) return {};
  return {
    title: `Gizlilik Politikası — ${shop.name}`,
    description: `${shop.name} randevu sistemi kişisel veri aydınlatma metni.`,
  };
}

const C = { bg: "#F7F4EE", primary: "#111111", secondary: "#4A4A4A", muted: "#8A8480", border: "#E5DED3" };

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: C.primary, marginBottom: "14px" }}>{title}</h2>
      <div style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.85 }}>{children}</div>
    </section>
  );
}

export default async function ShopGizlilikPage({ params }) {
  const { shopSlug } = await params;
  const shop = await resolveShopBySlug(shopSlug);
  if (!shop) notFound();

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "80px 24px 120px" }}>

        <Link href={`/${shopSlug}`} style={{ fontSize: "12px", color: C.muted, textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-block", marginBottom: "48px" }}>
          {`← ${shop.name}`}
        </Link>

        <div style={{ marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: "12px" }}>Son güncelleme: Haziran 2026</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 300, color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "16px" }}>
            Gizlilik Politikası
          </h1>
          <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.8 }}>
            Bu metin, <strong>{shop.name}</strong> adına online randevu hizmeti kapsamında toplanan kişisel verilerin nasıl işlendiğini açıklar.
          </p>
        </div>

        <div style={{ width: "48px", height: "1px", background: C.border, marginBottom: "48px" }} />

        <Section title="1. Veri Sorumlusu">
          <p><strong>{shop.name}</strong></p>
          {shop.address && <p style={{ marginTop: "6px" }}>{shop.address}</p>}
          {shop.phone && <p style={{ marginTop: "6px" }}>{shop.phone}</p>}
          <p style={{ marginTop: "10px", fontSize: "13px", color: C.muted }}>
            Randevu sistemi altyapısı MAKAS platformu ({`makas.furunci.tech`}) tarafından sağlanmaktadır.
          </p>
        </Section>

        <Section title="2. Toplanan Veriler">
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Ad, soyad</li>
            <li>Telefon numarası</li>
            <li>Randevu bilgileri (tarih, saat, hizmet türü)</li>
          </ul>
          <p style={{ marginTop: "12px" }}>Bu veriler yalnızca randevu oluşturmak ve yönetmek amacıyla işlenir.</p>
        </Section>

        <Section title="3. Verilerin Kullanım Amacı">
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Randevunuzun oluşturulması ve size bildirilmesi</li>
            <li>Geçmiş randevu takibi</li>
            <li>Salon içi müşteri yönetimi</li>
          </ul>
        </Section>

        <Section title="4. Saklama ve Silme">
          <p>Verileriniz salon hesabı aktif olduğu sürece saklanır. Silinmesini talep etmek için aşağıdaki iletişim bilgilerini kullanabilirsiniz.</p>
        </Section>

        <Section title="5. KVKK Haklarınız">
          <p style={{ marginBottom: "10px" }}>6698 sayılı KVKK kapsamında verilerinize erişme, düzeltme, silme ve itiraz haklarına sahipsiniz.</p>
          {shop.phone && <p>Telefon: <a href={`tel:${shop.phone.replace(/\s/g, "")}`} style={{ color: C.primary }}>{shop.phone}</a></p>}
        </Section>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "32px" }}>
          <p style={{ fontSize: "12px", color: C.muted }}>
            Platform gizlilik politikası için:{" "}
            <Link href="/gizlilik" style={{ color: C.primary }}>makas.furunci.tech/gizlilik</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

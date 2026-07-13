// ─── Shared static data for the marketing landing page ───────────────────────

export const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Kocaeli"];

export const FEATURED_FEATURE = {
  eyebrow: "Randevu",
  title: "Akıllı takvim, çakışmasız randevu.",
  desc: "Berber başına çalışma saatleri, mola yönetimi, çakışma engelleme. Müşteri kendi randevusunu alıyor — sen işine bakıyorsun.",
  items: ["7/24 online rezervasyon", "Berber bazlı takvim görünümü", "Mola & izin & tatil yönetimi", "Çift rezervasyon engelleme"],
};

export const SUPPORTING_FEATURES = [
  { eyebrow: "Ödeme & gelir", title: "Net hesap, net rapor.", desc: "Günlük gelir, berber bazlı performans, basit ve doğru raporlar.", iconName: "CreditCard", items: ["Günlük gelir", "Berber prim takibi", "Excel'e aktarma"] },
  { eyebrow: "Müşteri", title: "Sadakat tarafı sende.", desc: "Notlar, geçmiş randevular, doğum günü — hepsi kendi sisteminde.", iconName: "Users", items: ["Müşteri notları", "Randevu geçmişi", "Sık gelen etiketleri"] },
  { eyebrow: "Pazarlama", title: "WhatsApp & SMS, otomatik.", desc: "Otomatik hatırlatma, kaçırılan randevu mesajı, yorum daveti.", iconName: "Megaphone", items: ["Otomatik hatırlatma", "WhatsApp şablonları", "Yorum daveti"] },
  { eyebrow: "Yönetim", title: "Kontrol senin elinde.", desc: "Çoklu kullanıcı, izin seviyeleri, mobil panel — her şey net.", iconName: "Settings", items: ["Admin & berber panelleri", "Rol & izinler", "Hizmet kataloğu"] },
];

export const PLAN_FEATURES = [
  "Sınırsız berber",
  "Sınırsız randevu",
  "Admin paneli + müşteri yönetimi",
  "Kendi salonadi.makas.tech adresi",
  "Müşteri notları + geçmiş takibi",
  "Berber performans raporları",
  "Mobil uyumlu rezervasyon sayfası",
];

export const ADDONS = [
  { name: "WhatsApp hatırlatma",    detail: "100 mesaj / ay dahil, sonrası kullanım başına" },
  { name: "SMS cüzdanı",            detail: "Ön ödemeli paket — kullandıkça düşer" },
  { name: "Özel alan adı yönetimi", detail: "₺200 / yıl (alan adı ücreti hariç)" },
];

export const FAQS = [
  { q: "Kurulum ne kadar sürer?",                   a: "Genellikle 1 gün içinde kurulum tamamlanır." },
  { q: "Salonumun kendi adresi olacak mı?",         a: "Evet. Her salona özel salonadi.makas.tech adresi verilir. Kendi alan adınızı bağlamak isterseniz ek hizmet olarak sunuyoruz." },
  { q: "WhatsApp hatırlatma var mı?",               a: "Evet. İsteğe bağlı olarak WhatsApp ve SMS hatırlatma entegrasyonu eklenebilir." },
  { q: "Birden fazla berber ekleyebilir miyim?",    a: "Evet. Tüm ekip üyelerinizi sisteme ekleyebilir ve yönetebilirsiniz." },
  { q: "Müşteri bilgilerini takip edebilir miyim?", a: "Evet. Notlar, geçmiş randevular ve müşteri takibi sistemde yer alır." },
  { q: "Fiyatlandırma nasıl çalışıyor?",            a: "Aylık 500 ₺ sabit ücret. Sınırsız berber, sınırsız randevu. WhatsApp/SMS gibi ek hizmetler kullandığın kadar." },
];

export const DEMOS = [
  { name: "Abdurrahman Çelik Exclusive Salon", slug: "abdurrahman", tag: "Gerçek müşterimiz · Darıca, Kocaeli" },
  { name: "Makas Demo Salon",                  slug: "demo",        tag: "Sistemi inceleyin — örnek salon" },
];

// Fallback testimonials — shown when the Google Places API is unavailable or returns no results.
// All real review data comes from /api/reviews (Google Places proxy).
export const testimonials = [
  {
    id: 1,
    name: "Ahmet Yıldız",
    role: { tr: "Kreatif Direktör", en: "Creative Director" },
    text: {
      tr: "Abdurrahman usta görünüşümü tamamen dönüştürdü. Detaylara gösterilen özen eşsiz — her çizgi mükemmel. Tek güvendiğim yer.",
      en: "Abdurrahman transformed my look entirely. The attention to detail is unmatched — every line is perfect. The only place I trust.",
    },
    rating: 5,
    avatar: "AY",
  },
  {
    id: 2,
    name: "Mert Çelik",
    role: { tr: "Finans Direktörü", en: "Finance Director" },
    text: {
      tr: "Usta Tıraş deneyimi inanılmaz. Sıcak havlular, düz jilet, premium yağlar. Bir ritual gibi, sadece tıraş değil.",
      en: "The Royal Shave experience is transcendent. Hot towels, straight razor, premium oils. Feels like a ritual, not just a grooming session.",
    },
    rating: 5,
    avatar: "MÇ",
  },
  {
    id: 3,
    name: "Burak Öztürk",
    role: { tr: "Mimar", en: "Architect" },
    text: {
      tr: "Egemen'in fade işçiliği cerrahi hassasiyette. Traş için geldim, yeni bir kimlikle ayrıldım. İlk ziyaretimden beri her ay randevu alıyorum.",
      en: "Egemen's fade work is surgical. Came for a trim, left with a completely new identity. Booked monthly since my first visit.",
    },
    rating: 5,
    avatar: "BÖ",
  },
  {
    id: 4,
    name: "Can Polat",
    role: { tr: "Marka Stratejisti", en: "Brand Strategist" },
    text: {
      tr: "VIP Bakım paketi her kuruşa değer. İçeri girdiğiniz andan kral gibi karşılanıyorsunuz. Her önemli toplantı öncesi ilk tercihim.",
      en: "The VIP Grooming package is worth every penny. You're treated like a king from the moment you walk in. My go-to before every important meeting.",
    },
    rating: 5,
    avatar: "CP",
  },
];

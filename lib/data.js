export const services = [
  {
    id: "classic-cut",
    name: { tr: "Klasik Kesim", en: "Classic Cut" },
    description: {
      tr: "Makas ile hassas kesim, sıcak havlu bitişi ve şekillendirme.",
      en: "Precision scissor cut with hot towel finish and styling.",
    },
    duration: 45,
    price: 650,
    icon: "✂",
    category: "cuts",
  },
  {
    id: "fade-cut",
    name: { tr: "Soluk & Kıvrım", en: "Fade & Taper" },
    description: {
      tr: "Düşük, orta veya yüksek soluk, kusursuz kıvrım ve çizgi düzenleme.",
      en: "Low, mid or high fade with seamless taper and line-up.",
    },
    duration: 45,
    price: 750,
    icon: "⚡",
    category: "cuts",
  },
  {
    id: "beard-trim",
    name: { tr: "Sakal Şekillendirme", en: "Beard Sculpt" },
    description: {
      tr: "Sıcak köpük tıraşı, düz jilet ile şekillendirme ve sakal yağı bakımı.",
      en: "Hot-lather straight razor shaping with beard oil treatment.",
    },
    duration: 30,
    price: 450,
    icon: "◈",
    category: "beard",
  },
  {
    id: "royal-shave",
    name: { tr: "Usta Tıraşı", en: "Royal Shave" },
    description: {
      tr: "Sıcak havlu ritüeli ile geleneksel düz jilet tıraşı.",
      en: "Traditional straight razor shave with hot towel ritual.",
    },
    duration: 45,
    price: 550,
    icon: "♦",
    category: "beard",
  },
  {
    id: "cut-beard",
    name: { tr: "Kesim & Sakal", en: "Cut & Beard" },
    description: {
      tr: "Komple hizmet: saç kesimi + sakal şekillendirme + sıcak havlu bakımı.",
      en: "Full service: haircut + beard sculpt + hot towel treatment.",
    },
    duration: 75,
    price: 1050,
    icon: "◉",
    category: "combo",
    popular: true,
  },
  {
    id: "vip-grooming",
    name: { tr: "VIP Bakım", en: "VIP Grooming" },
    description: {
      tr: "Kafa derisi masajı ve yüz bakımı ile eksiksiz premium paket.",
      en: "Complete premium package with scalp massage and facial.",
    },
    duration: 120,
    price: 1650,
    icon: "★",
    category: "premium",
    popular: true,
  },
];

export const barbers = [
  {
    id: "mehmet",
    name: "Mehmet Yılmaz",
    title: { tr: "Usta Berber", en: "Master Barber" },
    bio: {
      tr: "15 yıllık ustasıyla İstanbul ve Dubai'de mesleğini mükemmelleştirdi. Klasik ve çağdaş kesimlerde uzman.",
      en: "15 years honing his craft across Istanbul and Dubai. Specialist in classic and contemporary cuts.",
    },
    rating: 4.9,
    reviews: 312,
    specialties: {
      tr: ["Klasik Kesimler", "Soluk", "Usta Tıraşı"],
      en: ["Classic Cuts", "Fades", "Royal Shave"],
    },
    avatar: "MY",
    color: "#C41E1E",
    available: true,
    yearsExp: 15,
  },
  {
    id: "emre",
    name: "Emre Kaya",
    title: { tr: "Kıdemli Berber", en: "Senior Barber" },
    bio: {
      tr: "2022 berberlik şampiyonu. Hassas soldurma ve geometrik tasarımlardaki ustalığıyla tanınır.",
      en: "Barbering champion 2022. Known for precision fades and geometric designs.",
    },
    rating: 4.8,
    reviews: 241,
    specialties: {
      tr: ["Deri Soluk", "Sakal Sanatı", "Tasarım"],
      en: ["Skin Fades", "Beard Art", "Designs"],
    },
    avatar: "EK",
    color: "#1a1a1a",
    available: true,
    yearsExp: 8,
  },
  {
    id: "burak",
    name: "Burak Demir",
    title: { tr: "Kıdemli Berber", en: "Senior Barber" },
    bio: {
      tr: "Avrupa tekniğini modern dokunuşla harmanlayan, İtalya eğitimli usta.",
      en: "Italian-trained master who blends European technique with modern edge.",
    },
    rating: 4.9,
    reviews: 198,
    specialties: {
      tr: ["Makas İşi", "Dokulu Kesimler", "Renk"],
      en: ["Scissor Work", "Textured Cuts", "Color"],
    },
    avatar: "BD",
    color: "#2d2d2d",
    available: true,
    yearsExp: 12,
  },
  {
    id: "can",
    name: "Can Arslan",
    title: { tr: "Berber", en: "Barber" },
    bio: {
      tr: "Cesur yaratıcı bakış açısıyla parlayan genç yıldız. Her seferinde Instagram'a değer kesimler.",
      en: "Rising star with a bold creative eye. Instagram-worthy cuts every time.",
    },
    rating: 4.7,
    reviews: 87,
    specialties: {
      tr: ["Modern Kesimler", "Yaratıcı Soluk", "Şekillendirme"],
      en: ["Modern Cuts", "Creative Fades", "Styling"],
    },
    avatar: "CA",
    color: "#404040",
    available: true,
    yearsExp: 4,
  },
];

export const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30",
];

export const unavailableSlots = {
  mehmet: ["09:00", "10:30", "14:00", "16:30"],
  emre:   ["09:30", "11:00", "13:30", "17:00"],
  burak:  ["10:00", "12:00", "15:00", "18:00"],
  can:    ["09:00", "09:30", "11:30", "14:30"],
};

export const testimonials = [
  {
    id: 1,
    name: "Ahmet Yıldız",
    role: { tr: "Kreatif Direktör", en: "Creative Director" },
    text: {
      tr: "Mehmet görünüşümü tamamen dönüştürdü. Detaylara gösterilen özen eşsiz — her çizgi mükemmel. MAKAS tek güvendiğim yer.",
      en: "Mehmet transformed my look entirely. The attention to detail is unmatched — every line is perfect. MAKAS is the only place I trust.",
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
      tr: "Emre'nin fade işçiliği cerrahi hassasiyette. Traş için geldim, yeni bir kimlikle ayrıldım. İlk ziyaretimden beri her ay randevu alıyorum.",
      en: "Emre's fade work is surgical. Came for a trim, left with a completely new identity. Booked monthly since my first visit.",
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

export const adminStats = {
  totalRevenue: 184200,
  totalAppointments: 247,
  newClients: 38,
  avgRating: 4.87,
  revenueChange: 12.4,
  appointmentsChange: 8.2,
  clientsChange: 22.1,
  ratingChange: 0.3,
};

export const recentAppointments = [
  {
    id: "APT-001",
    client: "Ahmet Yıldız",
    service: "VIP Bakım",
    barber: "Mehmet Yılmaz",
    date: "2026-06-08",
    time: "10:00",
    price: 1650,
    status: "confirmed",
  },
  {
    id: "APT-002",
    client: "Mert Çelik",
    service: "Usta Tıraşı",
    barber: "Burak Demir",
    date: "2026-06-08",
    time: "11:30",
    price: 550,
    status: "confirmed",
  },
  {
    id: "APT-003",
    client: "Burak Öztürk",
    service: "Soluk & Kıvrım",
    barber: "Emre Kaya",
    date: "2026-06-08",
    time: "13:00",
    price: 750,
    status: "in-progress",
  },
  {
    id: "APT-004",
    client: "Can Polat",
    service: "Kesim & Sakal",
    barber: "Can Arslan",
    date: "2026-06-08",
    time: "14:30",
    price: 1050,
    status: "pending",
  },
  {
    id: "APT-005",
    client: "Kemal Arslan",
    service: "Klasik Kesim",
    barber: "Mehmet Yılmaz",
    date: "2026-06-08",
    time: "15:00",
    price: 650,
    status: "pending",
  },
  {
    id: "APT-006",
    client: "Serkan Demir",
    service: "Sakal Şekillendirme",
    barber: "Emre Kaya",
    date: "2026-06-07",
    time: "09:00",
    price: 450,
    status: "completed",
  },
  {
    id: "APT-007",
    client: "Tolga Kaya",
    service: "Klasik Kesim",
    barber: "Burak Demir",
    date: "2026-06-07",
    time: "10:30",
    price: 650,
    status: "completed",
  },
  {
    id: "APT-008",
    client: "Yusuf Şahin",
    service: "VIP Bakım",
    barber: "Mehmet Yılmaz",
    date: "2026-06-07",
    time: "12:00",
    price: 1650,
    status: "completed",
  },
  {
    id: "APT-009",
    client: "Hasan Güzel",
    service: "Soluk & Kıvrım",
    barber: "Can Arslan",
    date: "2026-06-09",
    time: "09:30",
    price: 750,
    status: "confirmed",
  },
  {
    id: "APT-010",
    client: "İbrahim Aktaş",
    service: "Kesim & Sakal",
    barber: "Mehmet Yılmaz",
    date: "2026-06-09",
    time: "11:00",
    price: 1050,
    status: "confirmed",
  },
];

export const weeklyRevenue = [
  { day: "Pzt", revenue: 21000 },
  { day: "Sal", revenue: 26500 },
  { day: "Çar", revenue: 19800 },
  { day: "Per", revenue: 32000 },
  { day: "Cum", revenue: 38500 },
  { day: "Cmt", revenue: 42000 },
  { day: "Paz", revenue: 4400  },
];

// 30-day daily revenue for area chart
export const monthlyRevenue = [
  { date: "10 May", value: 8200  },
  { date: "11 May", value: 0     },
  { date: "12 May", value: 13400 },
  { date: "13 May", value: 17800 },
  { date: "14 May", value: 21000 },
  { date: "15 May", value: 24800 },
  { date: "16 May", value: 29500 },
  { date: "17 May", value: 8900  },
  { date: "18 May", value: 0     },
  { date: "19 May", value: 16500 },
  { date: "20 May", value: 14200 },
  { date: "21 May", value: 22000 },
  { date: "22 May", value: 27800 },
  { date: "23 May", value: 31000 },
  { date: "24 May", value: 9600  },
  { date: "25 May", value: 0     },
  { date: "26 May", value: 18900 },
  { date: "27 May", value: 23400 },
  { date: "28 May", value: 17200 },
  { date: "29 May", value: 25600 },
  { date: "30 May", value: 32400 },
  { date: "31 May", value: 36800 },
  { date: "1 Haz",  value: 10200 },
  { date: "2 Haz",  value: 0     },
  { date: "3 Haz",  value: 21000 },
  { date: "4 Haz",  value: 26500 },
  { date: "5 Haz",  value: 19800 },
  { date: "6 Haz",  value: 32000 },
  { date: "7 Haz",  value: 38500 },
  { date: "8 Haz",  value: 42000 },
];

// Sparkline data per KPI (last 8 data points)
export const kpiSparklines = {
  revenue:      [142000, 158000, 139000, 162000, 151000, 174000, 168000, 184200],
  appointments: [198, 212, 204, 228, 219, 235, 241, 247],
  clients:      [18, 22, 19, 28, 24, 31, 35, 38],
  rating:       [4.81, 4.83, 4.80, 4.84, 4.85, 4.86, 4.88, 4.87],
};

// Appointment dates for calendar dots
export const appointmentDates = {
  "2026-06-02": 3,
  "2026-06-03": 5,
  "2026-06-04": 4,
  "2026-06-05": 6,
  "2026-06-06": 7,
  "2026-06-08": 5,
  "2026-06-09": 4,
  "2026-06-10": 6,
  "2026-06-11": 3,
  "2026-06-12": 5,
  "2026-06-13": 7,
  "2026-06-15": 4,
  "2026-06-16": 6,
  "2026-06-17": 5,
  "2026-06-18": 3,
  "2026-06-19": 7,
  "2026-06-20": 8,
};

export const clients = [
  { id: "c001", name: "Ahmet Yıldız",   phone: "0532 111 2233", visits: 14, totalSpent: 16800, noShows: 0, lastVisit: "2026-06-08" },
  { id: "c002", name: "Mert Çelik",     phone: "0533 222 3344", visits: 8,  totalSpent: 7200,  noShows: 1, lastVisit: "2026-06-08" },
  { id: "c003", name: "Burak Öztürk",   phone: "0535 333 4455", visits: 11, totalSpent: 9900,  noShows: 0, lastVisit: "2026-06-08" },
  { id: "c004", name: "Can Polat",      phone: "0536 444 5566", visits: 6,  totalSpent: 8400,  noShows: 0, lastVisit: "2026-06-08" },
  { id: "c005", name: "Kemal Arslan",   phone: "0537 555 6677", visits: 4,  totalSpent: 3200,  noShows: 2, lastVisit: "2026-06-08" },
  { id: "c006", name: "Serkan Demir",   phone: "0538 666 7788", visits: 19, totalSpent: 12350, noShows: 1, lastVisit: "2026-06-07" },
  { id: "c007", name: "Tolga Kaya",     phone: "0539 777 8899", visits: 7,  totalSpent: 5950,  noShows: 0, lastVisit: "2026-06-07" },
  { id: "c008", name: "Yusuf Şahin",    phone: "0541 888 9900", visits: 22, totalSpent: 28600, noShows: 0, lastVisit: "2026-06-07" },
  { id: "c009", name: "Hasan Güzel",    phone: "0542 999 0011", visits: 3,  totalSpent: 2850,  noShows: 1, lastVisit: "2026-06-09" },
  { id: "c010", name: "İbrahim Aktaş",  phone: "0543 100 1122", visits: 9,  totalSpent: 7350,  noShows: 0, lastVisit: "2026-06-09" },
];

// Working hours per barber: [startHour, endHour] in 24h format
export const workingHours = {
  mehmet: { start: 9,  end: 18, daysOff: [0] },      // Sun off
  emre:   { start: 12, end: 22, daysOff: [0, 1] },   // Sun + Mon off
  burak:  { start: 9,  end: 18, daysOff: [0] },
  can:    { start: 10, end: 20, daysOff: [0] },
};

// Breaks per barber: { barberId: [{ start: "HH:MM", end: "HH:MM", label }] }
export const breaks = {
  mehmet: [{ start: "13:00", end: "13:30", label: "Öğle Arası" }],
  emre:   [{ start: "17:00", end: "17:30", label: "Öğle Arası" }],
  burak:  [{ start: "13:00", end: "13:30", label: "Öğle Arası" }],
  can:    [{ start: "14:00", end: "14:30", label: "Öğle Arası" }],
};

// Barber performance stats
export const barberPerformance = [
  { name: "Mehmet Yılmaz", avatar: "MY", revenue: 78400, appointments: 68, share: 0.43 },
  { name: "Burak Demir",   avatar: "BD", revenue: 49200, appointments: 52, share: 0.27 },
  { name: "Emre Kaya",     avatar: "EK", revenue: 36800, appointments: 48, share: 0.20 },
  { name: "Can Arslan",    avatar: "CA", revenue: 19800, appointments: 38, share: 0.11 },
];

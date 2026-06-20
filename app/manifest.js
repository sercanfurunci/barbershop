export default function manifest() {
  return {
    name: "MAKAS — Berber Randevu Sistemi",
    short_name: "MAKAS",
    description: "Berberlere özel online randevu ve salon yönetim platformu.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F4EE",
    theme_color: "#111111",
    lang: "tr-TR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

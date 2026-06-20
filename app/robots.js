export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/superadmin", "/api", "/barber"] },
    ],
    sitemap: "https://makas.furunci.tech/sitemap.xml",
    host: "https://makas.furunci.tech",
  };
}

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppointmentsProvider } from "@/contexts/AppointmentsContext";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: { default: "MAKAS — Berber Randevu Sistemi", template: "%s | MAKAS" },
  description: "Berberlere özel online randevu ve salon yönetim platformu. Müşteri kaybetme, randevuları otomatikleştir.",
  metadataBase: new URL("https://makas.furunci.tech"),
  applicationName: "MAKAS",
  keywords: [
    "berber randevu sistemi", "online randevu", "berber yazılımı",
    "kuaför randevu", "salon yönetimi", "berber paneli", "MAKAS",
  ],
  authors: [{ name: "MAKAS" }],
  creator: "MAKAS",
  publisher: "MAKAS",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    siteName: "MAKAS",
    locale: "tr_TR",
    type: "website",
    title: "MAKAS — Berber Randevu Sistemi",
    description: "Berberlere özel online randevu ve salon yönetim platformu. Müşteri kaybetme, randevuları otomatikleştir.",
    url: "https://makas.furunci.tech",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAKAS — Berber Randevu Sistemi",
    description: "Berberlere özel online randevu ve salon yönetim platformu.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EE" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

// ponytail: Organization JSON-LD. One blob, rich-result eligible.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MAKAS",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://makas.furunci.tech",
  description: "Berberlere özel online randevu ve salon yönetim platformu.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <AppointmentsProvider>
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#161616',
                    border: '1px solid #242424',
                    color: '#F8F6F1',
                  },
                }}
              />
            </AppointmentsProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

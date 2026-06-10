import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppointmentsProvider } from "@/contexts/AppointmentsContext";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "Abdurrahman Çelik Exclusive Salon — Premium Berber",
  description: "Darıca'nın en seçkin berberi. Premium saç & sakal bakımı. Online randevu alın, bekleme yok.",
  openGraph: {
    title: "Abdurrahman Çelik Exclusive Salon",
    description: "Darıca'nın en seçkin berberi. Premium saç & sakal bakımı. Online randevu alın, bekleme yok.",
    siteName: "Abdurrahman Çelik Exclusive Salon",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abdurrahman Çelik Exclusive Salon",
    description: "Darıca'nın en seçkin berberi. Online randevu alın.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className="h-full antialiased">
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

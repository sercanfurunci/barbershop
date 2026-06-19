import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppointmentsProvider } from "@/contexts/AppointmentsContext";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: { default: "MAKAS — Premium Berber", template: "%s | MAKAS" },
  description: "Online randevu sistemi ile premium saç & sakal bakımı.",
  openGraph: {
    siteName: "MAKAS",
    locale: "tr_TR",
    type: "website",
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

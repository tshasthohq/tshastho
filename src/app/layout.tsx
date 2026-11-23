import { cookies } from "next/headers";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import type { Metadata, Viewport } from "next";
import { Inter, Hind_Siliguri, Noto_Sans_Arabic } from "next/font/google";
import MobileBottomNav from "@/components/MobileBottomNav";
import Script from "next/script";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";
import { BranchProvider } from "@/context/BranchContext";
import PWAInstallPrompt from "@/components/pwa/InstallPrompt";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-bn",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-ar",
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

// Tshastho PWA metadata
export const metadata: Metadata = {
  title: {
    default: "Tshastho - Health & Pharmacy Platform",
    template: "%s - Tshastho",
  },
  description: "Book verified doctors, order medicines and find hospitals, diagnostics and ambulances across Bangladesh.",
  applicationName: "Tshastho",
  metadataBase: new URL("https://tshastho.com"),
  openGraph: {
    title: "Tshastho - Connected Healthcare. Trusted Care.",
    description: "Book verified doctors, order medicines and find hospitals, diagnostics and ambulances across Bangladesh.",
    siteName: "Tshastho",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tshastho",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLocale = (await cookies()).get("tshastho_lang")?.value;
  return (
    <html lang={initialLocale || "en"} dir={initialLocale === "ar" || initialLocale === "ur" ? "rtl" : "ltr"} className={`${inter.variable} ${hindSiliguri.variable} ${notoArabic.variable} h-full`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body className="font-sans antialiased h-full bg-slate-50 text-slate-900">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <BranchProvider><LanguageProvider initialLocale={initialLocale}>{children}<MobileBottomNav />
          <PWAInstallPrompt /></LanguageProvider></BranchProvider>
        </GoogleOAuthProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Tshastho",
                url: "https://tshastho.com",
                logo: "https://tshastho.com/logo.png",
                description: "Connected healthcare platform for Bangladesh: doctors, medicines, hospitals and diagnostics.",
                areaServed: "BD",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Tshastho",
                url: "https://tshastho.com",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://tshastho.com/doctors?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        
      </body>
    </html>
  );
}

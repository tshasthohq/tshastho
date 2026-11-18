import { cookies } from "next/headers";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";
import { BranchProvider } from "@/context/BranchContext";
import PWAInstallPrompt from "@/components/pwa/InstallPrompt";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Tshastho PWA metadata
export const metadata: Metadata = {
  title: {
    default: "Tshastho - Health & Pharmacy Platform",
    template: "%s - Tshastho",
  },
  description: "Bangladesh's health-tech SaaS – pharmacy, doctor, patient management",
  applicationName: "Tshastho",
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
  openGraph: {
    title: "Tshastho",
    description: "Health & Pharmacy Platform for Bangladesh",
    type: "website",
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
    <html lang={initialLocale || "en"} dir={initialLocale === "ar" || initialLocale === "ur" ? "rtl" : "ltr"} className={`${inter.variable} h-full`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body className="font-sans antialiased h-full bg-slate-50 text-slate-900">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <BranchProvider><LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider></BranchProvider>
        </GoogleOAuthProvider>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}

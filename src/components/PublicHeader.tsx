"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function PublicHeader() {
  const { user } = useAuth();
  const { t } = useLanguage();
  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 h-16">
        <Link href="/" className="shrink min-w-0">
          <img src="/logo.png" alt="Tshastho" className="h-8 md:h-10 w-auto object-contain" />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link href="/doctors" className="hover:text-blue-600 transition-colors whitespace-nowrap">{t("w.Find Doctors")}</Link>
          <Link href="/hospitals" className="hidden md:inline hover:text-blue-600 transition-colors whitespace-nowrap">Hospitals</Link>
          <Link href="/medicines" className="hover:text-blue-600 transition-colors whitespace-nowrap">{t("w.Pharmacy")}</Link>
          <Link href="/blood-bank" className="hidden md:inline hover:text-blue-600 transition-colors whitespace-nowrap">{t("w.Blood Bank")}</Link>
          <Link href="/diagnostics" className="hover:text-blue-600 transition-colors whitespace-nowrap">{t("w.Diagnostics")}</Link>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <LanguageSwitcher />
          {user ? (
            <Link href="/dashboard" className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-500/30">
              {t("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap px-2">
                {t("nav.login")}
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors">
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

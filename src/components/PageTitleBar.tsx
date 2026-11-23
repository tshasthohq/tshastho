"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function PageTitleBar({
  title, count, fallback = "/",
}: { title: string; count?: number; fallback?: string }) {
  const router = useRouter();
  const { t, dir } = useLanguage();
  const rtl = dir === "rtl" ? "rotate-180" : "";

  const goBack = () => {
    try {
      if (window.history.length > 1 && (!document.referrer || document.referrer.startsWith(window.location.origin))) {
        router.back();
        return;
      }
    } catch {}
    router.push(fallback);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
      <nav aria-label="breadcrumb" className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 mb-2">
        <Link href="/" className="hover:text-blue-600">{t("nav.home")}</Link>
        <ChevronRight size={14} className={rtl} />
        <span className="font-semibold text-slate-800">{title}</span>
      </nav>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("nav.back")}
          className="md:hidden h-11 w-11 -ms-2 rounded-full flex items-center justify-center text-slate-700 active:bg-slate-100"
        >
          <ArrowLeft size={22} className={rtl} />
        </button>
        <h1 className="text-xl md:text-3xl font-black text-slate-900">{title}</h1>
        {typeof count === "number" && (
          <span className="ms-1 text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{count}</span>
        )}
      </div>
    </div>
  );
}

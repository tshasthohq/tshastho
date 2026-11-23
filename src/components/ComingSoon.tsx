"use client";
import Link from "next/link";
import { Construction } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PageTitleBar from "@/components/PageTitleBar";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ComingSoon({ label }: { label: string }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen pb-16" style={{ background: "linear-gradient(180deg,#dbeafe 0%,#eff6ff 38%,#f8fafc 100%)" }}>
      <PublicHeader />
      <PageTitleBar title={t("w." + label, label)} />
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] px-6 py-10 text-center">
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-white shadow-lg"
            style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 45%,#06b6d4 100%)" }}
          >
            <Construction size={42} />
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-sm font-bold text-blue-700 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
            </span>
            {t("w." + label, label)}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mb-3">{t("soon.title")}</h1>
          <p className="text-base text-slate-500 leading-relaxed mb-8">{t("soon.text")}</p>
          <div className="flex flex-col gap-3">
            <Link href="/doctors" className="h-12 flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-base font-bold shadow-lg shadow-blue-500/25">
              {t("w.Find Doctors")}
            </Link>
            <Link href="/medicines" className="h-12 flex items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 text-base font-bold">
              {t("w.Pharmacy")}
            </Link>
            <Link href="/" className="h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-700 text-base font-bold">
              {t("soon.home")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

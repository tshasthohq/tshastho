"use client";
import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { LOCALES } from "@/i18n/dictionaries";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t("nav.language")}
        onClick={() => setOpen(!open)}
        className="h-9 w-9 md:w-auto md:px-3 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5 text-sm font-bold"
      >
        <Globe size={18} />
        <span className="hidden md:inline uppercase">{locale}</span>
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-2 w-48 max-h-80 overflow-auto bg-white rounded-2xl border border-slate-100 shadow-xl p-1.5 z-50">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLocale(l.code); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-start ${
                l.code === locale ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{l.name}</span>
              {l.code === locale && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

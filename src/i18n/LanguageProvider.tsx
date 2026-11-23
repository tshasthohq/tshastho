"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALES, dictionaries } from "./dictionaries";

const Ctx = createContext<any>({ locale: "en", dir: "ltr", setLocale: () => {}, t: (k: string, f?: string) => f ?? k });
const ok = (l?: string | null) => !!l && LOCALES.some((x) => x.code === l);

export function LanguageProvider({ initialLocale, children }: { initialLocale?: string; children: React.ReactNode }) {
  const [locale, setL] = useState<string>(ok(initialLocale) ? initialLocale! : DEFAULT_LOCALE);
  const dir = LOCALES.find((x) => x.code === locale)?.dir || "ltr";

  useEffect(() => {
    if (ok(initialLocale)) return;
    try {
      const s = localStorage.getItem("tshastho_lang");
      const n = (navigator.language || "en").slice(0, 2).toLowerCase();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const p = ok(s) ? s! : tz === "Asia/Dhaka" ? "bn" : ok(n) ? n : DEFAULT_LOCALE;
      if (p !== locale) setL(p);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((l: string) => {
    if (!ok(l)) return;
    setL(l);
    try {
      localStorage.setItem("tshastho_lang", l);
      document.cookie = `tshastho_lang=${l}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  }, []);

  const t = useCallback(
    (k: string, f?: string) => dictionaries[locale]?.[k] ?? dictionaries.en[k] ?? f ?? k,
    [locale]
  );
  return <Ctx.Provider value={{ locale, dir, setLocale, t }}>{children}</Ctx.Provider>;
}
export const useLanguage = () => useContext(Ctx);

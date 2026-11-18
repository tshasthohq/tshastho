import en from "./lang/en";
import bn from "./lang/bn";
import hi from "./lang/hi";
import ar from "./lang/ar";
import ur from "./lang/ur";
import ms from "./lang/ms";

export const DEFAULT_LOCALE = "en";

export const LOCALES: { code: string; name: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "bn", name: "বাংলা", dir: "ltr" },
  { code: "hi", name: "हिन्दी", dir: "ltr" },
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "ur", name: "اردو", dir: "rtl" },
  { code: "ms", name: "Bahasa Melayu", dir: "ltr" },
];

export const dictionaries: Record<string, Record<string, string>> = { en, bn, hi, ar, ur, ms };

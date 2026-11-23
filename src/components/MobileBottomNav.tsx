"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Stethoscope, Pill, ClipboardList, User } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

const SHOW = ["/", "/doctors", "/medicines", "/diagnostics", "/hospitals", "/blood-bank", "/ambulance", "/about", "/contact"];

export default function MobileBottomNav() {
  const path = usePathname() || "/";
  const { t } = useLanguage();
  if (!SHOW.includes(path)) return null;

  const items = [
    { href: "/", label: t("nav.home"), Icon: Home },
    { href: "/doctors", label: t("w.Doctors"), Icon: Stethoscope },
    { href: "/medicines", label: t("w.Pharmacy"), Icon: Pill },
    { href: "/dashboard/orders", label: t("nav.orders"), Icon: ClipboardList },
    { href: "/dashboard", label: t("nav.profile"), Icon: User },
  ];

  return (
    <>
      <div className="h-16 md:hidden" aria-hidden />
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/90 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {items.map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold ${
                  active ? "text-blue-600" : "text-slate-500"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                <span className="truncate max-w-full px-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

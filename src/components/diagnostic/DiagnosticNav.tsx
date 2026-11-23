"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, TestTube, LogOut, ClipboardPlus, Receipt, Stethoscope, FlaskConical, BadgeCheck, Palette } from "lucide-react";

const NAV = [
  { href: "/diagnostic", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/diagnostic/reception", icon: ClipboardPlus, label: "Reception" },
  { href: "/diagnostic/orders", icon: Receipt, label: "Orders" },
  { href: "/diagnostic/lab", icon: FlaskConical, label: "Lab" },
  { href: "/diagnostic/referrers", icon: Stethoscope, label: "Doctors & Agents" },
  { href: "/diagnostic/tests", icon: TestTube, label: "Tests" },
  { href: "/diagnostic/signers", icon: BadgeCheck, label: "Signatories" },
  { href: "/diagnostic/settings", icon: Palette, label: "Branding" },
  { href: "/diagnostic/letterhead", icon: Palette, label: "Letterhead" },
];

export default function DiagnosticNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const logout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <div className="print:hidden sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/diagnostic" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Tshastho" width={120} height={30} className="object-contain" priority />
          <span className="hidden rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white sm:inline-block">
            Diagnostic
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-semibold text-slate-600 sm:block">{user?.name}</span>
          <button onClick={logout} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:text-red-500">
            <LogOut size={15} />
          </button>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-4 pb-3">
        {NAV.map((n) => {
          const active = n.href === "/diagnostic" ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <n.icon size={15} /> {n.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

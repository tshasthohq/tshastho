"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, FileText, Stethoscope, Briefcase,
  Building2, Wallet, Banknote, Share2, User, Bell, Video, MessageSquare,
  Clipboard, Award, UserPlus, Star
} from "lucide-react";

const NAV = [
  { href: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/doctor/appointments", icon: Calendar, label: "Appointments" },
  { href: "/doctor/telemedicine", icon: Video, label: "Telemedicine" },
  { href: "/doctor/chat", icon: MessageSquare, label: "Messages" },
  { href: "/doctor/local-practice", icon: Briefcase, label: "Local" },
  { href: "/doctor/local-patients", icon: Users, label: "Patients" },
  { href: "/doctor/local-rx/new", icon: FileText, label: "New Rx" },
  { href: "/doctor/prescriptions", icon: Stethoscope, label: "Online Rx" },
  { href: "/doctor/prescription-templates", icon: Clipboard, label: "Templates" },
  { href: "/doctor/referrals", icon: UserPlus, label: "Referrals" },
  { href: "/doctor/certificates", icon: Award, label: "Certificates" },
  { href: "/doctor/follow-ups", icon: Bell, label: "Follow-ups" },
  { href: "/doctor/chambers", icon: Building2, label: "Chambers" },
  { href: "/doctor/schedule", icon: Calendar, label: "Schedule" },
  { href: "/doctor/staff", icon: Users, label: "Staff" },
  { href: "/doctor/walk-in-earnings", icon: Wallet, label: "Walk-in $" },
  { href: "/doctor/earnings", icon: Banknote, label: "Earnings" },
  { href: "/doctor/payouts", icon: Banknote, label: "Payouts" },
  { href: "/doctor/referral", icon: Share2, label: "My Code" },
  { href: "/doctor/profile", icon: User, label: "Profile" },
];

export default function DoctorNav() {
  const pathname = usePathname();
  return (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-30 overflow-x-auto">
      <div className="flex gap-1 px-3 py-2 min-w-max">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/doctor" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}>
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

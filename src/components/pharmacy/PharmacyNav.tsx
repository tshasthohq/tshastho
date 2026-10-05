"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Pill, Package, History, Truck, ShoppingCart,
  Users, UserCog, ClipboardList, DollarSign, Bell, Wallet, FileText, RotateCcw, Building2, ArrowLeftRight, Shield, AlertTriangle, Repeat, FileSpreadsheet, ShieldAlert, Trash2, BookOpen
} from "lucide-react";

const NAV = [
  { href: "/pharmacy", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pharmacy/medicines", icon: Pill, label: "Medicines" },
  { href: "/pharmacy/medicines/bulk", icon: FileSpreadsheet, label: "Bulk" },
  { href: "/pharmacy/batches", icon: Package, label: "Batches" },
  { href: "/pharmacy/stock-alerts", icon: AlertTriangle, label: "Low Stock" },
  { href: "/pharmacy/refill-reminders", icon: Repeat, label: "Refills" },
  { href: "/pharmacy/narcotic-register", icon: ShieldAlert, Trash2, label: "Narcotic" },
  { href: "/pharmacy/expiry-write-off", icon: Trash2, label: "Expiry" },
  { href: "/pharmacy/credit-ledger", icon: BookOpen, label: "Credit" },
  { href: "/pharmacy/payroll", icon: Wallet, label: "Payroll" },
  { href: "/pharmacy/stock-movements", icon: History, label: "Stock" },
  { href: "/pharmacy/suppliers", icon: Truck, label: "Suppliers" },
  { href: "/pharmacy/purchases", icon: ShoppingCart, label: "Purchases" },
  { href: "/pharmacy/pos", icon: ShoppingCart, label: "POS" },
  { href: "/pharmacy/pos/sales", icon: History, label: "POS Sales" },
  { href: "/pharmacy/orders", icon: ClipboardList, label: "Orders" },
  { href: "/pharmacy/customers", icon: Users, label: "Customers" },
  { href: "/pharmacy/staff", icon: UserCog, label: "Staff" },
  { href: "/pharmacy/dues", icon: DollarSign, label: "Dues" },
  { href: "/pharmacy/finance", icon: Wallet, label: "Finance" },
  { href: "/pharmacy/prescriptions", icon: FileText, label: "Rx Verify" },
  { href: "/pharmacy/returns", icon: RotateCcw, label: "Returns" },
  { href: "/pharmacy/branches", icon: Building2, label: "Branches" },
  { href: "/pharmacy/transfers", icon: ArrowLeftRight, label: "Transfers" },
  { href: "/pharmacy/dgda", icon: Shield, label: "DGDA" },
  { href: "/pharmacy/notifications", icon: Bell, label: "Notifications" },
];

export default function PharmacyNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-30 overflow-x-auto">
      <div className="flex gap-1 px-3 py-2 min-w-max">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/pharmacy" && pathname.startsWith(item.href));
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

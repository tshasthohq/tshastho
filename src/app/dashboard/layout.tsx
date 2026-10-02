"use client";
import { Home, User, Calendar, FileText, Bell, LogOut, ShoppingBag, DollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [initial, setInitial] = useState("U");

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  useEffect(() => {
    const userName = localStorage.getItem("userName") || "U";
    setInitial(userName.charAt(0).toUpperCase());

    const checkNotifications = () => {
      const email = localStorage.getItem("userEmail");
      if (!email) return;

      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.unreadCount !== undefined) {
          setUnread(data.unreadCount);
          const lastCount = parseInt(localStorage.getItem("lastNotifCount") || "0");
          if (data.unreadCount > lastCount && data.notifications?.[0]) {
            const latest = data.notifications[0];
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(latest.title, { body: latest.message, icon: "/favicon.ico" });
            }
          }
          localStorage.setItem("lastNotifCount", data.unreadCount.toString());
        }
      })
      .catch(() => {});
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/dashboard/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/dashboard/dues", icon: DollarSign, label: "Dues" },
    { href: "/dashboard/appointments", icon: Calendar, label: "Appointments" },
    { href: "/dashboard/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link href="/" className="text-2xl font-bold text-blue-600">Tshastho</Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                <Icon size={20} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="text-slate-800 font-medium">Patient Dashboard</div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/notifications" className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center relative">
              <Bell size={20} className="text-slate-500" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link href="/dashboard/profile" className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm hover:bg-blue-200 transition">
              {initial}
            </Link>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          {children}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 text-[10px] transition ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ShoppingCart, Info, Check } from "lucide-react";

export default function StaffNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    const email = localStorage.getItem("userEmail");
    if (!email) { setLoading(false); return; }

    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.notifications) setNotifications(data.notifications);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  const markAllRead = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) return;
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    localStorage.setItem("lastNotifCount", "0");
  };

  useEffect(() => {
    loadNotifications();
    const timer = setTimeout(() => markAllRead(), 1000);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (d: string) => {
    const date = new Date(d);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Bell size={24} /> Notifications
        </h1>

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500">
            <Bell size={48} className="mx-auto text-slate-300 mb-4" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const Icon = notif.type === "new" ? ShoppingCart : Info;
              const color = notif.type === "new" ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600";
              return (
                <div key={notif.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-3">
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm">{notif.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatTime(notif.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Bell, CheckCircle, XCircle, Calendar, FileText, Info, Check, ShoppingBag } from "lucide-react";

export default function PatientNotificationsPage() {
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
    // Reset badge counter in localStorage
    localStorage.setItem("lastNotifCount", "0");
  };

  useEffect(() => {
    loadNotifications();
    // Auto-mark as read after 1 second
    const timer = setTimeout(() => {
      markAllRead();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = (type: string) => {
    if (type === "confirmed" || type === "accepted") return { Icon: CheckCircle, color: "bg-green-100 text-green-600" };
    if (type === "rejected") return { Icon: XCircle, color: "bg-red-100 text-red-600" };
    if (type === "completed" || type === "delivered") return { Icon: Check, color: "bg-blue-100 text-blue-600" };
    if (type === "pending" || type === "new") return { Icon: Calendar, color: "bg-yellow-100 text-yellow-600" };
    if (type === "out_for_delivery") return { Icon: ShoppingBag, color: "bg-purple-100 text-purple-600" };
    return { Icon: Info, color: "bg-slate-100 text-slate-600" };
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bell size={24} /> Notifications
        </h1>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center text-slate-500">
          <Bell size={48} className="mx-auto text-slate-300 mb-4" />
          <p>No notifications yet</p>
          <p className="text-xs text-slate-400 mt-2">You will see updates here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const { Icon, color } = getIcon(notif.type);
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
  );
}

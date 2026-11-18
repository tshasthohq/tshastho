"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCircle, XCircle, Calendar, Info, Check, ShoppingBag, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const getIcon = (type: string) => {
  if (type === "confirmed" || type === "accepted") return { Icon: CheckCircle, color: "bg-emerald-100 text-emerald-600", bar: "bg-emerald-500" };
  if (type === "rejected") return { Icon: XCircle, color: "bg-red-100 text-red-600", bar: "bg-red-500" };
  if (type === "completed" || type === "delivered") return { Icon: Check, color: "bg-blue-100 text-blue-600", bar: "bg-blue-500" };
  if (type === "pending" || type === "new") return { Icon: Calendar, color: "bg-amber-100 text-amber-600", bar: "bg-amber-500" };
  if (type === "out_for_delivery") return { Icon: ShoppingBag, color: "bg-purple-100 text-purple-600", bar: "bg-purple-500" };
  return { Icon: Info, color: "bg-slate-100 text-slate-600", bar: "bg-slate-400" };
};

// title theke shuru-r emoji soriye clean title
const cleanTitle = (t: string) =>
  (t || "").replace(/^[^\p{L}\p{N}]+/u, "").trim() || t;

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date}, ${time}`;
};

export default function PatientNotificationsPage() {
  const router = useRouter();
  // sound layout-e bajche, ekhane off, jate duibar na baje
  const { notifications, unread, loading, markRead, markAllRead } = useNotifications({ sound: false });
  const push = usePushNotifications();

  const open = (n: any) => {
    if (!n.isRead) markRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Notifications
              {unread > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{unread}</span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {push.supported && !push.subscribed && push.permission !== "denied" && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-white border border-blue-200 rounded-2xl p-4 shadow-sm">
          <div>
            <p className="text-sm font-bold text-slate-800">Enable push notifications</p>
            <p className="text-xs text-slate-500">App bondho thakleo notification pabেn</p>
          </div>
          <button onClick={push.enable} disabled={push.busy} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50">
            {push.busy ? "..." : "Enable"}
          </button>
        </div>
      )}
      {push.supported && push.permission === "denied" && (
        <p className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Browser-e notification block kora ache. Site settings theke Allow korun.
        </p>
      )}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-3xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white py-16 px-6 rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
            <Bell size={30} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-700">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-1">You will see updates here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const { Icon, color, bar } = getIcon(n.type);
            return (
              <div
                key={n.id}
                onClick={() => open(n)}
                className={`relative overflow-hidden p-5 rounded-3xl border flex gap-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  n.isRead
                    ? "bg-white border-slate-100 shadow-sm"
                    : "bg-blue-50/60 border-blue-200 shadow-md shadow-blue-500/10"
                }`}
              >
                {!n.isRead && <span className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />}
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm text-slate-900 ${n.isRead ? "font-semibold" : "font-black"}`}>
                      {cleanTitle(n.title)}
                    </h3>
                    {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-3">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

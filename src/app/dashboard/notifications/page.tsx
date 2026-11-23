"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCircle, XCircle, Calendar, Info, Check, ShoppingBag, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLanguage } from "@/i18n/LanguageProvider";

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
  const { t: tr } = useLanguage();
  // sound layout-e bajche, ekhane off, jate duibar na baje
  const { notifications, unread, loading, markRead, markAllRead } = useNotifications({ sound: false });
  const push = usePushNotifications();

  const open = (n: any) => {
    if (!n.isRead) markRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "linear-gradient(180deg,#eaf3ff 0%,#f6f9ff 60%,#ffffff 100%)" }}>
      <div className="p-4 max-w-3xl mx-auto pb-28">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              aria-label={tr("nt.back", "Back")}
              className="p-2 bg-white/90 border border-white rounded-full shadow-sm hover:bg-slate-50 transition shrink-0"
            >
              <ArrowLeft size={20} className="text-slate-600 rtl:rotate-180" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {tr("nt.title", "Notifications")}
                {unread > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{unread}</span>
                )}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {unread > 0
                  ? tr("nt.unread", "{n} unread").replace("{n}", String(unread))
                  : tr("nt.caughtUp", "You're all caught up")}
              </p>
            </div>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition shrink-0"
            >
              <CheckCheck size={16} /> {tr("nt.markAll", "Mark all as read")}
            </button>
          )}
        </div>

        {push.supported && !push.subscribed && push.permission !== "denied" && (
          <div className="mb-4 flex items-center justify-between gap-3 bg-white/90 backdrop-blur border border-blue-200 rounded-3xl p-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{tr("nt.pushTitle", "Enable push notifications")}</p>
              <p className="text-xs text-slate-500">{tr("nt.pushSub", "Get notified even when the app is closed")}</p>
            </div>
            <button
              onClick={push.enable}
              disabled={push.busy}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-white text-sm font-bold disabled:opacity-50 shrink-0 shadow-md shadow-blue-500/25"
            >
              {push.busy ? "..." : tr("nt.enable", "Enable")}
            </button>
          </div>
        )}
        {push.supported && push.permission === "denied" && (
          <p className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-3">
            {tr("nt.blocked", "Notifications are blocked in your browser. Allow them from site settings.")}
          </p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/70 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white/90 backdrop-blur py-16 px-6 rounded-3xl border border-white shadow-[0_8px_30px_-10px_rgba(30,64,175,0.15)] text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
              <Bell size={30} className="text-slate-300" />
            </div>
            <p className="font-black text-slate-700">{tr("nt.emptyTitle", "No notifications yet")}</p>
            <p className="text-xs text-slate-400 mt-1">{tr("nt.emptySub", "You will see updates here")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any) => {
              const { Icon, color, bar } = getIcon(n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => open(n)}
                  className={`relative overflow-hidden p-4 rounded-3xl border flex gap-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    n.isRead
                      ? "bg-white/90 border-white shadow-sm"
                      : "bg-blue-50/80 border-blue-200 shadow-md shadow-blue-500/10"
                  }`}
                >
                  {!n.isRead && <span className={`absolute start-0 top-0 bottom-0 w-1 ${bar}`} />}
                  <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 dir="auto" className={`text-sm text-slate-900 ${n.isRead ? "font-semibold" : "font-black"}`}>
                        {cleanTitle(n.title)}
                      </h3>
                      {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0" />}
                    </div>
                    <p dir="auto" className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-3">{formatDateTime(n.createdAt)}</p>
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

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { MessageSquare, Stethoscope, Search } from "lucide-react";

export default function PatientChatPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/chat/threads", { credentials: "include" });
    const data = await res.json();
    setThreads(data.threads || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const filtered = threads.filter((t) =>
    !search || t.doctor?.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Messages</h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search doctors..."
          className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm" />
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <MessageSquare className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm mb-3">No conversations yet.</p>
          <Link href="/doctors" className="text-blue-600 text-sm font-medium">
            Find a doctor
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {filtered.map((t) => (
            <Link key={t.id} href={`/chat/${t.id}`}
              className="flex items-center gap-3 p-3 hover:bg-blue-50 transition">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Stethoscope className="text-blue-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="font-medium text-slate-800 truncate">Dr. {t.doctor?.user?.name}</div>
                  {t.patientUnread > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {t.patientUnread}
                    </span>
                  )}
                </div>
                <div className="text-xs text-blue-600 truncate">{t.doctor?.specialty}</div>
                {t.lastMessage ? (
                  <div className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessage}</div>
                ) : (
                  <div className="text-xs text-slate-400 italic mt-0.5">No messages yet</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

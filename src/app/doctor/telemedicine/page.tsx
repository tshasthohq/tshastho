"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Video, Phone, MessageSquare, Clock, CheckCircle, XCircle, User, Calendar } from "lucide-react";

export default function DoctorTelemedicinePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "all">("active");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/telemedicine", { credentials: "include" });
    const data = await res.json();
    setSessions(data.sessions || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const filtered = tab === "active"
    ? sessions.filter(s => ["SCHEDULED", "WAITING", "ACTIVE"].includes(s.status))
    : sessions;

  const statusColor = (s: string) => {
    switch (s) {
      case "ACTIVE": return "bg-red-100 text-red-700";
      case "WAITING": return "bg-amber-100 text-amber-700";
      case "SCHEDULED": return "bg-blue-100 text-blue-700";
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "CANCELLED": return "bg-slate-100 text-slate-700";
      case "MISSED": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const typeIcon = (t: string) => {
    if (t === "VIDEO") return Video;
    if (t === "AUDIO") return Phone;
    return MessageSquare;
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Video className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Telemedicine</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("active")}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            tab === "active" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>
          Active ({sessions.filter(s => ["SCHEDULED", "WAITING", "ACTIVE"].includes(s.status)).length})
        </button>
        <button onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            tab === "all" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>
          All ({sessions.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Video className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No telemedicine sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const Icon = typeIcon(s.type);
            return (
              <Link key={s.id} href={`/telemedicine/${s.id}`}
                className="block bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="text-blue-600" size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">
                        {s.patient?.name || "Patient"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {s.type} • {s.patient?.phone || "—"}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(s.status)}`}>
                    {s.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={10} />
                    {s.scheduledAt
                      ? new Date(s.scheduledAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
                      : new Date(s.createdAt).toLocaleDateString()}
                  </div>
                  {s.duration && (
                    <div className="flex items-center gap-1">
                      <Clock size={10} /> {Math.floor(s.duration / 60)}m
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";

type Log = {
  id: string; action: string; reason: string | null; userName: string | null; createdAt: string;
  changes: { field: string; from: any; to: any }[] | null;
};

const show = (v: any) => (v === null || v === undefined || v === "" ? "—" : String(v));
const when = (s: string) =>
  new Date(s).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function HistoryPanel({ entity, entityId, refreshKey = 0 }: { entity: string; entityId: string; refreshKey?: number }) {
  const [logs, setLogs] = useState<Log[] | null>(null);

  useEffect(() => {
    fetch(`/api/diagnostic/audit?entity=${entity}&entityId=${entityId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setLogs(d.success ? d.logs : []))
      .catch(() => setLogs([]));
  }, [entity, entityId, refreshKey]);

  if (!logs) return <p className="text-sm text-slate-500">Loading...</p>;
  if (logs.length === 0) return <p className="text-sm text-slate-500">Kono history nai.</p>;

  return (
    <div className="relative space-y-4 border-l-2 border-blue-100 pl-5">
      {logs.map((l) => (
        <div key={l.id} className="relative">
          <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
            <History size={9} />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${l.action === "CREATE" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
              {l.action === "CREATE" ? "CREATED" : "EDITED"}
            </span>
            <span className="text-xs font-bold text-slate-800">{l.userName || "Unknown"}</span>
            <span className="text-xs text-slate-400">{when(l.createdAt)}</span>
          </div>
          {l.reason && <p className="mt-1 text-xs italic text-slate-500">Karon: {l.reason}</p>}
          {l.changes && l.changes.length > 0 && (
            <div className="mt-1.5 space-y-1 rounded-xl bg-slate-50 p-2.5">
              {l.changes.map((c, i) => (
                <p key={i} className="text-xs text-slate-700">
                  <b>{c.field}:</b>{" "}
                  {l.action === "CREATE" ? (
                    <span className="text-emerald-700">{show(c.to)}</span>
                  ) : (
                    <>
                      <span className="text-red-500 line-through">{show(c.from)}</span> → <span className="font-semibold text-emerald-700">{show(c.to)}</span>
                    </>
                  )}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

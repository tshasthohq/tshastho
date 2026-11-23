"use client";
import { useT } from "@/i18n/doctor-extra";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cachedGet } from "@/lib/offline/doctor-rx";
import { rxAll } from "@/lib/offline/db";
import { ArrowLeft, Plus, Search, Printer, Clock, FileText, Building2 } from "lucide-react";

const card = "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm";
const chip = (on: boolean) => "px-3 py-1.5 rounded-lg text-xs font-bold border " + (on ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200");
const fmt = (d: string) => { try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return ""; } };

export default function LocalRxListPage() {
  const T = useT();
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [range, setRange] = useState<"today" | "week" | "all">("all");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await cachedGet("/api/doctor/local-prescriptions");
        const d = await r.json();
        setList(d.prescriptions || []);
      } catch { setFailed(true); }
      try {
        const r = await cachedGet("/api/doctor/local-patients");
        const d = await r.json();
        const m: Record<string, string> = {};
        (d.patients || []).forEach((p: any) => { m[p.id] = p.name; });
        setNames(m);
      } catch {}
      try { setPending(await rxAll()); } catch {}
      setLoading(false);
    })();
  }, []);

  const inRange = (d: string) => {
    if (range === "today") return new Date(d).toDateString() === new Date().toDateString();
    if (range === "week") return Date.now() - new Date(d).getTime() < 7 * 86400000;
    return true;
  };
  const needle = q.trim().toLowerCase();
  const filtered = list.filter((p) =>
    inRange(p.visitDate) &&
    (!needle || [p.localPatient?.name, p.prescriptionNo, p.diagnosis].some((x: any) => x && String(x).toLowerCase().includes(needle)))
  );
  const totalFee = filtered.reduce((s, p) => s + Number(p.fee || 0), 0);
  const count = (p: any) => (Array.isArray(p.items) ? p.items.length : 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-slate-800 flex-1">{T("Local Rx")}</h1>
          <Link href="/doctor/local-rx/new" className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl"><Plus size={16} /> {T("New")}</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">{T("Prescriptions")}</div><div className="text-2xl font-bold text-slate-800">{filtered.length}</div></div>
          <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">{T("Fee collected")}</div><div className="text-2xl font-bold text-emerald-600">৳{totalFee.toFixed(0)}</div></div>
        </div>

        {pending.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2"><Clock size={16} /> {T("Sync pending")} ({pending.length})</div>
            <div className="space-y-2">
              {pending.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-amber-100 px-3 py-2.5 text-sm">
                  <div className="font-semibold text-slate-800">{names[r.payload?.localPatientId] || T("Patient")}</div>
                  <div className="text-xs text-slate-500">
                    {r.payload?.diagnosis || T("No diagnosis")} · {Array.isArray(r.payload?.items) ? r.payload.items.length : 0} {T("medicine · ৳")}{Number(r.payload?.fee || 0)}
                  </div>
                  <div className="text-[11px] mt-1 font-bold text-amber-600">{r.status === "FAILED" ? T("Failed: ") + (r.lastError || T("check data")) : T("Internet ashle auto sync hobe")}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("Search patient, Rx no, diagnosis...")} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRange("today")} className={chip(range === "today")}>{T("Today")}</button>
          <button onClick={() => setRange("week")} className={chip(range === "week")}>{T("7 days")}</button>
          <button onClick={() => setRange("all")} className={chip(range === "all")}>{T("All")}</button>
        </div>

        {loading && <p className="text-center text-sm text-slate-400 py-8">{T("Loading...")}</p>}
        {!loading && failed && list.length === 0 && <p className="text-center text-sm text-amber-600 py-4">{T("Offline: ager load kora list nei. Internet ashle dekhabe.")}</p>}
        {!loading && !failed && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400"><FileText size={36} className="mx-auto mb-2 opacity-50" /><p className="text-sm">{T("Kono Rx pawa gelo na")}</p></div>
        )}

        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className={card}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">{p.localPatient?.name || T("Patient")}</div>
                  <div className="text-xs text-slate-500">{p.prescriptionNo} · {fmt(p.visitDate)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-emerald-600">৳{Number(p.fee || 0).toFixed(0)}</div>
                  {p.isPrinted && <div className="text-[10px] font-bold text-slate-400">{T("Printed")}</div>}
                </div>
              </div>
              {p.diagnosis && <div className="mt-2 text-sm text-slate-700">{p.diagnosis}</div>}
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                <span>{count(p)} {T("medicine")}</span>
                {p.chamber?.name && <span className="flex items-center gap-1"><Building2 size={12} /> {p.chamber.name}</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={"/doctor/local-rx/" + p.id} className="flex-1 text-center py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">{T("Open")}</Link>
                <Link href={"/doctor/local-rx/" + p.id + "?print=true"} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold"><Printer size={15} /> {T("Print")}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

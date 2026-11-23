"use client";
import { useT } from "@/i18n/doctor-extra";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react";

const card = "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm";
const inp = "w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none bg-white";
const lbl = "text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block";
const chip = (on: boolean) => "px-3 py-1.5 rounded-lg text-xs font-bold border " + (on ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200");
const tk = (n: number) => "৳" + Math.round(n || 0).toLocaleString("en-US");
const pad = (n: number) => String(n).padStart(2, "0");
const nowD = new Date();
const curMonth = nowD.getFullYear() + "-" + pad(nowD.getMonth() + 1);
const todayStr = nowD.getFullYear() + "-" + pad(nowD.getMonth() + 1) + "-" + pad(nowD.getDate());
const fmt = (d: string) => { try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); } catch { return ""; } };
const emptyF = { agentId: "", patientName: "", fee: "", type: "", rate: "", date: todayStr, note: "" };

export default function VisitsPage() {
  const T = useT();
  const router = useRouter();
  const [month, setMonth] = useState(curMonth);
  const [agents, setAgents] = useState<any[]>([]);
  const [data, setData] = useState<any>({ visits: [], summary: {}, byAgent: [] });
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [f, setF] = useState<any>(emptyF);

  const load = async () => {
    setLoading(true);
    try {
      const [a, v] = await Promise.all([
        fetch("/api/doctor/agents", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/doctor/visits?month=" + month, { credentials: "include" }).then((r) => r.json()),
      ]);
      setAgents(a.agents || []);
      setData({ visits: v.visits || [], summary: v.summary || {}, byAgent: v.byAgent || [] });
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [month]);

  const selAgent = agents.find((a) => a.id === f.agentId);
  const type = f.type || selAgent?.commissionType || "PERCENT";
  const rate = f.rate !== "" ? Number(f.rate) : selAgent ? Number(selAgent.commissionRate) : 0;
  const fee = Number(f.fee) || 0;
  const comm = type === "PERCENT" ? (fee * rate) / 100 : rate;

  const save = async () => {
    if (!fee) { setMsg(T("Visit fee likhun")); return; }
    setSaving(true); setMsg("");
    try {
      const r = await fetch("/api/doctor/visits", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          agentId: f.agentId || undefined, patientName: f.patientName || undefined, visitFee: fee,
          commissionType: type, commissionRate: rate, visitDate: f.date || undefined, note: f.note || undefined,
        }),
      });
      const d = await r.json();
      if (r.ok) { setShow(false); setF(emptyF); load(); } else setMsg(d.message || d.error || T("Failed"));
    } catch { setMsg(T("Internet lagbe")); }
    setSaving(false);
  };

  const pay = async (ids: string[]) => {
    if (!ids.length || !confirm(T("Ei commission dewa hoyeche bole mark korben?"))) return;
    await fetch("/api/doctor/visits", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ids, status: "PAID" }) });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(T("Ei visit muchhe felben?"))) return;
    await fetch("/api/doctor/visits/" + id, { method: "DELETE", credentials: "include" });
    load();
  };

  const s = data.summary || {};

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-slate-800 flex-1">{T("Visits & Commission")}</h1>
          <Link href="/doctor/agents" className="p-2 rounded-lg bg-slate-100 text-slate-600"><Users size={18} /></Link>
          <button onClick={() => { setF(emptyF); setMsg(""); setShow(true); }} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl"><Plus size={16} /> {T("Visit")}</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inp} />

        <div className="grid grid-cols-2 gap-3">
          <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">{T("Visit")}</div><div className="text-xl font-bold text-slate-800">{s.count || 0}</div></div>
          <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">{T("Total fee")}</div><div className="text-xl font-bold text-slate-800">{tk(s.totalFee)}</div></div>
          <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">{T("Commission")}</div><div className="text-xl font-bold text-red-600">{tk(s.totalCommission)}</div></div>
          <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">{T("Net income")}</div><div className="text-xl font-bold text-emerald-600">{tk(s.totalNet)}</div></div>
        </div>

        {s.pendingCommission > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">{T("Ekhono dewa baki commission:")} {tk(s.pendingCommission)}</div>
        )}

        {data.byAgent.length > 0 && (
          <div className={card}>
            <h2 className="font-bold text-slate-800 mb-3">{T("Agent onujayi")}</h2>
            <div className="space-y-3">
              {data.byAgent.map((g: any, i: number) => (
                <div key={i} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{g.name}</div>
                      {g.organization && <div className="text-xs text-slate-500 truncate">{g.organization}</div>}
                    </div>
                    <div className="text-right shrink-0 text-sm">
                      <div className="font-bold text-red-600">{tk(g.commission)}</div>
                      <div className="text-[11px] text-slate-400">{g.count} {T("visit")}</div>
                    </div>
                  </div>
                  {g.pending > 0 && (
                    <button onClick={() => pay(g.pendingIds)} className="mt-2 w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">{T("Baki")} {tk(g.pending)} {T("dewa hoyeche (Paid mark)")}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="text-center text-sm text-slate-400 py-6">{T("Loading...")}</p>}
        {!loading && data.visits.length === 0 && <p className="text-center text-sm text-slate-400 py-8">{T("Ei mashe kono visit nei.")}</p>}
        <div className="space-y-2">
          {data.visits.map((v: any) => (
            <div key={v.id} className={card}>
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{v.patientName || T("Patient")}</div>
                  <div className="text-xs text-slate-500 truncate">{fmt(v.visitDate)} · {v.agentName || T("No agent")}{v.organization ? " · " + v.organization : ""}</div>
                </div>
                <div className="text-right shrink-0 text-sm">
                  <div className="font-bold text-slate-800">{tk(v.visitFee)}</div>
                  <div className="text-xs text-red-600">- {tk(v.commissionAmount)}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={"text-[11px] font-bold px-2 py-0.5 rounded-md " + (v.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{v.status === "PAID" ? T("Paid") : T("Baki")}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-600">{T("Net")} {tk(v.netIncome)}</span>
                  <button onClick={() => remove(v.id)} className="text-slate-400"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto space-y-3">
            <h2 className="font-bold text-slate-800">{T("Notun visit")}</h2>
            {msg && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-3 py-2">{msg}</div>}
            <div>
              <label className={lbl}>{T("Agent / Prothisthan")}</label>
              <select className={inp} value={f.agentId} onChange={(e) => setF({ ...f, agentId: e.target.value, type: "", rate: "" })}>
                <option value="">{T("— No agent —")}</option>
                {agents.map((a) => (<option key={a.id} value={a.id}>{a.name}{a.organization ? " (" + a.organization + ")" : ""}</option>))}
              </select>
              {agents.length === 0 && <Link href="/doctor/agents" className="text-xs font-bold text-blue-600">{T("Age agent add korun")}</Link>}
            </div>
            <div><label className={lbl}>{T("Patient-er naam")}</label><input className={inp} value={f.patientName} onChange={(e) => setF({ ...f, patientName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>{T("Visit fee (৳) *")}</label><input className={inp} type="number" min={0} inputMode="numeric" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} /></div>
              <div><label className={lbl}>{T("Tarikh")}</label><input className={inp} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            </div>
            <div>
              <label className={lbl}>{T("Commission")}</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setF({ ...f, type: "PERCENT" })} className={chip(type === "PERCENT")}>%</button>
                <button type="button" onClick={() => setF({ ...f, type: "FIXED" })} className={chip(type === "FIXED")}>{T("৳ Fixed")}</button>
              </div>
              <input className={inp} type="number" min={0} inputMode="decimal" placeholder={selAgent ? T("Default: ") + selAgent.commissionRate : T("Rate")} value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} />
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm flex justify-between">
              <span>{T("Commission:")} <b className="text-red-600">{tk(comm)}</b></span>
              <span>{T("Net:")} <b className="text-emerald-600">{tk(fee - comm)}</b></span>
            </div>
            <div><label className={lbl}>{T("Note")}</label><input className={inp} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShow(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 text-sm">{T("Cancel")}</button>
              <button disabled={saving} onClick={save} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm disabled:opacity-50">{saving ? T("Saving...") : T("Save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

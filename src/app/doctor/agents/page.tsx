"use client";
import { useT } from "@/i18n/doctor-extra";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Pencil, Phone, Building2 } from "lucide-react";

const TYPES = ["AGENT", "HOSPITAL", "CLINIC", "DIAGNOSTIC", "OTHER"];
const empty = { name: "", organization: "", agentType: "AGENT", phone: "", address: "", commissionType: "PERCENT", commissionRate: "" };
const card = "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm";
const inp = "w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none bg-white";
const lbl = "text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block";
const chip = (on: boolean) => "px-3 py-1.5 rounded-lg text-xs font-bold border " + (on ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200");

export default function AgentsPage() {
  const T = useT();
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState("");
  const [f, setF] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const r = await fetch("/api/doctor/agents", { credentials: "include" });
      const d = await r.json();
      setAgents(d.agents || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(""); setF(empty); setMsg(""); setShow(true); };
  const openEdit = (a: any) => {
    setEditId(a.id);
    setF({ name: a.name, organization: a.organization || "", agentType: a.agentType, phone: a.phone || "", address: a.address || "", commissionType: a.commissionType, commissionRate: String(a.commissionRate) });
    setMsg(""); setShow(true);
  };

  const save = async () => {
    if (!f.name.trim()) { setMsg(T("Naam likhun")); return; }
    setSaving(true); setMsg("");
    try {
      const r = await fetch(editId ? "/api/doctor/agents/" + editId : "/api/doctor/agents", {
        method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ ...f, commissionRate: Number(f.commissionRate) || 0 }),
      });
      const d = await r.json();
      if (r.ok) { setShow(false); load(); } else setMsg(d.message || d.error || T("Failed"));
    } catch { setMsg(T("Internet lagbe")); }
    setSaving(false);
  };

  const remove = async (a: any) => {
    if (!confirm(a.name + ": " + T("Remove agent?"))) return;
    await fetch("/api/doctor/agents/" + a.id, { method: "DELETE", credentials: "include" });
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-slate-800 flex-1">{T("Agents & Prothisthan")}</h1>
          <button onClick={openNew} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl"><Plus size={16} /> {T("Add")}</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-3">
        {loading && <p className="text-center text-sm text-slate-400 py-8">{T("Loading...")}</p>}
        {!loading && agents.length === 0 && <p className="text-center text-sm text-slate-400 py-10">{T("Ekhono kono agent nei. Upore Add chapun.")}</p>}
        {agents.map((a) => (
          <div key={a.id} className={card}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">{a.name}</div>
                {a.organization && <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Building2 size={12} /> {a.organization}</div>}
                {a.phone && <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={12} /> {a.phone}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-blue-600">{a.commissionType === "PERCENT" ? a.commissionRate + "%" : "৳" + a.commissionRate}</div>
                <div className="text-[10px] font-bold text-slate-400">{T("type." + a.agentType)}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => openEdit(a)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold flex items-center justify-center gap-1.5"><Pencil size={14} /> {T("Edit")}</button>
              <button onClick={() => remove(a)} className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto space-y-3">
            <h2 className="font-bold text-slate-800">{editId ? T("Edit agent") : T("New agent")}</h2>
            {msg && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-3 py-2">{msg}</div>}
            <div><label className={lbl}>{T("Naam *")}</label><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><label className={lbl}>{T("Prothisthan-er naam")}</label><input className={inp} value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} /></div>
            <div>
              <label className={lbl}>{T("Dhoron")}</label>
              <div className="flex flex-wrap gap-1.5">{TYPES.map((t) => (<button key={t} type="button" onClick={() => setF({ ...f, agentType: t })} className={chip(f.agentType === t)}>{T("type." + t)}</button>))}</div>
            </div>
            <div><label className={lbl}>{T("Phone")}</label><input className={inp} inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div><label className={lbl}>{T("Thikana")}</label><input className={inp} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
            <div>
              <label className={lbl}>{T("Default commission")}</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setF({ ...f, commissionType: "PERCENT" })} className={chip(f.commissionType === "PERCENT")}>{T("Percent (%)")}</button>
                <button type="button" onClick={() => setF({ ...f, commissionType: "FIXED" })} className={chip(f.commissionType === "FIXED")}>{T("Fixed (৳)")}</button>
              </div>
              <input className={inp} type="number" min={0} inputMode="decimal" placeholder={f.commissionType === "PERCENT" ? "e.g. 20" : "e.g. 100"} value={f.commissionRate} onChange={(e) => setF({ ...f, commissionRate: e.target.value })} />
            </div>
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

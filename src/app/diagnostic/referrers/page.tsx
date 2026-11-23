"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ui } from "@/lib/diagnostic/ui";
import HistoryPanel from "@/components/diagnostic/HistoryPanel";
import { Plus, X, Pencil, History, Stethoscope, Briefcase } from "lucide-react";

type R = {
  id: string; name: string; type: string; phone: string | null; degree: string | null; specialty: string | null;
  notes?: string | null; commissionMode?: string; commissionValue?: string; isActive: boolean;
};

const EMPTY: Record<string, any> = {
  type: "DOCTOR", name: "", phone: "", degree: "", specialty: "", notes: "",
  commissionMode: "TEST_DEFAULT", commissionValue: "0", isActive: true, reason: "",
};

const ruleText = (r: R) =>
  r.commissionMode === undefined ? ""
  : r.commissionMode === "PERCENT" ? `${Number(r.commissionValue)}% of bill`
  : r.commissionMode === "FIXED" ? `৳${Number(r.commissionValue)} per order`
  : "Test-er commission";

export default function Referrers() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const isOwner = user?.role === "DIAGNOSTIC_OWNER";
  const [rows, setRows] = useState<R[]>([]);
  const [tab, setTab] = useState("DOCTOR");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>(EMPTY);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [hist, setHist] = useState<R | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/diagnostic/referrers?all=1", { credentials: "include" });
    const d = await r.json();
    if (d.success) setRows(d.referrers);
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const openNew = () => { setEditId(null); setForm({ ...EMPTY, type: tab }); setMsg(""); setOpen(true); };
  const openEdit = (r: R) => {
    setEditId(r.id);
    setForm({
      type: r.type, name: r.name, phone: r.phone || "", degree: r.degree || "", specialty: r.specialty || "",
      notes: r.notes || "", commissionMode: r.commissionMode || "TEST_DEFAULT",
      commissionValue: String(Number(r.commissionValue || 0)), isActive: r.isActive, reason: "",
    });
    setMsg(""); setOpen(true);
  };
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    const body = { ...form, commissionValue: Number(form.commissionValue || 0) };
    const res = await fetch(editId ? `/api/diagnostic/referrers/${editId}` : "/api/diagnostic/referrers", {
      method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) { setOpen(false); load(); } else setMsg(d.message || "Failed");
  };

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;
  const list = rows.filter((r) => r.type === tab);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className={ui.h1}>Doctors <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">& Agents</span></h1>
          <p className={ui.sub}>Commission rule ekhan theke thik hoy. Edit korle history save hoy.</p>
        </div>
        <button onClick={openNew} className={ui.btn + " flex items-center gap-1.5"}><Plus size={16} /> Add</button>
      </div>

      <div className="flex gap-2">
        {[["DOCTOR", "Doctors"], ["AGENT", "Agents"], ["PC", "PC / Collection"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25" : "border border-slate-200 bg-white text-slate-600"}`}>
            {l}
          </button>
        ))}
      </div>

      {list.length === 0 && <div className={ui.card + " text-center text-sm text-slate-500"}>Kono entry nai.</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((r) => (
          <div key={r.id} className={ui.card + " !p-4"}>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                {r.type === "DOCTOR" ? <Stethoscope size={18} /> : <Briefcase size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{r.name}</p>
                <p className="truncate text-xs text-slate-500">{[r.degree, r.specialty].filter(Boolean).join(" • ") || r.type}{r.phone ? ` • ${r.phone}` : ""}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ruleText(r) && <span className={ui.pill + " bg-blue-50 text-blue-700"}>{ruleText(r)}</span>}
                  <span className={ui.pill + (r.isActive ? " bg-emerald-50 text-emerald-700" : " bg-slate-100 text-slate-500")}>{r.isActive ? "ACTIVE" : "INACTIVE"}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2 text-xs font-bold">
              <button onClick={() => setHist(r)} className="flex items-center gap-1 text-slate-600"><History size={13} /> History</button>
              {isOwner && <button onClick={() => openEdit(r)} className="flex items-center gap-1 text-blue-600"><Pencil size={13} /> Edit</button>}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 text-slate-900 sm:rounded-3xl [color-scheme:light]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{editId ? "Edit" : "Add"} {form.type === "DOCTOR" ? "Doctor" : form.type === "AGENT" ? "Agent" : "PC"}</h2>
              <button type="button" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            {msg && <p className="rounded-xl bg-red-50 p-2 text-sm text-red-600">{msg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={ui.label}>Type</label>
                <select className={ui.field} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="DOCTOR">Doctor</option><option value="AGENT">Agent</option><option value="PC">PC / Collection</option>
                </select></div>
              <div><label className={ui.label}>Phone</label><input className={ui.field} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            </div>
            <div><label className={ui.label}>Naam *</label><input required className={ui.field} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            {form.type === "DOCTOR" && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className={ui.label}>Degree</label><input className={ui.field} value={form.degree} onChange={(e) => set("degree", e.target.value)} placeholder="MBBS, FCPS" /></div>
                <div><label className={ui.label}>Specialty</label><input className={ui.field} value={form.specialty} onChange={(e) => set("specialty", e.target.value)} /></div>
              </div>
            )}
            <div className="rounded-2xl bg-blue-50/60 p-3">
              <p className="mb-2 text-xs font-black text-blue-800">Commission rule</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={ui.label}>Dhoron</label>
                  <select className={ui.field} value={form.commissionMode} onChange={(e) => set("commissionMode", e.target.value)}>
                    <option value="TEST_DEFAULT">Test-er commission</option>
                    <option value="PERCENT">% of bill</option>
                    <option value="FIXED">Fixed per order</option>
                  </select></div>
                <div><label className={ui.label}>Value</label>
                  <input type="number" min="0" disabled={form.commissionMode === "TEST_DEFAULT"} className={ui.field} value={form.commissionValue} onChange={(e) => set("commissionValue", e.target.value)} /></div>
              </div>
            </div>
            <div><label className={ui.label}>Notes (internal)</label><input className={ui.field} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            {editId && (
              <>
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active</label>
                <div><label className={ui.label}>Edit-er karon</label><input className={ui.field} value={form.reason} onChange={(e) => set("reason", e.target.value)} /></div>
              </>
            )}
            <button disabled={saving} className={ui.btn + " w-full"}>{saving ? "Saving..." : "Save"}</button>
          </form>
        </div>
      )}

      {hist && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center" onClick={() => setHist(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">History: {hist.name}</h2>
              <button onClick={() => setHist(null)}><X size={20} /></button>
            </div>
            <HistoryPanel entity="REFERRER" entityId={hist.id} />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Plus, Search, X, Pencil } from "lucide-react";

type Dept = { id: string; name: string };
type Test = {
  id: string; code: string; name: string; shortName: string | null;
  departmentId: string | null; department: Dept | null; sampleType: string | null;
  price: string; costPrice: string; reportingHours: number; fastingRequired: boolean;
  instructions: string | null; commissionType: string; commissionValue: string;
  homeCollection: boolean; isActive: boolean;
};

const EMPTY: Record<string, any> = {
  code: "", name: "", shortName: "", departmentId: "", sampleType: "",
  price: "", costPrice: "0", reportingHours: "24", fastingRequired: false,
  instructions: "", commissionType: "PERCENT", commissionValue: "0",
  homeCollection: true, isActive: true,
};

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 caret-orange-600 [color-scheme:light]";
const label = "mb-1 block text-xs font-bold text-slate-800";

export default function TestCatalog() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const isOwner = user?.role === "DIAGNOSTIC_OWNER";

  const [tests, setTests] = useState<Test[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [search, setSearch] = useState("");
  const [deptId, setDeptId] = useState("");
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (deptId) q.set("departmentId", deptId);
    const r = await fetch(`/api/diagnostic/tests?${q}`, { credentials: "include" });
    const d = await r.json();
    if (d.success) setTests(d.tests);
    setBusy(false);
  }, [search, deptId]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/diagnostic/departments", { credentials: "include" })
      .then((r) => r.json()).then((d) => d.success && setDepts(d.departments));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [user, load]);

  const openNew = () => { setEditId(null); setForm(EMPTY); setMsg(""); setOpen(true); };
  const openEdit = (t: Test) => {
    setEditId(t.id);
    setForm({
      code: t.code, name: t.name, shortName: t.shortName || "", departmentId: t.departmentId || "",
      sampleType: t.sampleType || "", price: String(Number(t.price)), costPrice: String(Number(t.costPrice)),
      reportingHours: String(t.reportingHours), fastingRequired: t.fastingRequired,
      instructions: t.instructions || "", commissionType: t.commissionType,
      commissionValue: String(Number(t.commissionValue)), homeCollection: t.homeCollection, isActive: t.isActive,
    });
    setMsg(""); setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    const body = {
      ...form,
      shortName: form.shortName || null,
      departmentId: form.departmentId || null,
      sampleType: form.sampleType || null,
      instructions: form.instructions || null,
      price: Number(form.price || 0),
      costPrice: Number(form.costPrice || 0),
      reportingHours: Number(form.reportingHours || 0),
      commissionValue: Number(form.commissionValue || 0),
    };
    const res = await fetch(editId ? `/api/diagnostic/tests/${editId}` : "/api/diagnostic/tests", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) { setOpen(false); load(); } else setMsg(d.message || "Failed");
  };

  const toggle = async (t: Test) => {
    if (!t.isActive && Number(t.price) <= 0) { openEdit(t); setMsg("Age price din, tarpor active korun"); return; }
    await fetch(`/api/diagnostic/tests/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ isActive: !t.isActive }),
    });
    load();
  };

  const importXlsx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg("Importing...");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/diagnostic/tests/import", { method: "POST", body: fd, credentials: "include" });
    const d = await r.json().catch(() => ({ message: "Server response pay ni. Page refresh kore dekhun" }));
    if (d.success) {
      setMsg(`Updated: ${d.updated}, New: ${d.created}` + (d.errorCount ? ` | ${d.errorCount} ta error: ${d.errors.join("; ")}` : ""));
    } else setMsg(d.message || "Import failed");
    load();
  };

  const seed = async () => {
    const r = await fetch("/api/diagnostic/tests/seed", { method: "POST", credentials: "include" });
    const d = await r.json();
    setMsg(d.success ? `${d.added} ta notun test jog hoyeche (total ${d.total ?? ""}). Price boshale active korun.` : d.message);
    load();
  };

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Test Catalog</h1>
        {isOwner && (
          <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white">
            <Plus size={16} /> Add Test
          </button>
        )}
      </div>

      {isOwner && (
        <button onClick={seed} className="w-full rounded-lg border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-800">
          Load full catalog (all tests)
        </button>
      )}
      {isOwner && (
        <div className="grid grid-cols-3 gap-2">
          <a href="/api/diagnostic/tests/export?format=csv" className="rounded-lg border border-slate-300 bg-white py-2 text-center text-sm font-semibold text-slate-800">
            Export CSV
          </a>
          <a href="/api/diagnostic/tests/export" className="rounded-lg border border-slate-300 bg-white py-2 text-center text-sm font-semibold text-slate-800">
            Export Excel
          </a>
          <label className="cursor-pointer rounded-lg border border-slate-300 bg-white py-2 text-center text-sm font-semibold text-slate-800">
            Import Excel
            <input type="file" accept=".xlsx,.xls,.csv,text/csv" onChange={importXlsx} className="hidden" />
          </label>
        </div>
      )}

      {msg && !open && <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">{msg}</p>}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Test name ba code..."
          className={field + " pl-9"} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ id: "", name: "All" }, ...depts].map((d) => (
          <button key={d.id} onClick={() => setDeptId(d.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${deptId === d.id ? "bg-orange-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
            {d.name}
          </button>
        ))}
      </div>

      {!busy && tests.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">Kono test nai.</p>
          {isOwner && !search && !deptId && (
            <button onClick={seed} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Common test gulo load korun
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {tests.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">
                  {t.code} • {t.department?.name || "No dept"} • {t.sampleType || "N/A"} • {t.reportingHours}h
                  {t.fastingRequired ? " • Fasting" : ""}
                </p>
              </div>
              <div className="text-right">
                {Number(t.price) > 0
                  ? <p className="text-sm font-bold text-slate-900">৳{Number(t.price)}</p>
                  : <p className="text-xs font-bold text-red-500">Set price</p>}
                <p className="text-[10px] text-slate-400">
                  Comm: {t.commissionType === "PERCENT" ? `${Number(t.commissionValue)}%` : `৳${Number(t.commissionValue)}`}
                </p>
              </div>
            </div>
            {isOwner && (
              <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-2">
                <button onClick={() => toggle(t)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${t.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {t.isActive ? "ACTIVE" : "INACTIVE"}
                </button>
                <button onClick={() => openEdit(t)} className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                  <Pencil size={12} /> Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 sm:items-center" onClick={() => setOpen(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-2xl bg-white p-4 text-slate-900 sm:rounded-2xl [color-scheme:light]">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{editId ? "Edit Test" : "Add Test"}</h2>
              <button type="button" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            {msg && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{msg}</p>}

            <div className="grid grid-cols-3 gap-3">
              <div><label className={label}>Code *</label>
                <input required value={form.code} onChange={(e) => set("code", e.target.value)} className={field} /></div>
              <div className="col-span-2"><label className={label}>Test name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={field} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Department</label>
                <select value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)} className={field}>
                  <option value="">-- Select --</option>
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select></div>
              <div><label className={label}>Sample type</label>
                <input value={form.sampleType} onChange={(e) => set("sampleType", e.target.value)} placeholder="Blood, Urine..." className={field} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={label}>Price (৳) *</label>
                <input required type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} className={field} /></div>
              <div><label className={label}>Cost (৳)</label>
                <input type="number" min="0" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} className={field} /></div>
              <div><label className={label}>Report (hrs)</label>
                <input type="number" min="0" value={form.reportingHours} onChange={(e) => set("reportingHours", e.target.value)} className={field} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Commission type</label>
                <select value={form.commissionType} onChange={(e) => set("commissionType", e.target.value)} className={field}>
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FIXED">Fixed (৳)</option>
                </select></div>
              <div><label className={label}>Commission value</label>
                <input type="number" min="0" value={form.commissionValue} onChange={(e) => set("commissionValue", e.target.value)} className={field} /></div>
            </div>
            <div><label className={label}>Patient instructions</label>
              <input value={form.instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="e.g. 8-10 ghonta khali pete" className={field} /></div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.fastingRequired} onChange={(e) => set("fastingRequired", e.target.checked)} /> Fasting</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.homeCollection} onChange={(e) => set("homeCollection", e.target.checked)} /> Home collection</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active</label>
            </div>
            <button disabled={saving} className="w-full rounded-lg bg-orange-600 py-2.5 font-semibold text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

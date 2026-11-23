"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ui } from "@/lib/diagnostic/ui";
import HistoryPanel from "@/components/diagnostic/HistoryPanel";
import { Plus, X, Pencil, History, BadgeCheck, Upload } from "lucide-react";

type S = {
  id: string; role: string; name: string; degree: string | null; designation: string | null;
  regNo: string | null; signatureUrl: string | null; isDefault: boolean; isActive: boolean;
};

const EMPTY: Record<string, any> = {
  role: "PATHOLOGIST", name: "", degree: "", designation: "", regNo: "", signatureUrl: "", isDefault: false, isActive: true, reason: "",
};

export default function Signers() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "SUPER_ADMIN"]);
  const [rows, setRows] = useState<S[]>([]);
  const [tab, setTab] = useState("PATHOLOGIST");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>(EMPTY);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hist, setHist] = useState<S | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/diagnostic/signers?all=1", { credentials: "include" });
    const d = await r.json();
    if (d.success) setRows(d.signers);
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm({ ...EMPTY, role: tab }); setMsg(""); setOpen(true); };
  const openEdit = (s: S) => {
    setEditId(s.id);
    setForm({ role: s.role, name: s.name, degree: s.degree || "", designation: s.designation || "", regNo: s.regNo || "",
      signatureUrl: s.signatureUrl || "", isDefault: s.isDefault, isActive: s.isActive, reason: "" });
    setMsg(""); setOpen(true);
  };

  const upload = async (file: File) => {
    setUploading(true); setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (r.ok && d.url) set("signatureUrl", d.url); else setMsg(d.error || "Upload failed");
    } catch { setMsg("Upload failed"); }
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    const res = await fetch(editId ? `/api/diagnostic/signers/${editId}` : "/api/diagnostic/signers", {
      method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) { setOpen(false); load(); } else setMsg(d.message || "Failed");
  };

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;
  const list = rows.filter((r) => r.role === tab);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className={ui.h1}>Report <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Signatories</span></h1>
          <p className={ui.sub}>Pathologist ar Technologist-er naam, degree, reg no ar signature/seal. Report-e print hoy.</p>
        </div>
        <button onClick={openNew} className={ui.btn + " flex items-center gap-1.5"}><Plus size={16} /> Add</button>
      </div>

      <div className="flex gap-2">
        {[["PATHOLOGIST", "Pathologists"], ["TECHNOLOGIST", "Technologists"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25" : "border border-slate-200 bg-white text-slate-600"}`}>{l}</button>
        ))}
      </div>

      {list.length === 0 && <div className={ui.card + " text-center text-sm text-slate-500"}>Kono entry nai. Add chapun.</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((s) => (
          <div key={s.id} className={ui.card + " !p-4"}>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white"><BadgeCheck size={18} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{s.name}</p>
                <p className="text-xs text-slate-600">{s.degree || "-"}</p>
                <p className="text-xs text-slate-500">{s.designation || "-"}{s.regNo ? ` • Reg: ${s.regNo}` : ""}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {s.isDefault && <span className={ui.pill + " bg-blue-50 text-blue-700"}>DEFAULT</span>}
                  <span className={ui.pill + (s.isActive ? " bg-emerald-50 text-emerald-700" : " bg-slate-100 text-slate-500")}>{s.isActive ? "ACTIVE" : "INACTIVE"}</span>
                  <span className={ui.pill + (s.signatureUrl ? " bg-emerald-50 text-emerald-700" : " bg-amber-50 text-amber-700")}>{s.signatureUrl ? "SIGNATURE ✓" : "NO SIGNATURE"}</span>
                </div>
              </div>
              {s.signatureUrl && <img src={s.signatureUrl} alt="sig" className="h-10 max-w-[70px] object-contain" />}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2 text-xs font-bold">
              <button onClick={() => setHist(s)} className="flex items-center gap-1 text-slate-600"><History size={13} /> History</button>
              <button onClick={() => openEdit(s)} className="flex items-center gap-1 text-blue-600"><Pencil size={13} /> Edit</button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 text-slate-900 sm:rounded-3xl [color-scheme:light]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{editId ? "Edit" : "Add"} {form.role === "PATHOLOGIST" ? "Pathologist" : "Technologist"}</h2>
              <button type="button" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            {msg && <p className="rounded-xl bg-red-50 p-2 text-sm font-semibold text-red-600">{msg}</p>}
            <div><label className={ui.label}>Role</label>
              <select className={ui.field} value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="PATHOLOGIST">Pathologist (verify kore)</option>
                <option value="TECHNOLOGIST">Technologist (report toiri kore)</option>
              </select></div>
            <div><label className={ui.label}>Naam *</label><input required className={ui.field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dr. Md. Rahim" /></div>
            <div><label className={ui.label}>Degree</label><input className={ui.field} value={form.degree} onChange={(e) => set("degree", e.target.value)} placeholder="MBBS, MD (Pathology)" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={ui.label}>Designation</label><input className={ui.field} value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="Consultant Pathologist" /></div>
              <div><label className={ui.label}>BMDC / Reg. No</label><input className={ui.field} value={form.regNo} onChange={(e) => set("regNo", e.target.value)} /></div>
            </div>
            <div>
              <label className={ui.label}>Signature / Seal (JPG, PNG, WebP)</label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3">
                {form.signatureUrl ? <img src={form.signatureUrl} alt="sig" className="h-14 max-w-[120px] object-contain" /> : <span className="text-xs text-slate-400">Kono chobi nai</span>}
                <label className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                  <Upload size={14} /> {uploading ? "Uploading..." : "Upload"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </label>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Shada background-e kalo/nil kalir signature, PNG hole bhalo.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} /> Default (auto select hobe)</label>
            {editId && (
              <>
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active</label>
                <div><label className={ui.label}>Edit-er karon</label><input className={ui.field} value={form.reason} onChange={(e) => set("reason", e.target.value)} /></div>
              </>
            )}
            <button disabled={saving || uploading} className={ui.btn + " w-full"}>{saving ? "Saving..." : "Save"}</button>
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
            <HistoryPanel entity="SIGNER" entityId={hist.id} />
          </div>
        </div>
      )}
    </div>
  );
}

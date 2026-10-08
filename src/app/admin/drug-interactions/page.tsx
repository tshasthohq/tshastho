"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ShieldAlert, Plus, X, Trash2, AlertTriangle, Sparkles } from "lucide-react";

const SEVERITIES = ["MINOR", "MODERATE", "MAJOR", "CONTRAINDICATED"];

export default function DrugInteractionsPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    drug1Name: "",
    drug2Name: "",
    severity: "MODERATE",
    description: "",
    recommendation: "",
    source: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/interactions", { credentials: "include" });
    const data = await res.json();
    setList(data.interactions || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    if (!confirm("Seed common Bangladesh drug interactions?")) return;
    setSeeding(true);
    const res = await fetch("/api/pharmacy/interactions/seed", { method: "POST", credentials: "include" });
    const data = await res.json();
    setSeeding(false);
    if (res.ok) {
      setMessage(`✅ Added ${data.created} interactions`);
      load();
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Failed to seed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ drug1Name: "", drug2Name: "", severity: "MODERATE", description: "", recommendation: "", source: "" });
      load();
    } else {
      const d = await res.json();
      setMessage(d.message || "Failed");
    }
  };

  const sevColor = (s: string) => {
    switch (s) {
      case "CONTRAINDICATED": return "bg-red-600 text-white";
      case "MAJOR": return "bg-red-100 text-red-700";
      case "MODERATE": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const filtered = list.filter((i) => {
    if (filter && i.severity !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.drug1Name.toLowerCase().includes(q) || i.drug2Name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Drug Interactions</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSeed} disabled={seeding}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            <Sparkles size={16} /> {seeding ? "Seeding..." : "Seed Common"}
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Manage drug-drug interactions. Warnings will appear when prescriptions contain these pairs.
      </p>

      {message && <p className="mb-3 text-center text-sm text-green-600">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drug name..."
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setFilter("")}
            className={`px-3 py-2 rounded-xl text-xs font-medium ${!filter ? "bg-blue-600 text-white" : "bg-white border border-slate-200"}`}>
            All
          </button>
          {SEVERITIES.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
                filter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No interactions found. Click "Seed Common" to add default library.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ix) => (
            <div key={ix.id} className="bg-white p-3 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-slate-800 text-sm">
                  {ix.drug1Name} <span className="text-slate-400">+</span> {ix.drug2Name}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sevColor(ix.severity)}`}>
                  {ix.severity}
                </span>
              </div>
              <div className="text-xs text-slate-600 mb-1">{ix.description}</div>
              {ix.recommendation && (
                <div className="text-[10px] text-blue-700 bg-blue-50 p-1.5 rounded">
                  💡 {ix.recommendation}
                </div>
              )}
              {ix.source && <div className="text-[10px] text-slate-400 mt-1">Source: {ix.source}</div>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Add Interaction</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <input required value={form.drug1Name} onChange={(e) => setForm({ ...form, drug1Name: e.target.value })}
                placeholder="Drug 1 name *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input required value={form.drug2Name} onChange={(e) => setForm({ ...form, drug2Name: e.target.value })}
                placeholder="Drug 2 name *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} placeholder="Description *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <textarea value={form.recommendation} onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
                rows={2} placeholder="Recommendation (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Source (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Add Interaction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

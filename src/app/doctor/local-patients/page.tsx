"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Users, Plus, Search, X, Phone, User, ChevronRight } from "lucide-react";

export default function LocalPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    bloodGroup: "",
    address: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const url = search ? `/api/doctor/local-patients?q=${encodeURIComponent(search)}` : "/api/doctor/local-patients";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setPatients(data.patients || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (user) load(); }, 300);
    return () => clearTimeout(timer);
  }, [user, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/doctor/local-patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...form,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", phone: "", age: "", gender: "", bloodGroup: "", address: "", notes: "" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };
// PART2

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Users className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">My Patients</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm" />
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : patients.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Users className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm mb-1">No patients yet.</p>
          <p className="text-xs text-slate-400 mb-3">Add walk-in patients to write prescriptions quickly.</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium">
            <Plus size={14} /> Add first patient
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {patients.map((p) => (
            <Link key={p.id} href={`/doctor/local-patients/${p.id}`}
              className="flex items-center gap-3 p-3 hover:bg-blue-50 transition">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-blue-600" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">{p.name}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {p.phone && <span className="flex items-center gap-1"><Phone size={10} /> {p.phone}</span>}
                  {p.age && <span>{p.age}y</span>}
                  {p.gender && <span>{p.gender}</span>}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {p._count?.prescriptions || 0} prescriptions • {p.totalVisits || 0} visits
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Add Patient</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number" type="tel"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="Age" type="number" min={0} max={150}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="">Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                <option value="">Blood group (optional)</option>
                <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
              </select>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Address" rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes (allergies, chronic conditions, etc.)" rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Add Patient"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

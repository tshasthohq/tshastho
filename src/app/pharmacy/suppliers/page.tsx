"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Phone, Mail, MapPin, Search, Edit, Trash2, Truck, User, ArrowLeft } from "lucide-react";
import Link from "next/link";


const COMPANIES = [
  "Square Pharmaceuticals", "Beximco Pharmaceuticals", "Incepta Pharmaceuticals", "Renata Limited", 
  "Eskayef Pharmaceuticals", "ACI Limited", "Acme Laboratories", "Healthcare Pharmaceuticals", 
  "Opsonin Pharma", "Beacon Pharmaceuticals", "Aristopharma", "Radiant Pharmaceuticals", 
  "General Pharmaceuticals", "Apex Pharmaceuticals", "Popular Pharmaceuticals", "Drug International", 
  "Sanofi Bangladesh", "GlaxoSmithKline (GSK)", "Novartis", "Sandoz", "Sun Pharma",
  "Eskayef", "Orion Pharma", "Bio-pharma", "Platinum Pharma", "Nuvista Pharma", "Pacific Pharmaceuticals",
  "Ziska Pharmaceuticals", "Pharmasia", "Medimet Pharmaceuticals", "Indo-Bangla Pharmaceuticals",
  "Kohinoor Chemical", "Jayson Pharmaceuticals", "Libra Pharmaceuticals", "Marksman Pharmaceuticals",
  "Modern Pharmaceuticals", "Navana Pharmaceuticals", "Nipa Pharmaceuticals", "Novo Healthcare",
  "Opso Saline", "Orion Infusion", "Paramount Pharmaceuticals", " Pharmik Laboratories",
  "Premier Pharmaceuticals", "Prime Pharmaceuticals", "Rangs Pharmaceuticals", "Reliance Pharmaceuticals",
  "Rephco Pharmaceuticals", "Rex Pharmaceuticals", "Rupsha Pharmaceuticals", "SALTLimited", 
  "Silva Pharmaceuticals", "Skylab Pharmaceuticals", "Somatec Pharmaceuticals", "Standard Pharmaceuticals",
  "Strahgen Pharmaceuticals", "Sun Pharmaceutical", "Supreme Pharmaceuticals", "Syntho Laboratories",
  "The White Horse Pharmaceuticals", "Time Pharmaceuticals", "UniMed UniHealth", "Unique Pharmaceuticals",
  "Veritas Pharmaceuticals", "Zenith Pharmaceuticals", "Zentara Pharma"
];

 export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  
  const [form, setForm] = useState({ name: "", companyName: "", phone: "", email: "", address: "", contactPerson: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pharmacy/suppliers", { credentials: "include" });
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const resetForm = () => {
    setForm({ name: "", companyName: "", phone: "", email: "", address: "", contactPerson: "", notes: "" });
    setEditing(null);
    setMessage("");
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name || "", companyName: s.companyName || "", phone: s.phone || "",
      email: s.email || "", address: s.address || "", contactPerson: s.contactPerson || "", notes: s.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const url = editing ? `/api/pharmacy/suppliers/${editing.id}` : "/api/pharmacy/suppliers";
    const method = editing ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false); resetForm(); load();
      } else {
        setMessage(data.message || "Failed to save supplier");
      }
    } catch (e) { setMessage("Network error"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    await fetch(`/api/pharmacy/suppliers/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const filtered = suppliers.filter(s => 
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pharmacy" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">Suppliers</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Manage your vendors</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all">
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-5 mt-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name or company..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm mt-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No suppliers found</h3>
            <p className="text-slate-500 text-sm">Add your first supplier to start creating purchase orders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {s.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{s.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{s.companyName || "Individual"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                  {s.contactPerson && <div className="flex items-center gap-2"><User size={14} className="text-slate-400"/> {s.contactPerson}</div>}
                  {s.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {s.phone}</div>}
                  {s.email && <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {s.email}</div>}
                  {s.address && <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400"/> {s.address}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <h2 className="font-bold text-lg text-slate-800">{editing ? "Edit Supplier" : "Add New Supplier"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Supplier Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="e.g. Beximco" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Company Name</label>
                <input 
                  list="company-list"
                  value={form.companyName} 
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" 
                  placeholder="Search or type company name..." 
                />
                <datalist id="company-list">
                  {COMPANIES.map((company, index) => (
                    <option key={`${company}-${index}`} value={company} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Phone *</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Contact Person</label>
                  <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="Name" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="supplier@example.com" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none resize-none" placeholder="Full address" />
              </div>
              {message && <div className="p-3 rounded-xl text-sm font-bold bg-red-50 text-red-700">{message}</div>}
              <button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20">
                {saving ? "Saving..." : (editing ? "Update Supplier" : "Create Supplier")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

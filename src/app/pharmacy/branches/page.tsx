"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { 
  Building2, Plus, X, MapPin, Phone, Star, ArrowLeft, RefreshCw 
} from "lucide-react";
import PharmacyNav from "@/components/pharmacy/PharmacyNav";

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [form, setForm] = useState({ 
    name: "", code: "", address: "", area: "", city: "", phone: "" 
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pharmacy/branches", { credentials: "include" });
      const data = await res.json();
      setBranches(data.branches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    
    try {
      const res = await fetch("/api/pharmacy/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", code: "", address: "", area: "", city: "", phone: "" });
        load();
      } else {
        setMessage(data.message || "Failed to create branch");
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      <PharmacyNav />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pharmacy" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Building2 className="text-indigo-600" size={20}/> Branches
            </h1>
          </div>
          <button 
            onClick={() => setShowForm(true)} 
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus size={16} /> Add Branch
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-5 mt-2">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No branches yet</h3>
            <p className="text-slate-500 text-sm mb-6">Add your first branch to start managing multi-location stock.</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
              <Plus size={16}/> Create First Branch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{b.name}</h3>
                      <p className="text-xs font-mono text-slate-500">{b.code}</p>
                    </div>
                  </div>
                  {b.isMainBranch && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      <Star size={12} /> Main
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{b.address} {b.area && `, ${b.area}`} {b.city && `, ${b.city}`}</span>
                  </div>
                  {b.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <h2 className="font-bold text-lg text-slate-800">Add New Branch</h2>
              <button onClick={() => setShowForm(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Branch Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dhanmondi Branch" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Branch Code *</label>
                  <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DHK-01" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Address *</label>
                <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full street address" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Area</label>
                  <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                    placeholder="e.g. Dhanmondi" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">City</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Dhaka" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01XXXXXXXXX" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>

              {message && <div className="p-3 rounded-xl text-sm font-bold bg-red-50 text-red-700 text-center">{message}</div>}

              <button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-2">
                {saving ? <RefreshCw className="animate-spin" size={18}/> : <Building2 size={18}/>} {saving ? "Creating..." : "Create Branch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

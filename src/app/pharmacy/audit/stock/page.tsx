"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, CheckCircle, AlertTriangle, RefreshCw, Box } from "lucide-react";
import Link from "next/link";

export default function PhysicalStockAuditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [actualStock, setActualStock] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/pharmacy/medicines", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" })
      .then(res => res.json())
      .then(data => setMedicines(data.medicines || []))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = medicines.filter(m => 
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.barcode === search
  );

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || actualStock === "") return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/pharmacy/audit/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          medicineId: selectedMed.id,
          actualStock: Number(actualStock),
          reason: reason || "Physical Stock Audit Adjustment"
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`✅ Stock Updated! Variance: ${data.variance > 0 ? '+' : ''}${data.variance}`);
        // রিফ্রেশ করে নতুন স্টক দেখানো
        const updatedMeds = medicines.map(m => m.id === selectedMed.id ? { ...m, stock: Number(actualStock) } : m);
        setMedicines(updatedMeds);
        setTimeout(() => { setSelectedMed(null); setActualStock(""); setReason(""); setMessage(""); }, 2000);
      } else {
        setMessage(data.message || "Failed to update");
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/pharmacy/audit" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Box className="text-indigo-600" size={20}/> Physical Stock Audit
          </h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-5 mt-2">
        {!selectedMed ? (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicine by name or scan barcode..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map(med => (
                <button 
                  key={med.id} 
                  onClick={() => { setSelectedMed(med); setActualStock(String(med.stock)); }}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left flex flex-col gap-1"
                >
                  <h3 className="font-bold text-slate-800">{med.name}</h3>
                  <p className="text-xs text-slate-500">{med.brand || med.genericName}</p>
                  <div className="mt-2 flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500">System Stock:</span>
                    <span className="font-bold text-indigo-600">{med.stock} {med.unit}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4 border-b pb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Box className="text-indigo-600" size={24} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">{selectedMed.name}</h2>
                <p className="text-xs text-slate-500">System Stock: {selectedMed.stock} {selectedMed.unit}</p>
              </div>
            </div>
            
            <form onSubmit={handleAuditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Actual Physical Stock *</label>
                <input 
                  type="number" required value={actualStock} onChange={(e) => setActualStock(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">Variance:</span>
                <span className={`font-bold ${Number(actualStock) - selectedMed.stock === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {Number(actualStock) - selectedMed.stock > 0 ? '+' : ''}{Number(actualStock) - selectedMed.stock}
                </span>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Reason / Notes (Optional)</label>
                <input 
                  value={reason} onChange={(e) => setReason(e.target.value)} 
                  placeholder="e.g. Found 2 extra, or 5 damaged during cleaning" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none" 
                />
              </div>

              {message && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">{message}</div>}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setSelectedMed(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> {saving ? "Saving..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

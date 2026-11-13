"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Trash2, Save, Building2, 
  ArrowRightLeft, Package, RefreshCw 
} from "lucide-react";
import Link from "next/link";
import PharmacyNav from "@/components/pharmacy/PharmacyNav";

export default function NewTransferPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [branches, setBranches] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    fromBranchId: "",
    toBranchId: "",
    reason: "",
    notes: ""
  });

  const [items, setItems] = useState<any[]>([
    { medicineId: "", quantity: 1 }
  ]);

  // 1. Load Branches
  useEffect(() => {
    if (!user) return;
    fetch('/api/pharmacy/branches', { credentials: "include" })
      .then(r => r.json())
      .then(b => {
        setBranches(b.branches || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  // 2. Load Medicines based on SELECTED SOURCE BRANCH
  useEffect(() => {
    if (!form.fromBranchId) {
      setMedicines([]);
      return;
    }
    
    setLoading(true);
    fetch('/api/pharmacy/medicines', { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      credentials: "include",
      body: JSON.stringify({ branchId: form.fromBranchId }) // 🔥 Passing Source Branch ID
    })
      .then(r => r.json())
      .then(m => {
        // ফিল্টার করে শুধু যেগুলোর স্টক ০ এর বেশি আছে সেগুলো দেখানো হচ্ছে
        const availableMedicines = (m.medicines || []).filter((med: any) => med.stock > 0);
        setMedicines(availableMedicines);
        
        // ব্রাঞ্চ চেঞ্জ হলে আগের সিলেক্ট করা মেডিসিন রিসেট করে দেওয়া
        setItems([{ medicineId: "", quantity: 1 }]); 
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [form.fromBranchId, user]);

  const addItem = () => setItems([...items, { medicineId: "", quantity: 1 }]);
  const removeItem = (idx: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };
  
  const updateItem = (idx: number, field: string, value: any) => {
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromBranchId || !form.toBranchId) {
      setMessage("Please select both Source and Destination branches");
      return;
    }
    if (form.fromBranchId === form.toBranchId) {
      setMessage("Source and Destination branches cannot be the same");
      return;
    }
    if (items.some(i => !i.medicineId || i.quantity <= 0)) {
      setMessage("Please select valid medicines and quantities");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/pharmacy/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, items }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/pharmacy/transfers");
      } else {
        setMessage(data.message || "Failed to create transfer");
      }
    } catch (err) {
      setMessage("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans text-slate-900">
      <PharmacyNav />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="font-bold text-slate-800 text-lg">New Transfer</h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-5 mt-2">
        
        {/* Branch Selection */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
            <ArrowRightLeft size={16}/> Transfer Route
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wider">From Branch (Source) *</label>
              <select 
                required value={form.fromBranchId} 
                onChange={(e) => setForm({ ...form, fromBranchId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">Select Source Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>

            {/* Arrow indicator for desktop */}
            <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 items-center justify-center top-6">
              <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm z-10">
                <ArrowRightLeft size={14} className="text-indigo-600 rotate-90 md:rotate-0"/>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wider">To Branch (Destination) *</label>
              <select 
                required value={form.toBranchId} 
                onChange={(e) => setForm({ ...form, toBranchId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">Select Destination Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Package size={16}/> Medicines to Transfer</h2>
            <button type="button" onClick={addItem} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Medicine</label>
                    <select 
                      required value={item.medicineId} 
                      onChange={(e) => updateItem(idx, "medicineId", e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Select medicine</option>
                      {medicines.map(m => <option key={m.id} value={m.id}>{m.name} (Stock: {m.stock})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Quantity</label>
                    <input 
                      type="number" min={1} required value={item.quantity} 
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wider">Reason (Optional)</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Stock rebalancing, Urgent requirement" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wider">Notes (Optional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2} placeholder="Additional instructions..." className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" />
          </div>
        </div>

        {message && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold text-center">{message}</div>}
      </form>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-end">
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50">
            {saving ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18}/>} 
            {saving ? "Creating..." : "Initiate Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/context/BranchContext";
import Link from "next/link";
import {
  Plus, FileText, Package, CheckCircle, Clock, XCircle,
  RefreshCw, ArrowLeft, Truck, MapPin, ShoppingCart, Building2
} from "lucide-react";
import PharmacyNav from "@/components/pharmacy/PharmacyNav";

export default function PurchasesPage() {
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [receiving, setReceiving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      let url = filter ? `/api/pharmacy/purchases?status=${filter}` : '/api/pharmacy/purchases';
      if (activeBranch?.id) {
        url += `${url.includes('?') ? '&' : '?'}branchId=${activeBranch.id}`;
      }
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user && activeBranch !== undefined) load(); }, [user, filter, activeBranch?.id]);

  const handleReceive = async (id: string) => {
    if (!confirm("Receive this purchase order? This will create batches and add stock.")) return;
    setReceiving(id);
    try {
      const res = await fetch(`/api/pharmacy/purchases/${id}/receive`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        load();
      } else {
        alert(data.message || "Failed to receive");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setReceiving(null);
    }
  };

  const handleMarkAsOrdered = async (id: string) => {
    if (!confirm("Mark this PO as ORDERED? Send it to supplier.")) return;
    try {
      const res = await fetch(`/api/pharmacy/purchases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'ORDERED' })
      });
      if (res.ok) load(); else alert("Failed to update");
    } catch (e) {
      alert("Network error");
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "RECEIVED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "ORDERED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "PARTIAL": return "bg-amber-100 text-amber-700 border-amber-200";
      case "DRAFT": return "bg-slate-100 text-slate-700 border-slate-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const TABS = ["", "DRAFT", "ORDERED", "RECEIVED", "CANCELLED"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <PharmacyNav />

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pharmacy" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="text-indigo-600" size={22} /> Purchase Orders
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage supplier orders & stock receiving</p>
            </div>
          </div>
          <Link href="/pharmacy/purchases/new" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all">
            <Plus size={16} /> New PO
          </Link>
        </div>

        {/* Filters */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto hide-scrollbar">
          {TABS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                filter === s
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {s || "ALL"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-2xl"></div>)}
          </div>
        ) : purchases.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm mt-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No purchase orders found</h3>
            <p className="text-slate-500 text-sm">Create a new PO to restock your inventory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base font-mono">{p.purchaseNumber}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Clock size={12} />
                      {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(p.status)}`}>
                    {p.status}
                  </span>
                </div>

                {/* Supplier & Branch Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Truck size={16} className="text-indigo-500 shrink-0" />
                    <span className="truncate">{p.supplier?.name || "Unknown Supplier"}</span>
                  </div>
                  {p.branch && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                      <Building2 size={16} className="text-indigo-500 shrink-0" />
                      <span className="truncate">Receive To: <strong className="text-indigo-700">{p.branch.name}</strong></span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Items</p>
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-1"><Package size={14}/> {p.items?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
                    <p className="font-bold text-indigo-600 text-sm">৳{Number(p.totalAmount).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Due</p>
                    <p className="font-bold text-red-500 text-sm">৳{Number(p.dueAmount).toFixed(2)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-2">
                  {p.status === "DRAFT" && (
                    <button onClick={() => handleMarkAsOrdered(p.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-500/20">
                      <CheckCircle size={16} /> Mark as Ordered
                    </button>
                  )}
                  {p.status === "ORDERED" && (
                    <button onClick={() => handleReceive(p.id)} disabled={receiving === p.id} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50">
                      {receiving === p.id ? <RefreshCw size={16} className="animate-spin" /> : <Package size={16} />}
                      {receiving === p.id ? "Receiving..." : "Receive & Add Stock"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

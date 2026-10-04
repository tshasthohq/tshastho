"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { RotateCcw, Plus, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

export default function ReturnsPage() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/pharmacy/returns?${params}`, { credentials: "include" });
    const data = await res.json();
    setReturns(data.returns || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, typeFilter, statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this return?")) return;
    const res = await fetch(`/api/pharmacy/returns/${id}/approve`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) load();
    else alert("Failed to approve");
  };

  const handleProcess = async (id: string) => {
    if (!confirm("Process this return? Stock and ledger will be updated.")) return;
    setProcessing(id);
    const res = await fetch(`/api/pharmacy/returns/${id}/process`, {
      method: "POST",
      credentials: "include",
    });
    setProcessing(null);
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.message || "Failed to process");
    }
  };

  const typeColor = (t: string) => {
    switch (t) {
      case "CUSTOMER_RETURN": return "bg-blue-100 text-blue-700";
      case "SUPPLIER_RETURN": return "bg-purple-100 text-purple-700";
      case "DAMAGE_WRITE_OFF": return "bg-red-100 text-red-700";
      case "EXPIRED_WRITE_OFF": return "bg-orange-100 text-orange-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "PROCESSED": return "bg-green-100 text-green-700";
      case "APPROVED": return "bg-blue-100 text-blue-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };
// CONTINUES

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Returns</h1>
        </div>
        <Link href="/pharmacy/returns/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New Return
        </Link>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {["", "CUSTOMER_RETURN", "SUPPLIER_RETURN", "DAMAGE_WRITE_OFF", "EXPIRED_WRITE_OFF"].map((t) => (
          <button key={t || "all"} onClick={() => setTypeFilter(t)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              typeFilter === t ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>
            {t ? t.replace(/_/g, " ") : "All Types"}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {["", "PENDING", "APPROVED", "PROCESSED"].map((s) => (
          <button key={s || "all"} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium ${
              statusFilter === s ? "bg-slate-800 text-white" : "bg-white border border-slate-200"
            }`}>
            {s || "All Status"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : returns.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No returns found.
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono text-xs text-slate-500">{r.returnNumber}</div>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColor(r.type)}`}>
                      {r.type.replace(/_/g, " ")}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.customerName && <div className="text-xs text-slate-600 mt-1">Customer: {r.customerName}</div>}
                  {r.supplier && <div className="text-xs text-slate-600 mt-1">Supplier: {r.supplier.name}</div>}
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">৳ {Number(r.totalAmount).toFixed(2)}</div>
                  {Number(r.refundAmount) > 0 && (
                    <div className="text-xs text-red-600">Refund: ৳ {Number(r.refundAmount).toFixed(2)}</div>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 mb-2">
                {r.items?.length || 0} items • {new Date(r.createdAt).toLocaleDateString()}
              </div>

              {r.status === "PENDING" && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(r.id)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Approve
                  </button>
                </div>
              )}
              {r.status === "APPROVED" && (
                <div className="flex gap-2">
                  <button onClick={() => handleProcess(r.id)} disabled={processing === r.id}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50">
                    {processing === r.id ? "Processing..." : (
                      <><CheckCircle size={14} /> Process (Update Stock)</>
                    )}
                  </button>
                </div>
              )}
              {r.status === "PROCESSED" && (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-600" />
                  Processed by {r.processedBy?.name || "—"} on {new Date(r.processedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

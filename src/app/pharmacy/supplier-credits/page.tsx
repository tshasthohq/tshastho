"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Receipt, Download, CheckCircle, XCircle, User, Calendar, DollarSign } from "lucide-react";

export default function SupplierCreditsPage() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, available: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [applyAmount, setApplyAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const url = statusFilter ? `/api/pharmacy/supplier-credits?status=${statusFilter}` : "/api/pharmacy/supplier-credits";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setCredits(data.credits || []);
    setSummary(data.summary || { total: 0, available: 0, count: 0 });
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, statusFilter]);

  const handleApply = async () => {
    if (!selected || applyAmount <= 0) return;
    setProcessing(true);
    setMessage("");
    const res = await fetch(`/api/pharmacy/supplier-credits/${selected.id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount: applyAmount }),
    });
    const data = await res.json();
    setProcessing(false);
    if (res.ok) {
      setSelected(null);
      setApplyAmount(0);
      setMessage("✅ Credit applied!");
      load();
      setTimeout(() => setMessage(""), 2000);
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const downloadCsv = () => {
    const rows = [["Credit #", "Supplier", "Date", "Amount", "Applied", "Balance", "Status"]];
    credits.forEach((c) => {
      rows.push([
        c.creditNumber,
        c.supplier?.name || "",
        new Date(c.issuedAt).toLocaleDateString(),
        Number(c.amount).toFixed(2),
        Number(c.appliedAmount).toFixed(2),
        Number(c.balance).toFixed(2),
        c.status,
      ]);
    });
    const csv = rows.map(r => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supplier-credits-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "APPLIED": return "bg-green-100 text-green-700";
      case "PARTIALLY_APPLIED": return "bg-amber-100 text-amber-700";
      case "VOIDED": return "bg-red-100 text-red-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Supplier Credits</h1>
        </div>
        {credits.length > 0 && (
          <button onClick={downloadCsv}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Download size={14} /> CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
          <div className="text-xs text-blue-700 mb-1">Total Issued</div>
          <div className="text-lg font-bold text-blue-700">৳{summary.total.toFixed(0)}</div>
        </div>
        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl">
          <div className="text-xs text-green-700 mb-1">Available</div>
          <div className="text-lg font-bold text-green-700">৳{summary.available.toFixed(0)}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {["", "ISSUED", "PARTIALLY_APPLIED", "APPLIED", "VOIDED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {message && <p className="mb-3 text-sm text-center text-green-600">{message}</p>}

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : credits.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Receipt className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-sm text-slate-500">No supplier credits yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Credits are auto-issued when a supplier return is processed.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {credits.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-slate-500 mb-1">{c.creditNumber}</div>
                  <div className="font-bold text-slate-800 truncate">
                    {c.supplier?.name}
                  </div>
                  {c.supplier?.companyName && (
                    <div className="text-xs text-slate-500">{c.supplier.companyName}</div>
                  )}
                  {c.returnOrder && (
                    <div className="text-xs text-blue-600 mt-0.5">
                      From return: {c.returnOrder.returnNumber}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${statusColor(c.status)}`}>
                  {c.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Amount</div>
                  <div className="font-bold text-slate-800">৳{Number(c.amount).toFixed(0)}</div>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg">
                  <div className="text-amber-700">Applied</div>
                  <div className="font-bold text-amber-700">৳{Number(c.appliedAmount).toFixed(0)}</div>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <div className="text-green-700">Balance</div>
                  <div className="font-bold text-green-700">৳{Number(c.balance).toFixed(0)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={9} /> {new Date(c.issuedAt).toLocaleDateString()}
                </span>
                <span>By: {c.issuedBy?.name || "System"}</span>
              </div>

              {(c.status === "ISSUED" || c.status === "PARTIALLY_APPLIED") && (
                <button onClick={() => { setSelected(c); setApplyAmount(Number(c.balance)); }}
                  className="w-full mt-3 bg-blue-600 text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                  <DollarSign size={12} /> Apply Credit
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold">Apply Credit</h2>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl text-sm">
                <div className="font-medium">{selected.supplier?.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-1">{selected.creditNumber}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <div className="text-xs text-green-700 mb-1">Available Balance</div>
                <div className="text-2xl font-bold text-green-700">৳{Number(selected.balance).toFixed(2)}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Apply Amount (৳)</label>
                <input type="number" min={1} max={Number(selected.balance)} step="0.01" value={applyAmount}
                  onChange={(e) => setApplyAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button onClick={handleApply} disabled={processing}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {processing ? "Applying..." : "Apply Credit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

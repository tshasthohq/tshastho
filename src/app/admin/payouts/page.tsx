"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Banknote, CheckCircle, XCircle, Eye, X, Clock, RefreshCw } from "lucide-react";

export default function AdminPayoutsPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("REQUESTED");
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/payouts?status=${filter}`, { credentials: "include" });
    const data = await res.json();
    setPayouts(data.payouts || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (id: string, action: string) => {
    if (action === "REJECT" && !rejectReason.trim()) {
      alert("Please provide rejection reason");
      return;
    }
    setProcessing(true);
    const res = await fetch(`/api/admin/payouts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, rejectionReason: rejectReason }),
    });
    setProcessing(false);
    if (res.ok) {
      setSelected(null);
      setRejectReason("");
      load();
    } else {
      const d = await res.json();
      alert(d.message || "Failed");
    }
  };

  const statusColor = (st: string) => {
    switch (st) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "APPROVED": return "bg-blue-100 text-blue-700";
      case "PROCESSING": return "bg-amber-100 text-amber-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Banknote className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Doctor Payouts</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {["REQUESTED", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              filter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : payouts.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No {filter.toLowerCase()} payouts.
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-mono text-xs text-slate-500">{p.payoutNumber}</div>
                  <div className="font-bold text-slate-800 mt-1">
                    Dr. {p.doctor?.user?.name}
                  </div>
                  <div className="text-xs text-slate-500">{p.doctor?.user?.email}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Amount</div>
                  <div className="font-bold text-slate-800">৳ {Number(p.amount).toFixed(0)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Method</div>
                  <div className="font-medium">{p.method}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Date</div>
                  <div className="font-medium">
                    {new Date(p.requestedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <button onClick={() => { setSelected(p); setRejectReason(""); }}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <Eye size={14} /> Review
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Payout Review</h2>
              <button onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl text-sm">
                <div className="font-medium">Dr. {selected.doctor?.user?.name}</div>
                <div className="text-xs text-slate-500">{selected.doctor?.user?.email}</div>
                <div className="text-xs text-slate-500">Phone: {selected.doctor?.user?.phone}</div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl">
                <div className="text-xs text-blue-700">Payout Amount</div>
                <div className="text-2xl font-bold text-blue-700">৳ {Number(selected.amount).toFixed(2)}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-sm">
                <div className="text-xs text-slate-500 mb-1">Method: {selected.method}</div>
                {selected.accountInfo && (
                  <div className="text-xs space-y-0.5 font-mono">
                    {selected.accountInfo.bkashNumber && <div>bKash: {selected.accountInfo.bkashNumber}</div>}
                    {selected.accountInfo.bankName && <div>Bank: {selected.accountInfo.bankName}</div>}
                    {selected.accountInfo.accountName && <div>Holder: {selected.accountInfo.accountName}</div>}
                    {selected.accountInfo.accountNumber && <div>Account: {selected.accountInfo.accountNumber}</div>}
                    {selected.accountInfo.branchName && <div>Branch: {selected.accountInfo.branchName}</div>}
                  </div>
                )}
              </div>

              {selected.notes && (
                <div className="text-xs text-slate-600 bg-amber-50 p-2 rounded-lg">
                  Note: {selected.notes}
                </div>
              )}

              {selected.status === "REQUESTED" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Rejection reason (if rejecting)
                    </label>
                    <textarea value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleAction(selected.id, "REJECT")} disabled={processing}
                      className="bg-red-50 text-red-600 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      <XCircle size={16} /> Reject
                    </button>
                    <button onClick={() => handleAction(selected.id, "APPROVE")} disabled={processing}
                      className="bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      <CheckCircle size={16} /> Approve
                    </button>
                  </div>
                </>
              )}

              {selected.status === "APPROVED" && (
                <button onClick={() => handleAction(selected.id, "PROCESSING")} disabled={processing}
                  className="w-full bg-amber-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                  Mark Processing
                </button>
              )}

              {selected.status === "PROCESSING" && (
                <button onClick={() => handleAction(selected.id, "COMPLETE")} disabled={processing}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  <CheckCircle size={16} /> Mark Completed (Money Sent)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

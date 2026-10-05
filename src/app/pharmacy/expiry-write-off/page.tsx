"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, CheckCircle, XCircle, Clock, Calendar, Pill } from "lucide-react";

export default function ExpiryWriteOffPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/expiry-write-off", { credentials: "include" });
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleAction = async (id: string, action: string) => {
    if (action === "COMPLETE" && !confirm("This will permanently write off the stock. Continue?")) return;
    setProcessing(id);
    await fetch("/api/pharmacy/expiry-write-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, action }),
    });
    setProcessing(null);
    load();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "APPROVED": return "bg-blue-100 text-blue-700";
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Trash2 className="text-red-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Expiry Write-off</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <p className="text-xs text-amber-800">
          <strong>{requests.length}</strong> expired batch{requests.length !== 1 ? "es" : ""} need write-off approval.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <CheckCircle className="mx-auto text-green-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No pending write-offs.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill size={12} className="text-blue-600" />
                    <span className="font-bold text-slate-800 truncate">{r.medicine?.name}</span>
                  </div>
                  <div className="text-xs text-slate-500">Batch: {r.batch?.batchNumber}</div>
                  <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <Calendar size={10} /> Expired: {new Date(r.batch?.expiryDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-slate-700 mt-1">Qty: <strong>{r.quantity}</strong></div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(r.status)}`}>
                  {r.status}
                </span>
              </div>

              {r.status === "PENDING" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => handleAction(r.id, "APPROVE")} disabled={processing === r.id}
                    className="bg-green-600 text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50">
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button onClick={() => handleAction(r.id, "REJECT")} disabled={processing === r.id}
                    className="bg-red-50 text-red-600 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50">
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              )}

              {r.status === "APPROVED" && (
                <button onClick={() => handleAction(r.id, "COMPLETE")} disabled={processing === r.id}
                  className="w-full bg-red-600 text-white py-2 rounded-xl text-xs font-medium mt-2 flex items-center justify-center gap-1 disabled:opacity-50">
                  <Trash2 size={12} /> Complete Write-off
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

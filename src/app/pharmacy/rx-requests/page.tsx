"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { FileText, CheckCircle, XCircle, User, Pill, Eye, X, ShoppingCart } from "lucide-react";

export default function PharmacyRxRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/pharmacy/rx-requests?status=${filter}`, { credentials: "include" });
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filter]);

  const handleAction = async (id: string, action: string) => {
    if (action === "REJECT" && !rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setProcessing(true);
    const res = await fetch(`/api/pharmacy/rx-requests/${id}`, {
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
    } else alert("Failed");
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "PENDING": return "bg-amber-100 text-amber-700";
      case "ACCEPTED": return "bg-blue-100 text-blue-700";
      case "CONVERTED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "CANCELLED": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Rx Requests</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["PENDING", "ACCEPTED", "CONVERTED", "REJECTED"].map((s) => (
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
      ) : requests.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <FileText className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No {filter.toLowerCase()} requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-slate-500 mb-1">{r.requestNumber}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-800">{r.patient?.name}</span>
                  </div>
                  <div className="text-xs text-slate-500">{r.patient?.phone || r.patient?.email}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColor(r.status)}`}>
                  {r.status}
                </span>
              </div>

              {r.prescription && (
                <div className="text-xs text-slate-600 mb-2">
                  {r.prescription.items?.length || 0} medicines • {r.prescription.diagnosis || "No diagnosis"}
                </div>
              )}

              <button onClick={() => { setSelected(r); setRejectReason(""); }}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                <Eye size={12} /> Review
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Rx Request</h2>
              <button onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl text-sm">
                <div className="font-medium">{selected.patient?.name}</div>
                <div className="text-xs text-slate-500">{selected.patient?.phone}</div>
              </div>

              {selected.prescription?.items?.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-600 mb-1">Medicines</div>
                  <div className="space-y-1">
                    {selected.prescription.items.map((item: any) => (
                      <div key={item.id} className="bg-slate-50 p-2 rounded-lg text-xs">
                        <div className="font-medium text-slate-800">
                          {item.medicineName} {item.strength && `— ${item.strength}`}
                        </div>
                        <div className="text-slate-500">
                          {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" • ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.notes && (
                <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded-lg">
                  Note: {selected.notes}
                </div>
              )}

              {selected.status === "PENDING" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Rejection reason (if rejecting)
                    </label>
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleAction(selected.id, "REJECT")} disabled={processing}
                      className="bg-red-50 text-red-600 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      <XCircle size={16} /> Reject
                    </button>
                    <button onClick={() => handleAction(selected.id, "ACCEPT")} disabled={processing}
                      className="bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      <CheckCircle size={16} /> Accept
                    </button>
                  </div>
                </>
              )}

              {selected.status === "ACCEPTED" && (
                <Link href="/pharmacy/pos"
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                  <ShoppingCart size={16} /> Create Sale in POS
                </Link>
              )}

              {selected.rejectionReason && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  Reason: {selected.rejectionReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FileText, CheckCircle, XCircle, Eye, X, Clock, User, Phone } from "lucide-react";

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "VERIFIED" | "REJECTED">("PENDING");
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/pharmacy/prescriptions?status=${filter}`, { credentials: "include" });
    const data = await res.json();
    setPrescriptions(data.prescriptions || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filter]);

  const handleAction = async (id: string, action: "VERIFY" | "REJECT") => {
    if (action === "REJECT" && !rejectReason.trim()) {
      setMessage("Please provide a rejection reason");
      return;
    }
    setProcessing(true);
    setMessage("");
    const res = await fetch(`/api/pharmacy/prescriptions/${id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, rejectionReason: rejectReason }),
    });
    const data = await res.json();
    setProcessing(false);
    if (res.ok) {
      setSelected(null);
      setRejectReason("");
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };
// CONTINUES

  const statusColor = (s: string) => {
    switch (s) {
      case "VERIFIED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "EXPIRED": return "bg-slate-100 text-slate-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Prescriptions</h1>
      </div>

      <div className="flex gap-2 mb-4">
        {(["PENDING", "VERIFIED", "REJECTED"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              filter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No {filter.toLowerCase()} prescriptions.
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-800">{p.patient?.name || "Unknown"}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone size={12} /> {p.patient?.phone || p.patient?.email}
                  </div>
                  {p.doctorName && (
                    <div className="text-xs text-slate-500 mt-0.5">Dr. {p.doctorName}</div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                  {p.status}
                </span>
              </div>

              {p.items?.length > 0 && (
                <div className="text-xs text-slate-600 mb-2">
                  {p.items.length} medicine{p.items.length > 1 ? "s" : ""}
                </div>
              )}

              <button onClick={() => { setSelected(p); setRejectReason(""); setMessage(""); }}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-medium">
                <Eye size={14} /> Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Prescription Review</h2>
              <button onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Patient Info */}
              <div className="bg-slate-50 p-3 rounded-xl text-sm">
                <div className="font-medium text-slate-800">{selected.patient?.name}</div>
                <div className="text-xs text-slate-500">{selected.patient?.phone} • {selected.patient?.email}</div>
              </div>

              {/* Image */}
              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">Prescription Image</div>
                <img src={selected.imageUrl} alt="Prescription"
                  className="w-full rounded-xl border border-slate-200 max-h-80 object-contain bg-slate-50" />
              </div>

              {/* Details */}
              {(selected.doctorName || selected.hospitalName || selected.diagnosis) && (
                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                  {selected.doctorName && <div><span className="text-slate-500">Doctor:</span> {selected.doctorName}</div>}
                  {selected.hospitalName && <div><span className="text-slate-500">Hospital:</span> {selected.hospitalName}</div>}
                  {selected.diagnosis && <div><span className="text-slate-500">Diagnosis:</span> {selected.diagnosis}</div>}
                </div>
              )}

              {/* Items */}
              {selected.items?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-600 mb-1">Medicines</div>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs">
                    {selected.items.map((it: any) => (
                      <div key={it.id} className="border-b border-slate-200 last:border-0 pb-1.5 last:pb-0">
                        <div className="font-medium text-slate-800">{it.medicineName} {it.strength}</div>
                        <div className="text-slate-500">
                          {[it.dosage, it.frequency, it.duration].filter(Boolean).join(" • ")}
                          {it.quantity && ` • Qty: ${it.quantity}`}
                        </div>
                        {it.instructions && <div className="text-slate-400 italic">{it.instructions}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {message && <p className="text-sm text-red-600">{message}</p>}

              {selected.status === "PENDING" ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Rejection Reason (required if rejecting)
                    </label>
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      rows={2} placeholder="e.g. Unclear image, invalid prescription..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleAction(selected.id, "REJECT")} disabled={processing}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-medium disabled:opacity-50">
                      <XCircle size={16} /> Reject
                    </button>
                    <button onClick={() => handleAction(selected.id, "VERIFY")} disabled={processing}
                      className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                      <CheckCircle size={16} /> Verify
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl text-xs">
                  <div className="text-slate-500">Verified by {selected.verifiedBy?.name || "—"}</div>
                  {selected.rejectionReason && (
                    <div className="text-red-600 mt-1">Reason: {selected.rejectionReason}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

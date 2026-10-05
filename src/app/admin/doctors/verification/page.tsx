"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Shield, Eye, CheckCircle, XCircle, X, FileText } from "lucide-react";

export default function AdminDoctorVerificationPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/doctor-documents?status=${filter}`, { credentials: "include" });
    const data = await res.json();
    setDocs(data.documents || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (id: string, action: string) => {
    if (action === "REJECT" && !rejectReason.trim()) {
      alert("Please provide rejection reason");
      return;
    }
    setProcessing(true);
    const res = await fetch(`/api/admin/doctor-documents/${id}/verify`, {
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
// PART2

  const statusColor = (s: string) => {
    switch (s) {
      case "VERIFIED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "UNDER_REVIEW": return "bg-blue-100 text-blue-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Doctor Document Verification</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"].map((s) => (
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
      ) : docs.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">No documents.</div>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm font-medium">Dr. {d.doctor?.user?.name}</div>
                  <div className="text-xs text-slate-500">{d.doctor?.user?.email}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {d.type} {d.title ? `• ${d.title}` : ""}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(d.status)}`}>
                  {d.status}
                </span>
              </div>
              <button onClick={() => { setSelected(d); setRejectReason(""); }}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <Eye size={14} /> Review
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Document Review</h2>
              <button onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl text-sm">
                <div className="font-medium">{selected.doctor?.user?.name}</div>
                <div className="text-xs text-slate-500">{selected.doctor?.user?.email}</div>
                <div className="text-xs text-slate-500 mt-1">License: {selected.doctor?.licenseNumber}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">{selected.type} Document</div>
                {selected.fileUrl?.endsWith(".pdf") ? (
                  <a href={selected.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl text-blue-700">
                    <FileText size={18} /> Open PDF
                  </a>
                ) : (
                  <img src={selected.fileUrl} alt="Doc" className="w-full rounded-xl border border-slate-200 max-h-80 object-contain bg-slate-50" />
                )}
              </div>

              {selected.status === "PENDING" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Rejection reason (if rejecting)</label>
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleAction(selected.id, "REJECT")} disabled={processing}
                      className="bg-red-50 text-red-600 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      <XCircle size={16} /> Reject
                    </button>
                    <button onClick={() => handleAction(selected.id, "VERIFY")} disabled={processing}
                      className="bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      <CheckCircle size={16} /> Verify
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

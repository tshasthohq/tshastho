"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { UserPlus, Plus, X, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";

export default function ReferralsPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dir, setDir] = useState<"sent" | "received">("sent");
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/doctor/referrals?dir=${dir}`, { credentials: "include" });
    const data = await res.json();
    setCases(data.cases || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, dir]);

  const handleAction = async () => {
    if (!selected) return;
    setProcessing(true);
    const body: any = { action };
    if (action === "COMPLETE") body.consultingNotes = notes;
    if (action === "DECLINE") body.declinedReason = reason;

    const res = await fetch(`/api/doctor/referrals/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    setProcessing(false);
    if (res.ok) { setSelected(null); setNotes(""); setReason(""); setAction(""); load(); }
    else alert("Failed");
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "PENDING": return "bg-amber-100 text-amber-700";
      case "ACCEPTED": return "bg-blue-100 text-blue-700";
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "DECLINED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "EMERGENCY": return "bg-red-100 text-red-700";
      case "URGENT": return "bg-orange-100 text-orange-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Doctor Referrals</h1>
        </div>
        <Link href="/doctor/referrals/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setDir("sent")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            dir === "sent" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>Sent</button>
        <button onClick={() => setDir("received")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            dir === "received" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>Received</button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : cases.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <UserPlus className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No {dir} referrals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-slate-500 mb-1">{c.caseNumber}</div>
                  <div className="text-sm font-bold text-slate-800 truncate">
                    {dir === "sent" ? `To: Dr. ${c.consultingDoctor?.user?.name || "—"}` : `From: Dr. ${c.referringDoctor?.user?.name}`}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    Patient: {c.patient?.name || "—"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(c.status)}`}>
                    {c.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityColor(c.priority)}`}>
                    {c.priority}
                  </span>
                </div>
              </div>

              {c.reason && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mb-2 line-clamp-2">
                  {c.reason}
                </div>
              )}

              <div className="text-[10px] text-slate-400 mb-2">
                {new Date(c.createdAt).toLocaleString()}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {dir === "received" && c.status === "PENDING" && (
                  <>
                    <button onClick={() => { setSelected(c); setAction("ACCEPT"); }}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                      <CheckCircle size={12} /> Accept
                    </button>
                    <button onClick={() => { setSelected(c); setAction("DECLINE"); }}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                      <XCircle size={12} /> Decline
                    </button>
                  </>
                )}
                {dir === "received" && c.status === "ACCEPTED" && (
                  <button onClick={() => { setSelected(c); setAction("COMPLETE"); }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-medium">
                    Mark Completed
                  </button>
                )}
                {dir === "sent" && ["PENDING", "ACCEPTED"].includes(c.status) && (
                  <button onClick={() => { setSelected(c); setAction("CANCEL"); }}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-medium">
                    Cancel
                  </button>
                )}
              </div>

              {c.consultingNotes && c.status === "COMPLETED" && (
                <div className="mt-3 bg-green-50 p-2 rounded-lg text-xs text-green-800">
                  <strong>Notes:</strong> {c.consultingNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">{action === "ACCEPT" && "Accept Referral"}
                {action === "DECLINE" && "Decline Referral"}
                {action === "COMPLETE" && "Complete Referral"}
                {action === "CANCEL" && "Cancel Referral"}</h2>
              <button onClick={() => { setSelected(null); setAction(""); }}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              {action === "DECLINE" && (
                <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                  rows={3} placeholder="Reason for declining *"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              )}
              {action === "COMPLETE" && (
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={5} placeholder="Consulting notes (findings, advice, treatment)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              )}
              {action === "ACCEPT" && (
                <p className="text-sm text-slate-600">Accept this referral case?</p>
              )}
              {action === "CANCEL" && (
                <p className="text-sm text-slate-600">Cancel this referral?</p>
              )}
              <button onClick={handleAction} disabled={processing}
                className={`w-full py-3 rounded-xl font-medium disabled:opacity-50 ${
                  action === "DECLINE" || action === "CANCEL" ? "bg-red-600 text-white" : "bg-green-600 text-white"
                }`}>
                {processing ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

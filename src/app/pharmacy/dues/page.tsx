"use client";
import PermissionGuard from "@/components/staff/PermissionGuard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, Phone, User, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function PharmacyDuesPageInner() {
  const router = useRouter();
  const [dues, setDues] = useState<any[]>([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("UNPAID");
  const [showPayModal, setShowPayModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");

  const loadDues = () => {
    const email = localStorage.getItem("userEmail");
    if (!email) { setLoading(false); return; }

    fetch("/api/pharmacy/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.dues) setDues(data.dues);
      if (data.totalUnpaid !== undefined) setTotalUnpaid(data.totalUnpaid);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  useEffect(() => { loadDues(); }, []);

  const handlePay = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;

    await fetch("/api/pharmacy/dues/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueId: showPayModal.id, amount: payAmount }),
    });

    setShowPayModal(null);
    setPayAmount("");
    loadDues();
  };

  const filtered = dues.filter(d => {
    if (filter === "UNPAID") return d.status !== "PAID";
    if (filter === "PAID") return d.status === "PAID";
    return true;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">Customer Dues</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-2xl p-5 mb-6">
          <p className="text-sm text-red-100 mb-1">Total Outstanding Due</p>
          <p className="text-3xl font-bold">৳{totalUnpaid.toFixed(2)}</p>
          <p className="text-xs text-red-100 mt-2">{dues.filter(d => d.status !== "PAID").length} customer{dues.filter(d => d.status !== "PAID").length !== 1 ? "s" : ""} owe you</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "UNPAID", label: "Unpaid" },
            { key: "PAID", label: "Paid" },
            { key: "ALL", label: "All" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium ${filter === f.key ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
            <DollarSign size={64} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">No dues found</h2>
            <p className="text-sm text-slate-500">When customers buy on credit, they will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(due => {
              const remaining = parseFloat(due.amount.toString()) - parseFloat(due.paidAmount.toString());
              return (
                <div key={due.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${due.status === "PAID" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                        {due.status === "PAID" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{due.patientName}</p>
                        <a href={`tel:${due.patientPhone}`} className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone size={10} /> {due.patientPhone}
                        </a>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(due.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm ${due.status === "PAID" ? "text-green-600 line-through" : "text-red-600"}`}>
                        ৳{parseFloat(due.amount.toString()).toFixed(2)}
                      </p>
                      {due.status !== "PAID" && (
                        <p className="text-xs text-slate-500">Due: ৳{remaining.toFixed(2)}</p>
                      )}
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        due.status === "PAID" ? "bg-green-100 text-green-600" :
                        due.status === "PARTIAL" ? "bg-yellow-100 text-yellow-600" :
                        "bg-red-100 text-red-600"
                      }`}>{due.status}</span>
                    </div>
                  </div>

                  {due.note && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mb-3">{due.note}</p>
                  )}

                  {due.status !== "PAID" && (
                    <Button onClick={() => { setShowPayModal(due); setPayAmount(remaining.toString()); }} className="w-full" size="sm">
                      <Plus size={14} className="mr-1" /> Record Payment
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <h2 className="font-bold text-slate-800 mb-3">Record Payment</h2>
            <p className="text-sm text-slate-600 mb-1">Customer: <strong>{showPayModal.patientName}</strong></p>
            <p className="text-sm text-slate-600 mb-4">
              Remaining: <strong className="text-red-600">৳{(parseFloat(showPayModal.amount.toString()) - parseFloat(showPayModal.paidAmount.toString())).toFixed(2)}</strong>
            </p>

            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Amount (৳)</label>
            <Input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0.00"
            />

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowPayModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handlePay} className="flex-1">Record Payment</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// WRAPPED WITH PERMISSION GUARD
export default function PharmacyDuesPage() {
  return (
    <PermissionGuard permission={"view_dues"}>
      <PharmacyDuesPageInner />
    </PermissionGuard>
  );
}

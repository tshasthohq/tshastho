"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, DollarSign, Calculator, Plus, Wallet, TrendingUp, Calendar, CheckCircle, Clock, Loader2, X, Save, Receipt, HandCoins, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function StaffDetailPage() {
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();
  const params = useParams();
  const staffId = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [advanceModal, setAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ amount: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    attendanceAmount: "",
    commissionAmount: "",
    bonus: "",
    deduction: "",
    advanceDeducted: "",
    netPayable: "",
    paidAmount: "",
    paymentMethod: "CASH",
    note: "",
  });
  const [saveMode, setSaveMode] = useState<"save" | "pay">("save");
  const [message, setMessage] = useState("");

  const loadData = () => {
    const email = user?.email;
    if (!email) { router.push("/login"); return; }

    fetch("/api/pharmacy/staff/salary-calc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, staffId, month }),
    })
    .then(res => res.json())
    .then(d => {
      if (d.staff) { setData(d); initEditForm(d); }
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  const initEditForm = (d: any) => {
    setEditForm({
      attendanceAmount: d.attendanceAmount.toFixed(2),
      commissionAmount: d.commissionAmount.toFixed(2),
      bonus: "0",
      deduction: "0",
      advanceDeducted: d.totalAdvance.toFixed(2),
      netPayable: d.netPayable.toFixed(2),
      paidAmount: d.netPayable.toFixed(2),
      paymentMethod: "CASH",
      note: "",
    });
  };

  // Recalc net payable when any field changes
  const recalcNetPayable = () => {
    const att = parseFloat(editForm.attendanceAmount) || 0;
    const comm = parseFloat(editForm.commissionAmount) || 0;
    const bon = parseFloat(editForm.bonus) || 0;
    const ded = parseFloat(editForm.deduction) || 0;
    const adv = parseFloat(editForm.advanceDeducted) || 0;
    const net = Math.max(0, att + comm + bon - ded - adv);
    setEditForm(prev => ({ ...prev, netPayable: net.toFixed(2), paidAmount: net.toFixed(2) }));
  };

  const handleSaveSalary = async () => {
    setSaving(true);
    setMessage("");
    const email = user?.email;

    const isCustomized = 
      parseFloat(editForm.attendanceAmount) !== data.attendanceAmount ||
      parseFloat(editForm.commissionAmount) !== data.commissionAmount ||
      parseFloat(editForm.bonus) > 0 ||
      parseFloat(editForm.deduction) > 0;

    const payload = {
      email,
      staffId,
      month,
      basicSalary: data.staff.basicSalary,
      presentDays: data.presentDays,
      totalDays: data.totalDays,
      attendanceAmount: data.attendanceAmount,
      commissionAmount: data.commissionAmount,
      bonus: editForm.bonus,
      deduction: editForm.deduction,
      advanceDeducted: editForm.advanceDeducted,
      netPayable: editForm.netPayable,
      paidAmount: saveMode === "pay" ? editForm.paidAmount : 0,
      paymentMethod: editForm.paymentMethod,
      note: editForm.note,
      customAttendanceAmount: parseFloat(editForm.attendanceAmount) !== data.attendanceAmount ? editForm.attendanceAmount : null,
      customCommissionAmount: parseFloat(editForm.commissionAmount) !== data.commissionAmount ? editForm.commissionAmount : null,
      customDeduction: parseFloat(editForm.deduction) > 0 ? editForm.deduction : null,
      customNetPayable: parseFloat(editForm.netPayable) !== data.netPayable ? editForm.netPayable : null,
      isCustomized,
      editNote: editForm.note,
      workingDaysThisMonth: data.staff.workingDaysPerMonth,
      hoursPerDayUsed: data.staff.hoursPerDay,
    };

    const res = await fetch("/api/pharmacy/staff/salary-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resp = await res.json();
    if (res.ok) {
      setMessage(saveMode === "pay" ? "✅ Salary paid & saved!" : "✅ Salary saved (not paid yet)");
      setIsEditing(false);
      loadData();
    } else {
      setMessage(resp.message || "Failed");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  useEffect(() => { loadData(); }, [month, staffId]);

  const handleAddAdvance = async () => {
    if (!advanceForm.amount || parseFloat(advanceForm.amount) <= 0) {
      setMessage("Enter valid amount");
      return;
    }
    setSaving(true);
    const email = user?.email;
    const res = await fetch("/api/pharmacy/staff/advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, staffId, amount: advanceForm.amount, reason: advanceForm.reason }),
    });
    if (res.ok) {
      setMessage("✅ Advance added!");
      setAdvanceModal(false);
      setAdvanceForm({ amount: "", reason: "" });
      loadData();
      setTimeout(() => setMessage(""), 2500);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-center text-slate-500 flex items-center justify-center min-h-screen"><Loader2 size={32} className="animate-spin text-blue-600" /></div>;
  if (!data) return <div className="p-6 text-center text-slate-500">Data not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">Staff Salary</h1>
          <button onClick={() => router.push(`/pharmacy/staff/${staffId}/history`)} className="flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-lg">
            <FileText size={14} /> History
          </button>
        <div className="w-6"></div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* Staff Header */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
              {data.staff.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{data.staff.name}</h2>
              <p className="text-xs text-purple-200">{data.staff.staffRole}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-[10px] text-purple-100">Basic</p>
              <p className="font-bold">৳{data.staff.basicSalary.toFixed(0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-[10px] text-purple-100">Daily</p>
              <p className="font-bold">৳{data.staff.dailyRate.toFixed(0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-[10px] text-purple-100">Commission</p>
              <p className="font-bold">{data.staff.commissionPercent}%</p>
            </div>
          </div>
        </div>

        {/* Month Picker */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Calendar size={14} /> Select Month for Salary Calculation
          </label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>

        {/* Attendance Summary */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Clock size={14} /> Attendance ({data.month})
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 p-3 rounded-xl">
              <p className="text-xs text-green-700">Present</p>
              <p className="text-xl font-bold text-green-700">{data.presentDays}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl">
              <p className="text-xs text-orange-700">Late</p>
              <p className="text-xl font-bold text-orange-700">{data.lateDays}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <p className="text-xs text-slate-600">Total Days</p>
              <p className="text-xl font-bold text-slate-700">{data.totalDays}</p>
            </div>
          </div>
        </div>

        {/* Salary Calculation */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <Calculator size={14} /> Salary Calculation
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Attendance Amount ({data.presentDays} days)</span>
              <span className="font-bold text-slate-800">৳{data.attendanceAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="text-sm text-slate-600">Commission ({data.staff.commissionPercent}%)</span>
                <p className="text-[10px] text-slate-400">{data.orderCount} orders • ৳{data.commissionBase.toFixed(0)} sales</p>
              </div>
              <span className="font-bold text-purple-700">৳{data.commissionAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b-2 border-slate-300">
              <span className="text-sm font-bold text-slate-800">Gross Salary</span>
              <span className="font-bold text-green-700 text-lg">৳{data.grossSalary.toFixed(2)}</span>
            </div>

            {data.totalAdvance > 0 && (
              <div className="flex justify-between items-center pb-3 border-b border-red-100">
                <div>
                  <span className="text-sm text-red-600">Advance Deduction</span>
                  <p className="text-[10px] text-red-400">{data.advances} pending advance{data.advances > 1 ? "s" : ""}</p>
                </div>
                <span className="font-bold text-red-600">− ৳{data.totalAdvance.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-bold text-slate-800">Net Payable</span>
              <span className="text-2xl font-bold text-green-700">৳{data.netPayable.toFixed(2)}</span>
            </div>
          </div>

          {data.existingPayment && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <p className="text-xs text-green-700 font-medium">
                Salary already paid for {data.month} — ৳{parseFloat(data.existingPayment.paidAmount.toString()).toFixed(2)}
              </p>
            </div>
          )}
        </div>

                {/* ===== Edit / Save Salary ===== */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Wallet size={14} /> Payment / Save Salary
            </h3>
            {!isEditing && (
              <button onClick={() => { initEditForm(data); setIsEditing(true); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold">
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Attendance Amount</label>
                  <Input type="number" value={editForm.attendanceAmount}
                    onChange={(e) => { setEditForm({ ...editForm, attendanceAmount: e.target.value }); setTimeout(recalcNetPayable, 0); }} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Commission</label>
                  <Input type="number" value={editForm.commissionAmount}
                    onChange={(e) => { setEditForm({ ...editForm, commissionAmount: e.target.value }); setTimeout(recalcNetPayable, 0); }} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Bonus</label>
                  <Input type="number" value={editForm.bonus} placeholder="0"
                    onChange={(e) => { setEditForm({ ...editForm, bonus: e.target.value }); setTimeout(recalcNetPayable, 0); }} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Deduction</label>
                  <Input type="number" value={editForm.deduction} placeholder="0"
                    onChange={(e) => { setEditForm({ ...editForm, deduction: e.target.value }); setTimeout(recalcNetPayable, 0); }} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Advance Deduct</label>
                  <Input type="number" value={editForm.advanceDeducted}
                    onChange={(e) => { setEditForm({ ...editForm, advanceDeducted: e.target.value }); setTimeout(recalcNetPayable, 0); }} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Net Payable</label>
                  <Input type="number" value={editForm.netPayable} readOnly className="bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Note (optional)</label>
                <Input value={editForm.note} placeholder="e.g., Bonus for Eid"
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Paid Amount</label>
                    <Input type="number" value={editForm.paidAmount}
                      onChange={(e) => setEditForm({ ...editForm, paidAmount: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Method</label>
                    <select value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                      className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm">
                      <option value="CASH">Cash</option>
                      <option value="BKASH">bKash</option>
                      <option value="NAGAD">Nagad</option>
                      <option value="ROCKET">Rocket</option>
                      <option value="BANK">Bank</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>
                <Button onClick={() => { setSaveMode("pay"); handleSaveSalary(); }} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <CheckCircle size={14} className="mr-2" />}
                  Mark as Paid
                </Button>
              </div>
              <Button variant="outline" onClick={() => { setSaveMode("save"); handleSaveSalary(); }} disabled={saving} className="w-full">
                <Save size={14} className="mr-2" /> Save (Draft, not paid)
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span className={"font-bold " + (data.existingPayment?.status === "PAID" ? "text-green-600" : "text-orange-600")}>
                  {data.existingPayment?.status || "NOT SAVED"}
                </span>
              </div>
              {data.existingPayment && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Paid Amount</span>
                    <span className="font-bold">৳{parseFloat(data.existingPayment.paidAmount?.toString() || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Method</span>
                    <span className="font-medium">{data.existingPayment.paymentMethod || "CASH"}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

{/* Advance Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <HandCoins size={14} className="text-red-600" /> Advances / Loans
            </h3>
            <button onClick={() => setAdvanceModal(true)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
              <Plus size={12} /> Add Advance
            </button>
          </div>
          <p className="text-xs text-slate-500">Add new advance or loan for this staff. It will be auto-deducted from monthly salary.</p>
        </div>

        {message && (
          <p className={"text-center text-sm font-medium " + (message.includes("✅") ? "text-green-600" : "text-red-500")}>{message}</p>
        )}
      </div>

      {/* Advance Modal */}
      {advanceModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Add Advance</h2>
              <button onClick={() => setAdvanceModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Amount (৳) *</label>
                <Input type="number" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })} placeholder="e.g., 2000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason (Optional)</label>
                <Input value={advanceForm.reason} onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })} placeholder="e.g., Emergency" />
              </div>
              <Button onClick={handleAddAdvance} disabled={saving} className="w-full">
                <Save size={16} className="mr-2" /> {saving ? "Adding..." : "Add Advance"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

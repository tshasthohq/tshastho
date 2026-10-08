"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, Plus, X, CheckCircle, Clock, DollarSign, User } from "lucide-react";

export default function PayrollPage() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const [form, setForm] = useState({
    basicSalary: 0,
    presentDays: 0,
    commissionAmount: 0,
    bonus: 0,
    overtime: 0,
    deductions: 0,
    advanceDeducted: 0,
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      fetch(`/api/pharmacy/payroll?month=${month}`, { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/staff/list", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]);
    setPayrolls(pRes.payrolls || []);
    setStaff(sRes.staff || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, month]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) { setMessage("Select staff"); return; }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        staffId: selectedStaff.id,
        month,
        ...form,
        basicSalary: form.basicSalary || Number(selectedStaff.basicSalary || 0),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setSelectedStaff(null);
      setForm({ basicSalary: 0, presentDays: 0, commissionAmount: 0, bonus: 0, overtime: 0, deductions: 0, advanceDeducted: 0, notes: "" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const handleAction = async (id: string, action: string) => {
    setProcessing(id);
    await fetch(`/api/pharmacy/payroll/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action }),
    });
    setProcessing(null);
    load();
  };

  const totalPayout = payrolls.reduce((s, p) => s + Number(p.netPayable), 0);
  const totalPaid = payrolls.filter(p => p.status === "PAID").reduce((s, p) => s + Number(p.paidAmount || 0), 0);

  const statusColor = (s: string) => {
    switch (s) {
      case "PAID": return "bg-green-100 text-green-700";
      case "APPROVED": return "bg-blue-100 text-blue-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };
// PART2

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Payroll</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Generate
        </button>
      </div>

      <div className="mb-4">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Total Payout</div>
          <div className="text-lg font-bold text-slate-800">৳ {totalPayout.toFixed(0)}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
          <div className="text-xs text-green-700 mb-1">Total Paid</div>
          <div className="text-lg font-bold text-green-700">৳ {totalPaid.toFixed(0)}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : payrolls.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No payroll entries for this month.
        </div>
      ) : (
        <div className="space-y-2">
          {payrolls.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{p.staff?.name}</div>
                    <div className="text-xs text-slate-500">{p.staff?.staffRole || p.staff?.email}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(p.status)}`}>
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Basic</div>
                  <div className="font-bold">৳{Number(p.earnedBasic).toFixed(0)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Present</div>
                  <div className="font-bold">{p.presentDays}/{p.workingDays}</div>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <div className="text-green-700">Net</div>
                  <div className="font-bold text-green-700">৳{Number(p.netPayable).toFixed(0)}</div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {p.status === "DRAFT" && (
                  <button onClick={() => handleAction(p.id, "APPROVE")} disabled={processing === p.id}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-medium disabled:opacity-50">
                    Approve
                  </button>
                )}
                {p.status === "APPROVED" && (
                  <button onClick={() => handleAction(p.id, "PAID")} disabled={processing === p.id}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50">
                    <CheckCircle size={12} /> Mark Paid
                  </button>
                )}
                {p.status === "PAID" && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Paid {new Date(p.paidAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Generate Payroll</h2>
              <button onClick={() => { setShowForm(false); setSelectedStaff(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <select required value={selectedStaff?.id || ""}
                onChange={(e) => {
                  const s = staff.find((x: any) => x.id === e.target.value);
                  setSelectedStaff(s);
                  if (s) setForm({ ...form, basicSalary: Number(s.basicSalary || 0) });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                <option value="">Select staff *</option>
                {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Basic Salary</label>
                  <input type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Present Days</label>
                  <input type="number" value={form.presentDays} onChange={(e) => setForm({ ...form, presentDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Commission</label>
                  <input type="number" value={form.commissionAmount} onChange={(e) => setForm({ ...form, commissionAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Bonus</label>
                  <input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Overtime</label>
                  <input type="number" value={form.overtime} onChange={(e) => setForm({ ...form, overtime: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Deductions</label>
                  <input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 mb-1 block">Advance Deducted</label>
                <input type="number" value={form.advanceDeducted} onChange={(e) => setForm({ ...form, advanceDeducted: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2} placeholder="Notes"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Generating..." : "Generate Payroll"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

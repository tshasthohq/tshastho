"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Printer, Calendar, Wallet, TrendingUp, CheckCircle, Clock, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface Payment {
  id: string;
  month: string;
  basicSalary: number;
  presentDays: number;
  totalDays: number;
  attendanceAmount: number;
  commissionAmount: number;
  bonus: number;
  deduction: number;
  advanceDeducted: number;
  netPayable: number;
  paidAmount: number;
  status: string;
  paymentMethod: string;
  note: string | null;
  isCustomized: boolean;
  editNote: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface StaffInfo {
  id: string;
  name: string;
  staffRole: string;
  basicSalary: number;
  salaryType: string;
}

export default function SalaryHistoryPage() {
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Payment | null>(null);

  const loadHistory = async () => {
    const email = user?.email;
    if (!email) { router.push("/login"); return; }

    try {
      const res = await fetch("/api/pharmacy/staff/salary-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, staffId }),
      });
      const d = await res.json();
      if (d.staff) setStaff(d.staff);
      if (d.payments) setPayments(d.payments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [staffId]);

  const monthName = (m: string) => {
    const [y, mm] = m.split("-");
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${names[parseInt(mm) - 1]} ${y}`;
  };

  const handlePrint = (p: Payment) => {
    setSelected(p);
    setTimeout(() => window.print(), 300);
  };

  if (loading) return (
    <div className="p-6 text-center text-slate-500 flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="animate-spin text-blue-600" />
    </div>
  );

  return (
    <>
      {/* Screen View */}
      <div className="min-h-screen bg-slate-50 pb-10 print:hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="font-bold text-slate-800">Salary History</h1>
          <div className="w-6"></div>
        </header>

        <div className="max-w-3xl mx-auto p-6 space-y-4">
          {/* Staff Info */}
          {staff && (
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{staff.name}</h2>
                  <p className="text-xs text-purple-200">{staff.staffRole} · {staff.salaryType}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-white/10 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-purple-100">Basic</p>
                  <p className="font-bold">৳{staff.basicSalary.toFixed(0)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-purple-100">Records</p>
                  <p className="font-bold">{payments.length}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-purple-100">Paid</p>
                  <p className="font-bold">৳{payments.filter(p => p.status === "PAID").reduce((s, p) => s + Number(p.paidAmount), 0).toFixed(0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* History List */}
          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No salary records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + (p.status === "PAID" ? "bg-green-100" : "bg-orange-100")}>
                        {p.status === "PAID" ? <CheckCircle size={18} className="text-green-600" /> : <Clock size={18} className="text-orange-600" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{monthName(p.month)}</p>
                        <p className="text-xs text-slate-500">{p.presentDays}/{p.totalDays} days present</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-700">৳{Number(p.netPayable).toFixed(2)}</p>
                      <p className={"text-[10px] font-bold " + (p.status === "PAID" ? "text-green-600" : "text-orange-600")}>{p.status}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-slate-500 text-[10px]">Attendance</p>
                      <p className="font-bold">৳{Number(p.attendanceAmount).toFixed(0)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-slate-500 text-[10px]">Commission</p>
                      <p className="font-bold">৳{Number(p.commissionAmount).toFixed(0)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-slate-500 text-[10px]">Deduction</p>
                      <p className="font-bold text-red-600">৳{Number(p.deduction).toFixed(0)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-slate-500 text-[10px]">Paid</p>
                      <p className="font-bold text-green-700">৳{Number(p.paidAmount).toFixed(0)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-xs h-9"
                      onClick={() => handlePrint(p)}
                    >
                      <Printer size={14} className="mr-1" /> Payslip
                    </Button>
                    {p.note && (
                      <div className="flex-1 text-[10px] text-slate-500 flex items-center justify-end">
                        📝 {p.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Print View (Payslip) */}
      {selected && (
        <div className="hidden print:block p-8" id="payslip">
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold">TSHASTHO PHARMACY</h1>
            <p className="text-sm text-slate-600 mt-1">Salary Payslip</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p><span className="font-bold">Employee:</span> {staff?.name}</p>
              <p><span className="font-bold">Role:</span> {staff?.staffRole}</p>
            </div>
            <div className="text-right">
              <p><span className="font-bold">Month:</span> {monthName(selected.month)}</p>
              <p><span className="font-bold">Status:</span> {selected.status}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-300 mb-6 text-sm">
            <tbody>
              <tr><td className="border border-slate-300 p-2">Basic Salary</td><td className="border border-slate-300 p-2 text-right">৳{Number(selected.basicSalary).toFixed(2)}</td></tr>
              <tr><td className="border border-slate-300 p-2">Present Days</td><td className="border border-slate-300 p-2 text-right">{selected.presentDays} / {selected.totalDays}</td></tr>
              <tr><td className="border border-slate-300 p-2">Attendance Amount</td><td className="border border-slate-300 p-2 text-right">৳{Number(selected.attendanceAmount).toFixed(2)}</td></tr>
              <tr><td className="border border-slate-300 p-2">Commission</td><td className="border border-slate-300 p-2 text-right">৳{Number(selected.commissionAmount).toFixed(2)}</td></tr>
              <tr><td className="border border-slate-300 p-2">Bonus</td><td className="border border-slate-300 p-2 text-right">৳{Number(selected.bonus).toFixed(2)}</td></tr>
              <tr><td className="border border-slate-300 p-2">Deduction</td><td className="border border-slate-300 p-2 text-right text-red-600">- ৳{Number(selected.deduction).toFixed(2)}</td></tr>
              <tr><td className="border border-slate-300 p-2">Advance Deducted</td><td className="border border-slate-300 p-2 text-right text-red-600">- ৳{Number(selected.advanceDeducted).toFixed(2)}</td></tr>
              <tr className="bg-slate-100 font-bold"><td className="border border-slate-300 p-2">NET PAYABLE</td><td className="border border-slate-300 p-2 text-right">৳{Number(selected.netPayable).toFixed(2)}</td></tr>
              <tr className="bg-green-50 font-bold"><td className="border border-slate-300 p-2">PAID AMOUNT</td><td className="border border-slate-300 p-2 text-right">৳{Number(selected.paidAmount).toFixed(2)}</td></tr>
              <tr><td className="border border-slate-300 p-2">Payment Method</td><td className="border border-slate-300 p-2 text-right">{selected.paymentMethod}</td></tr>
              {selected.paidAt && (
                <tr><td className="border border-slate-300 p-2">Paid On</td><td className="border border-slate-300 p-2 text-right">{new Date(selected.paidAt).toLocaleDateString()}</td></tr>
              )}
            </tbody>
          </table>

          {selected.note && (
            <p className="text-sm mb-6"><span className="font-bold">Note:</span> {selected.note}</p>
          )}

          <div className="grid grid-cols-2 gap-12 mt-16 text-center text-sm">
            <div>
              <div className="border-t border-slate-800 pt-2">Employee Signature</div>
            </div>
            <div>
              <div className="border-t border-slate-800 pt-2">Authorized Signature</div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-10">
            Generated by Tshastho · {new Date().toLocaleString()}
          </p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #payslip, #payslip * { visibility: visible; }
          #payslip { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </>
  );
}

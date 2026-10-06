"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { FileText, Plus, Download, Calendar } from "lucide-react";

export default function VatReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/vat-reports", { credentials: "include" });
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/vat-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ month }),
    });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) {
      setMessage("✅ Report generated!");
      load();
      setTimeout(() => setMessage(""), 2500);
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const downloadCsv = (report: any) => {
    const rows = [
      ["VAT Report"],
      ["Report #", report.reportNumber],
      ["Month", report.month],
      ["VAT Number", report.vatNumber || "N/A"],
      [],
      ["Metric", "Amount (BDT)"],
      ["Total Sales", Number(report.totalSales).toFixed(2)],
      ["Total Discount", Number(report.totalDiscount).toFixed(2)],
      ["Total VAT", Number(report.totalVat).toFixed(2)],
      ["Total Invoices", report.totalInvoices],
      ["Cancelled", report.cancelledCount],
    ];
    const csv = rows.map(r => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vat-report-${report.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">VAT Reports</h1>
        </div>
        <Link href="/pharmacy/vat-invoices"
          className="text-sm text-blue-600 font-medium">All Invoices →</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-2">Generate Monthly Report</h2>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
          <button onClick={handleGenerate} disabled={generating}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-1">
            <Plus size={14} /> {generating ? "Generating..." : "Generate"}
          </button>
        </div>
        {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No VAT reports yet. Generate your first report above.
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-mono text-xs text-slate-500">{r.reportNumber}</div>
                  <div className="font-bold text-slate-800 flex items-center gap-1 mt-1">
                    <Calendar size={12} /> {r.month}
                  </div>
                </div>
                <button onClick={() => downloadCsv(r)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                  <Download size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Sales</div>
                  <div className="font-bold text-slate-800">৳{Number(r.totalSales).toFixed(0)}</div>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <div className="text-blue-700">VAT</div>
                  <div className="font-bold text-blue-700">৳{Number(r.totalVat).toFixed(0)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Invoices</div>
                  <div className="font-bold text-slate-800">{r.totalInvoices}</div>
                </div>
              </div>

              {r.vatNumber && (
                <div className="text-[10px] text-slate-400 mt-2">VAT Reg: {r.vatNumber}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

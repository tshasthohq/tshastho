"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Plus, FileText, X, Download } from "lucide-react";

const SCHEDULES = ["OTC", "PRESCRIPTION", "NARCOTIC", "CONTROLLED", "ANTIBIOTIC"];
const LOG_TYPES = ["INWARD", "OUTWARD", "DISPOSAL", "TRANSFER", "ADJUSTMENT", "RETURN"];

export default function DGDAPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"logs" | "reports">("logs");
  const [logs, setLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [form, setForm] = useState({
    logType: "OUTWARD",
    medicineId: "",
    drugSchedule: "PRESCRIPTION",
    batchNumber: "",
    quantity: 1,
    supplierName: "",
    customerName: "",
    doctorName: "",
    notes: "",
  });
  const [reportForm, setReportForm] = useState({
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
    reportType: "MONTHLY",
  });

  const load = async () => {
    setLoading(true);
    const params = scheduleFilter ? `?schedule=${scheduleFilter}` : "";
    const [logsRes, reportsRes, medsRes] = await Promise.all([
      fetch(`/api/pharmacy/dgda/logs${params}`, { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/dgda/reports", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/medicines", { credentials: "include" }).then(r => r.json()),
    ]);
    setLogs(logsRes.logs || []);
    setReports(reportsRes.reports || []);
    setMedicines(medsRes.medicines || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, scheduleFilter]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/dgda/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ ...form, medicineId: "", quantity: 1, customerName: "", doctorName: "", notes: "" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/dgda/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(reportForm),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowReportForm(false);
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };
// CONTINUES

  const scheduleColor = (s: string) => {
    switch (s) {
      case "NARCOTIC": return "bg-red-100 text-red-700";
      case "CONTROLLED": return "bg-orange-100 text-orange-700";
      case "PRESCRIPTION": return "bg-blue-100 text-blue-700";
      case "ANTIBIOTIC": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">DGDA Compliance</h1>
        </div>
        {tab === "logs" ? (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Plus size={16} /> Log
          </button>
        ) : (
          <button onClick={() => setShowReportForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <FileText size={16} /> Report
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("logs")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            tab === "logs" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>Regulatory Logs</button>
        <button onClick={() => setTab("reports")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            tab === "reports" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>DGDA Reports</button>
      </div>

      {tab === "logs" && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {["", ...SCHEDULES].map((s) => (
              <button key={s || "all"} onClick={() => setScheduleFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
                  scheduleFilter === s ? "bg-slate-800 text-white" : "bg-white border border-slate-200"
                }`}>
                {s || "All Schedules"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-slate-500 p-8">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl text-slate-500">No logs.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
              {logs.map((l) => (
                <div key={l.id} className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-mono text-xs text-slate-500">{l.logNumber}</div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${scheduleColor(l.drugSchedule)}`}>
                      {l.drugSchedule}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-800">
                    {l.logType}: {l.medicineName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Qty: {l.quantity} • {new Date(l.entryDate).toLocaleDateString()}
                  </div>
                  {l.customerName && <div className="text-xs text-slate-500">To: {l.customerName}</div>}
                  {l.doctorName && <div className="text-xs text-slate-500">Dr. {l.doctorName}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "reports" && (
        loading ? (
          <div className="text-center text-slate-500 p-8">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl text-slate-500">No reports.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono text-xs text-slate-500">{r.reportNumber}</div>
                    <div className="text-sm font-medium text-slate-800 mt-1">{r.reportType}</div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-500">Total</div>
                    <div className="font-bold text-slate-800">{r.totalEntries}</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg">
                    <div className="text-red-700">Narcotic</div>
                    <div className="font-bold text-red-700">{r.narcoticCount}</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <div className="text-orange-700">Controlled</div>
                    <div className="font-bold text-orange-700">{r.controlledCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Log Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Regulatory Log</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleLogSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Type</label>
                  <select value={form.logType} onChange={(e) => setForm({ ...form, logType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                    {LOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Schedule</label>
                  <select value={form.drugSchedule} onChange={(e) => setForm({ ...form, drugSchedule: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                    {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <select required value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                <option value="">Select medicine *</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                  placeholder="Batch #" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <input required type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  placeholder="Quantity *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="Customer name" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                placeholder="Doctor name" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2} placeholder="Notes" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Save Log"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Form */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">Generate Report</h2>
              <button onClick={() => setShowReportForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Period Start</label>
                <input required type="date" value={reportForm.periodStart}
                  onChange={(e) => setReportForm({ ...reportForm, periodStart: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Period End</label>
                <input required type="date" value={reportForm.periodEnd}
                  onChange={(e) => setReportForm({ ...reportForm, periodEnd: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Report Type</label>
                <select value={reportForm.reportType}
                  onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Generating..." : "Generate Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

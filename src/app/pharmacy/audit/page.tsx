"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { 
  Shield, Download, Search, User, Calendar, AlertTriangle, 
  Box, ArrowLeft
} from "lucide-react";

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [days, setDays] = useState(7);

  const load = async () => {
    setLoading(true);
    try {
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const params = new URLSearchParams({ from });
      if (severityFilter) params.set("severity", severityFilter);

      const res = await fetch(`/api/pharmacy/audit?${params}`, { credentials: "include" });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user, days, severityFilter]);

  const downloadCsv = () => {
    const rows = [["Date", "User", "Action", "Resource", "Severity", "IP", "Details"]];
    logs.forEach((l) => {
      rows.push([
        new Date(l.createdAt).toLocaleString(),
        l.user?.name || "System",
        l.action,
        l.resource || "",
        l.severity || "",
        l.ipAddress || "",
        JSON.stringify(l.details || {}),
      ]);
    });
    const csv = rows.map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (s: string) => {
    switch (s) {
      case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
      case "WARNING": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.user?.name?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.resource?.toLowerCase().includes(q)
    );
  });

  const criticalCount = logs.filter(l => l.severity === "CRITICAL").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pharmacy" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Shield className="text-indigo-600" size={20}/> Audit Log
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={downloadCsv} 
              className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
            >
              <Download size={14} /> CSV
            </button>
            <Link 
              href="/pharmacy/audit/stock" 
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
            >
              <Box size={14} /> Stock Audit
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-5 mt-2">
        
        {/* Alert Banner */}
        {criticalCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <AlertTriangle size={20} className="text-red-600" />
            <p className="text-sm text-red-800 font-bold">
              {criticalCount} critical event{criticalCount > 1 ? "s" : ""} in this period.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff, action, resource..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
            />
          </div>
          <select 
            value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          >
            <option value="">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warnings</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select 
            value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          >
            <option value={1}>Today</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm">
            <Shield className="text-slate-300 mx-auto mb-3" size={40} />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No audit entries</h3>
            <p className="text-slate-500 text-sm">There are no logs recorded for this period.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {filtered.map((l) => (
              <div key={l.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 border border-indigo-100">
                      <User size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{l.user?.name || "System"}</h3>
                      <p className="text-xs text-slate-500">{l.user?.staffRole || "Owner"}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getSeverityColor(l.severity)}`}>
                    {l.severity || "INFO"}
                  </span>
                </div>

                <div className="pl-13 ml-1">
                  <p className="text-sm text-slate-700 font-medium mb-1">
                    {l.action.replace(/_/g, " ")} 
                    {l.resource && <span className="text-slate-400 font-normal"> • {l.resource}</span>}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(l.createdAt).toLocaleString()}</span>
                    {l.ipAddress && <span>IP: {l.ipAddress}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

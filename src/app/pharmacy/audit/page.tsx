"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Download, Search, User, Calendar, AlertTriangle } from "lucide-react";

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [days, setDays] = useState(7);

  const load = async () => {
    setLoading(true);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const params = new URLSearchParams({ from });
    if (severityFilter) params.set("severity", severityFilter);

    const res = await fetch(`/api/pharmacy/audit?${params}`, { credentials: "include" });
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
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
        l.severity,
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

  const sevColor = (s: string) => {
    switch (s) {
      case "CRITICAL": return "bg-red-100 text-red-700";
      case "WARNING": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.user?.name?.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.resource?.toLowerCase().includes(q)
    );
  });

  const criticalCount = logs.filter(l => l.severity === "CRITICAL").length;

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Audit Log</h1>
        </div>
        {filtered.length > 0 && (
          <button onClick={downloadCsv}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Download size={14} /> CSV
          </button>
        )}
      </div>

      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600" />
          <span className="text-sm text-red-700 font-medium">
            {criticalCount} critical event{criticalCount > 1 ? "s" : ""} in this period
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff, action..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm" />
        </div>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
          <option value="">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
          <option value={1}>Today</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No audit entries.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {filtered.map((l) => (
            <div key={l.id} className="p-3">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-blue-600" size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {l.user?.name || "System"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {l.user?.staffRole || "Owner"}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sevColor(l.severity)}`}>
                  {l.severity}
                </span>
              </div>

              <div className="text-xs text-slate-700 font-medium mb-0.5">
                {l.action.replace(/_/g, " ")}
                {l.resource && <span className="text-slate-500"> • {l.resource}</span>}
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Calendar size={9} />
                {new Date(l.createdAt).toLocaleString()}
                {l.ipAddress && <span> • {l.ipAddress}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

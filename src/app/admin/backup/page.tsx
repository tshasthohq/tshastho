"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Database, CheckCircle, AlertTriangle, Clock, Download } from "lucide-react";

export default function AdminBackupPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/backup", { credentials: "include" })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Database className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Backup Status</h1>
      </div>

      {/* Health */}
      {data?.health && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Database Health</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <div className="text-xs text-slate-500">Users</div>
              <div className="text-xl font-bold text-slate-800">{data.health.users}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <div className="text-xs text-slate-500">Orders</div>
              <div className="text-xl font-bold text-slate-800">{data.health.orders}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <div className="text-xs text-slate-500">Medicines</div>
              <div className="text-xl font-bold text-slate-800">{data.health.medicines}</div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Backup */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Latest Backup</h2>
        {data?.backup?.latest ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="text-green-600" size={14} />
              <span className="font-mono text-xs">{data.backup.latest.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={12} />
              {new Date(data.backup.latest.time).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              Size: {data.backup.latest.sizeMB} MB
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-xl">
            <AlertTriangle size={14} />
            No backups found. Run scripts/backup-db.sh to create one.
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4 text-xs">
        <h3 className="font-bold text-slate-700 mb-2">Backup Instructions</h3>
        <div className="space-y-1 text-slate-600">
          <div><strong>Manual backup:</strong> <code className="bg-white px-1 rounded">./scripts/backup-db.sh</code></div>
          <div><strong>Restore:</strong> <code className="bg-white px-1 rounded">./scripts/restore-db.sh backups/file.sql</code></div>
          <div><strong>Automated:</strong> Daily at 2 AM (GitHub Actions)</div>
          <div><strong>Retention:</strong> 30 days</div>
        </div>
      </div>
    </div>
  );
}

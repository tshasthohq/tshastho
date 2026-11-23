"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function DiagnosticDashboard() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/diagnostic/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => (d.success ? setData(d) : setErr(d.message || "Failed to load")))
      .catch(() => setErr("Failed to load"));
  }, [user]);

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;
  if (err) return <p className="p-6 text-red-600">{err}</p>;
  if (!data) return <p className="p-6 text-slate-500">Loading...</p>;

  const cards = [
    { label: "Tests", value: data.counts?.tests ?? 0 },
    { label: "Packages", value: data.counts?.packages ?? 0 },
    { label: "Branches", value: data.counts?.branches ?? 0 },
    { label: "Staff", value: data.counts?.staff ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{data.diagnostic.centerName}</h1>
        <p className="text-sm text-slate-500">{data.diagnostic.address}, {data.diagnostic.city}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>
      {(data.counts?.tests ?? 0) === 0 && (
        <Link href="/diagnostic/tests" className="block rounded-xl bg-orange-50 border border-orange-100 p-4 text-sm text-orange-800">
          Shuru korte test catalog e test jog korun →
        </Link>
      )}
    </div>
  );
}

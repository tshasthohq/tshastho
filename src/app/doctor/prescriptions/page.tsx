"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { FileText, Plus, User, Calendar, Eye } from "lucide-react";

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/doctor/prescriptions", { credentials: "include" });
    const data = await res.json();
    setPrescriptions(data.prescriptions || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const filtered = prescriptions.filter((p) =>
    !search ||
    p.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.prescriptionNo?.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Prescriptions</h1>
        </div>
        <Link href="/doctor/prescriptions/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New
        </Link>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by patient, Rx#, diagnosis..."
        className="w-full px-4 py-3 mb-4 border border-slate-200 rounded-xl text-sm" />

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No prescriptions yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Link key={p.id} href={`/doctor/prescriptions/${p.id}`}
              className="block bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="text-blue-600" size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{p.patient?.name || "Patient"}</div>
                    <div className="text-xs text-slate-500 font-mono truncate">{p.prescriptionNo}</div>
                  </div>
                </div>
                <Eye size={16} className="text-slate-400 flex-shrink-0" />
              </div>

              {p.diagnosis && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mb-2">
                  <span className="font-medium">Dx:</span> {p.diagnosis}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{p.items?.length || 0} medicines</span>
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

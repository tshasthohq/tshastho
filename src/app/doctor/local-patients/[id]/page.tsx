"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  ArrowLeft, User, Phone, MapPin, Droplet, Calendar, FileText,
  Plus, Eye, Edit
} from "lucide-react";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.id) return;
    Promise.all([
      fetch(`/api/doctor/local-patients?q=`, { credentials: "include" }).then(r => r.json()),
      fetch(`/api/doctor/local-prescriptions?patientId=${params.id}`, { credentials: "include" }).then(r => r.json()),
    ]).then(([pRes, rxRes]) => {
      const p = (pRes.patients || []).find((x: any) => x.id === params.id);
      setPatient(p);
      setPrescriptions(rxRes.prescriptions || []);
    }).finally(() => setLoading(false));
  }, [user, params.id]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!patient) return <div className="p-6 text-center text-slate-500">Patient not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-slate-800">Patient Profile</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Patient Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <User className="text-blue-600" size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">{patient.name}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                {patient.age && <span>{patient.age} years</span>}
                {patient.gender && <span>{patient.gender}</span>}
                {patient.bloodGroup && (
                  <span className="flex items-center gap-1">
                    <Droplet size={10} className="text-red-500" /> {patient.bloodGroup}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
            {patient.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} /> {patient.phone}
              </div>
            )}
            {patient.address && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>{patient.address}</span>
              </div>
            )}
            {patient.notes && (
              <div className="bg-amber-50 text-amber-800 p-2 rounded-lg text-xs">
                <span className="font-medium">Notes:</span> {patient.notes}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <div className="text-[10px] text-slate-500">Total Visits</div>
              <div className="text-lg font-bold text-slate-800">{patient.totalVisits || 0}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <div className="text-[10px] text-slate-500">Last Visit</div>
              <div className="text-sm font-bold text-slate-800">
                {patient.lastVisitDate ? new Date(patient.lastVisitDate).toLocaleDateString() : "—"}
              </div>
            </div>
          </div>
        </div>
// PART2

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/doctor/local-rx/new?patientId=${patient.id}`}
            className="bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
            <Plus size={16} /> New Prescription
          </Link>
          <Link href="/doctor/walk-in-earnings"
            className="bg-slate-100 text-slate-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
            <FileText size={16} /> Add Earning
          </Link>
        </div>

        {/* Prescription History */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">Prescription History</h3>
            <span className="text-xs text-slate-500">{prescriptions.length} total</span>
          </div>

          {prescriptions.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-slate-500 text-sm">No prescriptions yet</p>
              <Link href={`/doctor/local-rx/new?patientId=${patient.id}`}
                className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium mt-2">
                <Plus size={14} /> Create first prescription
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {prescriptions.map((rx) => (
                <Link key={rx.id} href={`/doctor/local-rx/${rx.id}`}
                  className="block bg-slate-50 p-3 rounded-xl hover:bg-blue-50 transition">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-mono text-xs text-slate-500">{rx.prescriptionNo}</div>
                    <span className="text-xs font-bold text-slate-800">৳ {Number(rx.fee).toFixed(0)}</span>
                  </div>
                  {rx.diagnosis && (
                    <div className="text-sm text-slate-700 truncate">
                      <span className="text-slate-500">Dx:</span> {rx.diagnosis}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={10} />
                      {new Date(rx.visitDate).toLocaleDateString()}
                      {rx.chamber && ` • ${rx.chamber.name}`}
                    </div>
                    <Eye size={14} className="text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

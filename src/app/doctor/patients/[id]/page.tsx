"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, User, AlertTriangle, Heart, Pill, Users, Shield,
  Phone, Droplet, FileText, Clock, XCircle
} from "lucide-react";

export default function DoctorViewPatientPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "allergies" | "conditions" | "medications" | "family" | "prescriptions">("overview");

  useEffect(() => {
    if (!user || !params.id) return;
    fetch(`/api/doctor/patients/${params.id}/history`, { credentials: "include" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.message || "Access denied");
        } else {
          setData(d);
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="text-red-600" size={32} />
          </div>
          <h2 className="font-bold text-lg mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <p className="text-xs text-slate-400 mb-4">
            The patient must grant you access to view their medical history.
          </p>
          <button onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { patient, allergies, conditions, medications, familyHistory, pastPrescriptions } = data;

  const tabs = [
    { k: "overview", label: "Overview", icon: User },
    { k: "allergies", label: `Allergies (${allergies.length})`, icon: AlertTriangle },
    { k: "conditions", label: `Conditions (${conditions.length})`, icon: Heart },
    { k: "medications", label: `Medications (${medications.length})`, icon: Pill },
    { k: "family", label: `Family (${familyHistory.length})`, icon: Users },
    { k: "prescriptions", label: `Rx History (${pastPrescriptions.length})`, icon: FileText },
  ];

  const severityColor = (s: string) => {
    switch (s) {
      case "LIFE_THREATENING": return "bg-red-100 text-red-700";
      case "SEVERE": return "bg-orange-100 text-orange-700";
      case "MODERATE": return "bg-amber-100 text-amber-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };
// PART2

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-slate-800">Patient History</h1>
          <div className="ml-auto flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            <Shield size={12} /> Access Granted
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Patient Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <User className="text-blue-600" size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">{patient.name}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                {patient.patientProfile?.bloodGroup && (
                  <span className="flex items-center gap-1">
                    <Droplet size={10} className="text-red-500" /> {patient.patientProfile.bloodGroup}
                  </span>
                )}
                {patient.patientProfile?.dateOfBirth && (
                  <span>
                    Age: {Math.floor((Date.now() - new Date(patient.patientProfile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1"><Phone size={10} /> {patient.phone}</span>
                )}
              </div>
            </div>
          </div>
          {data.consent?.expiresAt && (
            <div className="mt-3 text-xs text-amber-600 flex items-center gap-1">
              <Clock size={10} /> Access expires {new Date(data.consent.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 min-w-max">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.k} onClick={() => setTab(t.k as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
                    tab === t.k ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-700"
                  }`}>
                  <Icon size={12} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {tab === "overview" && (
          <div className="space-y-3">
            {/* Critical Alerts */}
            {allergies.filter((a: any) => a.severity === "LIFE_THREATENING" || a.severity === "SEVERE").length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-red-600" size={18} />
                  <h3 className="font-bold text-red-700">⚠️ Critical Allergies</h3>
                </div>
                <div className="space-y-1">
                  {allergies.filter((a: any) => a.severity === "LIFE_THREATENING" || a.severity === "SEVERE").map((a: any) => (
                    <div key={a.id} className="text-sm text-red-700">
                      <strong>{a.allergen}</strong> — {a.severity.replace("_", " ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-500">Allergies</div>
                <div className="text-lg font-bold text-slate-800">{allergies.length}</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-500">Conditions</div>
                <div className="text-lg font-bold text-slate-800">{conditions.length}</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-500">Medications</div>
                <div className="text-lg font-bold text-slate-800">{medications.length}</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-500">Past Rx</div>
                <div className="text-lg font-bold text-slate-800">{pastPrescriptions.length}</div>
              </div>
            </div>

            {/* Recent Prescriptions */}
            {pastPrescriptions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <h3 className="text-xs font-bold text-slate-600 uppercase mb-2">Recent Prescriptions</h3>
                <div className="space-y-2">
                  {pastPrescriptions.slice(0, 3).map((rx: any) => (
                    <div key={rx.id} className="bg-slate-50 p-2 rounded-lg text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-slate-500">{rx.prescriptionNo}</span>
                        <span className="text-slate-500">{new Date(rx.createdAt).toLocaleDateString()}</span>
                      </div>
                      {rx.diagnosis && <div className="text-slate-700">Dx: {rx.diagnosis}</div>}
                      <div className="text-slate-500 mt-1">{rx.items?.length || 0} medicines</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "allergies" && (
          <div className="space-y-2">
            {allergies.length === 0 ? (
              <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">No allergies recorded</div>
            ) : (
              allergies.map((a: any) => (
                <div key={a.id} className="bg-white p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-slate-800">{a.allergen}</div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${severityColor(a.severity)}`}>
                      {a.severity.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{a.type}</div>
                  {a.reaction && <div className="text-xs text-slate-600 mt-1">Reaction: {a.reaction}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "conditions" && (
          <div className="space-y-2">
            {conditions.length === 0 ? (
              <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">No conditions recorded</div>
            ) : (
              conditions.map((c: any) => (
                <div key={c.id} className="bg-white p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-slate-800">{c.name}</div>
                    {c.isChronic && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">Chronic</span>}
                  </div>
                  <div className="text-xs text-slate-500">{c.type}</div>
                  {c.diagnosedDate && <div className="text-xs text-slate-500">Diagnosed: {new Date(c.diagnosedDate).toLocaleDateString()}</div>}
                  {c.hospital && <div className="text-xs text-slate-500">At: {c.hospital}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "medications" && (
          <div className="space-y-2">
            {medications.length === 0 ? (
              <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">No current medications</div>
            ) : (
              medications.map((m: any) => (
                <div key={m.id} className="bg-white p-3 rounded-2xl border border-slate-100">
                  <div className="font-medium text-slate-800">
                    {m.medicineName} {m.dosage && `— ${m.dosage}`}
                  </div>
                  {m.frequency && <div className="text-xs text-slate-500">{m.frequency}</div>}
                  {m.prescribedBy && <div className="text-xs text-slate-500">By: {m.prescribedBy}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "family" && (
          <div className="space-y-2">
            {familyHistory.length === 0 ? (
              <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">No family history</div>
            ) : (
              familyHistory.map((f: any) => (
                <div key={f.id} className="bg-white p-3 rounded-2xl border border-slate-100">
                  <div className="font-medium text-slate-800">{f.relation} — {f.condition}</div>
                  {f.notes && <div className="text-xs text-slate-500 mt-1">{f.notes}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "prescriptions" && (
          <div className="space-y-2">
            {pastPrescriptions.length === 0 ? (
              <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">No prescriptions yet</div>
            ) : (
              pastPrescriptions.map((rx: any) => (
                <div key={rx.id} className="bg-white p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-xs text-slate-500">{rx.prescriptionNo}</span>
                    <span className="text-xs text-slate-500">{new Date(rx.createdAt).toLocaleDateString()}</span>
                  </div>
                  {rx.diagnosis && <div className="text-sm text-slate-700 mb-1">Dx: {rx.diagnosis}</div>}
                  <div className="text-xs text-slate-500">{rx.items?.length || 0} medicines</div>
                  {rx.items && rx.items.length > 0 && (
                    <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                      {rx.items.slice(0, 3).map((i: any, idx: number) => (
                        <div key={idx}>• {i.medicineName} {i.strength}</div>
                      ))}
                      {rx.items.length > 3 && <div className="text-slate-400">+{rx.items.length - 3} more</div>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { QRCodeSVG } from "qrcode.react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Printer, FileText, User, Calendar, Pill } from "lucide-react";

export default function DoctorPrescriptionViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.id) return;
    fetch(`/api/prescriptions/${params.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!data?.prescription) return <div className="p-6 text-center text-slate-500">Not found</div>;

  const p = data.prescription;
  const doc = data.doctor;

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-slate-800">Prescription</h1>
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 print:shadow-none print:rounded-none" id="prescription-print">
          {/* Header */}
          <div className="border-b-2 border-blue-600 pb-4 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">Tshastho</div>
                <div className="text-xs text-slate-500">Connected Healthcare. Trusted Care.</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs text-slate-500">{p.prescriptionNo}</div>
                <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="mb-5 pb-4 border-b border-dashed border-slate-200">
            <div className="font-bold text-lg text-slate-800">Dr. {doc?.name || p.doctorName || "Doctor"}</div>
            <div className="text-sm text-blue-600">{doc?.specialty || "Specialist"}</div>
            <div className="text-xs text-slate-500 mt-1">
              {doc?.qualifications?.map((q: any) => q.degree).join(", ")}
            </div>
            {doc?.licenseNumber && (
              <div className="text-xs text-slate-500">BMDC Reg: {doc.licenseNumber}</div>
            )}
            {doc?.chamberAddress && (
              <div className="text-xs text-slate-500 mt-1">{doc.chamberAddress}</div>
            )}
            {doc?.bookingPhone && (
              <div className="text-xs text-slate-500">Phone: {doc.bookingPhone}</div>
            )}
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-3 mb-5 pb-4 border-b border-dashed border-slate-200 text-sm">
            <div>
              <div className="text-xs text-slate-500">Patient Name</div>
              <div className="font-medium">{p.patient?.name || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Age / Blood Group</div>
              <div className="font-medium">
                {p.patient?.patientProfile?.dateOfBirth ? 
                  `${Math.floor((Date.now() - new Date(p.patient.patientProfile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yr` 
                  : "—"}
                {p.patient?.patientProfile?.bloodGroup ? ` / ${p.patient.patientProfile.bloodGroup}` : ""}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Phone</div>
              <div className="font-medium">{p.patient?.phone || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Date</div>
              <div className="font-medium">{new Date(p.issueDate || p.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Chief Complaint */}
          {p.chiefComplaint && (
            <div className="mb-3">
              <div className="text-xs font-bold text-slate-600 uppercase mb-1">Chief Complaint</div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.chiefComplaint}</p>
            </div>
          )}

          {/* Examination */}
          {p.examination && (
            <div className="mb-3">
              <div className="text-xs font-bold text-slate-600 uppercase mb-1">Examination</div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.examination}</p>
            </div>
          )}

          {/* Diagnosis */}
          {p.diagnosis && (
            <div className="mb-3">
              <div className="text-xs font-bold text-slate-600 uppercase mb-1">Diagnosis</div>
              <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{p.diagnosis}</p>
            </div>
          )}

          {/* Investigations */}
          {p.investigations && (
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-600 uppercase mb-1">Investigations</div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.investigations}</p>
            </div>
          )}

          {/* Rx Symbol */}
          <div className="my-4">
            <div className="text-3xl font-serif text-blue-600 mb-2">℞</div>
            <div className="space-y-3">
              {p.items?.map((item: any, idx: number) => (
                <div key={item.id} className="pb-3 border-b border-dashed border-slate-200 last:border-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">
                        {idx + 1}. {item.medicineName} {item.strength && <span className="text-slate-600">— {item.strength}</span>}
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5">
                        {[item.dosage, item.frequency, item.duration, item.beforeAfterMeal].filter(Boolean).join(" • ")}
                      </div>
                      {item.instructions && (
                        <div className="text-xs text-slate-500 italic mt-0.5">{item.instructions}</div>
                      )}
                    </div>
                    {item.quantity && (
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        Qty: {item.quantity}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice */}
          {p.advice && (
            <div className="mb-4 bg-blue-50 p-3 rounded-lg">
              <div className="text-xs font-bold text-blue-700 uppercase mb-1">Advice</div>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{p.advice}</p>
            </div>
          )}

          {/* Follow-up */}
          {p.followUpDate && (
            <div className="mb-4 bg-amber-50 p-3 rounded-lg">
              <div className="text-xs font-bold text-amber-700 uppercase mb-1">Follow-up</div>
              <p className="text-sm text-amber-800">
                {new Date(p.followUpDate).toLocaleDateString()}
                {p.followUpNotes && ` — ${p.followUpNotes}`}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center">
            <div className="text-xs text-slate-500">
              This prescription is valid until {p.validUntil ? new Date(p.validUntil).toLocaleDateString() : "N/A"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Generated by Tshastho · tshastho.com
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

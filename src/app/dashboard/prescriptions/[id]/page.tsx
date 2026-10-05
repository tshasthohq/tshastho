"use client";
import { QRCodeSVG } from "qrcode.react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Printer, CheckCircle } from "lucide-react";

export default function PatientPrescriptionViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPharmacyPicker, setShowPharmacyPicker] = useState(false);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");

  useEffect(() => {
    if (!user || !params.id) return;
    fetch(`/api/prescriptions/${params.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  const openPharmacyPicker = async () => {
    const res = await fetch("/api/doctors?limit=100", { credentials: "include" }).catch(() => ({ json: () => ({}) }));
    // Instead of doctors, fetch pharmacies from a public endpoint or use medicines endpoint
    // Simple approach: prompt user to select pharmacy from list of available ones
    const pharmRes = await fetch("/api/pharmacies/list", { credentials: "include" }).catch(() => null);
    if (pharmRes && pharmRes.ok) {
      const d = await pharmRes.json();
      setPharmacies(d.pharmacies || []);
    } else {
      // Fallback — empty list will show empty state
      setPharmacies([]);
    }
    setShowPharmacyPicker(true);
  };

  const sendToPharmacy = async (pharmacyId: string) => {
    setSending(true);
    setSendMessage("");
    const res = await fetch(`/api/prescriptions/${params.id}/to-pharmacy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pharmacyId }),
    });
    const d = await res.json();
    setSending(false);
    if (res.ok) {
      setSendMessage("✅ Sent to pharmacy!");
      setTimeout(() => { setShowPharmacyPicker(false); setSendMessage(""); }, 2000);
    } else {
      setSendMessage(d.message || "Failed");
    }
  };

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
          <button onClick={openPharmacyPicker}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            Send to Pharmacy
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 print:shadow-none print:rounded-none">
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
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-3 mb-5 pb-4 border-b border-dashed border-slate-200 text-sm">
            <div>
              <div className="text-xs text-slate-500">Patient</div>
              <div className="font-medium">{p.patient?.name || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Date</div>
              <div className="font-medium">{new Date(p.issueDate || p.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Status Banner */}
          {p.status === "VERIFIED" && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm text-green-700 font-medium">Verified Prescription</span>
            </div>
          )}

          {p.chiefComplaint && (
            <div className="mb-3">
              <div className="text-xs font-bold text-slate-600 uppercase mb-1">Chief Complaint</div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.chiefComplaint}</p>
            </div>
          )}

          {p.diagnosis && (
            <div className="mb-3">
              <div className="text-xs font-bold text-slate-600 uppercase mb-1">Diagnosis</div>
              <p className="text-sm font-medium text-slate-800">{p.diagnosis}</p>
            </div>
          )}

          {p.investigations && (
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-600 uppercase mb-1">Investigations</div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.investigations}</p>
            </div>
          )}

          <div className="my-4">
            <div className="text-3xl font-serif text-blue-600 mb-2">℞</div>
            <div className="space-y-3">
              {p.items?.map((item: any, idx: number) => (
                <div key={item.id} className="pb-3 border-b border-dashed border-slate-200 last:border-0">
                  <div className="font-medium text-slate-800">
                    {idx + 1}. {item.medicineName} {item.strength && `— ${item.strength}`}
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    {[item.dosage, item.frequency, item.duration, item.beforeAfterMeal].filter(Boolean).join(" • ")}
                  </div>
                  {item.instructions && (
                    <div className="text-xs text-slate-500 italic mt-0.5">{item.instructions}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {p.advice && (
            <div className="mb-4 bg-blue-50 p-3 rounded-lg">
              <div className="text-xs font-bold text-blue-700 uppercase mb-1">Advice</div>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{p.advice}</p>
            </div>
          )}

          {p.followUpDate && (
            <div className="mb-4 bg-amber-50 p-3 rounded-lg">
              <div className="text-xs font-bold text-amber-700 uppercase mb-1">Follow-up</div>
              <p className="text-sm text-amber-800">
                {new Date(p.followUpDate).toLocaleDateString()}
                {p.followUpNotes && ` — ${p.followUpNotes}`}
              </p>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-200 text-center">
            <div className="text-xs text-slate-500">
              Valid until {p.validUntil ? new Date(p.validUntil).toLocaleDateString() : "N/A"}
            </div>
            <div className="flex justify-center my-3">
              <QRCodeSVG value={`https://tshastho.com/verify/rx/${p.prescriptionNo}`} size={80} level="M" />
            </div>
            <div className="text-xs text-slate-400 mt-1">Generated by Tshastho</div>
          </div>
        {showPharmacyPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Select Pharmacy</h2>
              <button onClick={() => setShowPharmacyPicker(false)}>✕</button>
            </div>
            <div className="p-4 space-y-2">
              {sendMessage && <p className="text-sm text-center text-green-600">{sendMessage}</p>}
              {pharmacies.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No pharmacies available yet.
                </p>
              ) : (
                pharmacies.map((p: any) => (
                  <button key={p.id} onClick={() => sendToPharmacy(p.id)} disabled={sending}
                    className="w-full text-left bg-slate-50 hover:bg-blue-50 p-3 rounded-xl disabled:opacity-50">
                    <div className="font-medium text-slate-800">{p.shopName}</div>
                    <div className="text-xs text-slate-500">{p.address}{p.area ? `, ${p.area}` : ""}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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

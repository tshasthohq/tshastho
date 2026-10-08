"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Shield, Calendar, Stethoscope, User } from "lucide-react";

export default function VerifyRxPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.no) return;
    fetch(`/api/verify/rx/${params.no}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setError(d.message || "Not found");
        else setData(d.verification);
      })
      .catch(() => setError("Verification failed"))
      .finally(() => setLoading(false));
  }, [params.no]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500">Verifying...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-md">
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-blue-600">Tshastho</div>
          <div className="text-xs text-slate-500">Prescription Verification</div>
        </div>

        {error ? (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="text-red-600" size={40} />
            </div>
            <h1 className="text-center font-bold text-lg mb-2">Not Verified</h1>
            <p className="text-center text-sm text-slate-500">{error}</p>
          </>
        ) : data ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h1 className="text-center font-bold text-lg text-green-700 mb-1">Authentic Prescription</h1>
            <p className="text-center text-xs text-slate-500 mb-6 flex items-center justify-center gap-1">
              <Shield size={12} /> Verified by Tshastho
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                <Stethoscope size={16} className="text-blue-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">Doctor</div>
                  <div className="font-medium">Dr. {data.doctorName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                <User size={16} className="text-blue-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">Patient</div>
                  <div className="font-medium">{data.patientNameMasked}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                <Calendar size={16} className="text-blue-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">Issued</div>
                  <div className="font-medium">{new Date(data.issueDate).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500">Rx #</div>
                  <div className="font-mono text-xs font-medium">{data.prescriptionNo}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500">Medicines</div>
                  <div className="font-medium">{data.itemsCount}</div>
                </div>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-4">
              Only limited info shown for privacy
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

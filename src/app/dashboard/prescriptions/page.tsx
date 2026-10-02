"use client";
import { FileText } from "lucide-react";

export default function PrescriptionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Reports</h1>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500 mb-2">No reports available yet</p>
        <p className="text-xs text-slate-400">Your prescriptions and test reports will appear here</p>
      </div>
    </div>
  );
}

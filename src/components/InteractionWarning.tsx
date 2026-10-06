"use client";

import { AlertTriangle, ShieldAlert, X } from "lucide-react";

interface Warning {
  drug1: string;
  drug2: string;
  severity: "MINOR" | "MODERATE" | "MAJOR" | "CONTRAINDICATED";
  description: string;
  recommendation?: string;
}

interface Props {
  warnings: Warning[];
  onClose: () => void;
  onAcknowledge?: () => void;
}

export default function InteractionWarning({ warnings, onClose, onAcknowledge }: Props) {
  if (warnings.length === 0) return null;

  const hasCritical = warnings.some(w => w.severity === "CONTRAINDICATED" || w.severity === "MAJOR");

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className={`flex justify-between items-center p-4 border-b sticky top-0 ${
          hasCritical ? "bg-red-50" : "bg-amber-50"
        }`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className={hasCritical ? "text-red-600" : "text-amber-600"} size={20} />
            <h2 className="font-bold">Drug Interactions Detected</h2>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-4 space-y-3">
          {warnings.map((w, i) => {
            const sevColor = {
              CONTRAINDICATED: "bg-red-600 text-white",
              MAJOR: "bg-red-100 text-red-700",
              MODERATE: "bg-amber-100 text-amber-700",
              MINOR: "bg-slate-100 text-slate-700",
            }[w.severity];

            return (
              <div key={i} className={`p-3 rounded-xl border ${
                w.severity === "CONTRAINDICATED" || w.severity === "MAJOR"
                  ? "bg-red-50 border-red-200"
                  : "bg-amber-50 border-amber-200"
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-800 text-sm">
                    {w.drug1} <span className="text-slate-400">+</span> {w.drug2}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sevColor}`}>
                    {w.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-700 mb-2">{w.description}</div>
                {w.recommendation && (
                  <div className="text-xs text-blue-700 bg-white p-2 rounded">
                    💡 {w.recommendation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t bg-slate-50">
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-medium">
              {hasCritical ? "Cancel & Review" : "Go Back"}
            </button>
            {onAcknowledge && (
              <button onClick={onAcknowledge}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
                  hasCritical ? "bg-red-600 text-white" : "bg-amber-600 text-white"
                }`}>
                {hasCritical ? "Proceed Anyway" : "Acknowledge & Continue"}
              </button>
            )}
          </div>
          {hasCritical && (
            <p className="text-[10px] text-red-600 text-center mt-2">
              ⚠️ Proceeding may pose serious health risks
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

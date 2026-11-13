"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft, FileUp } from "lucide-react";
import PharmacyNav from "@/components/pharmacy/PharmacyNav";

export default function BulkImportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"skip" | "update">("skip");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleExport = () => {
    window.location.href = "/api/pharmacy/medicines/export";
  };

  const parseCsv = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          result.push(cur); cur = "";
        } else {
          cur += ch;
        }
      }
      result.push(cur);
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.trim());
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      const obj: any = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx]?.trim() || ""; });
      rows.push(obj);
    }
    return rows;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    setError("");

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setError("CSV is empty or invalid");
        setUploading(false);
        return;
      }

      const res = await fetch("/api/pharmacy/medicines/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rows, mode }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.message || "Import failed");
      }
    } catch (err) {
      setError("Failed to read file");
    }
    setUploading(false);
    if (e.target) e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <PharmacyNav />
      
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 pb-24">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-all bg-white px-4 py-2.5 rounded-full shadow-sm border border-slate-200/60 mb-6 hover:shadow-md"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Medicines
        </button>

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Bulk Import / Export</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Manage your inventory efficiently using CSV files.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Export Section */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                  <Download size={16} />
                </div>
                Export Data
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Download your entire medicine inventory as a CSV file. You can edit it in Excel or Google Sheets, and then re-import it.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Download size={18} /> Download CSV
            </button>
          </div>

          {/* Import Settings */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8">
            <h2 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Upload size={16} />
              </div>
              Import Settings
            </h2>
            <p className="text-sm text-slate-500 mb-6">Choose how to handle medicines that already exist in your system.</p>
            
            <div className="bg-slate-50 p-1.5 rounded-xl flex gap-1 border border-slate-200/60">
              <button
                onClick={() => setMode("skip")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === "skip" 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Skip Existing
              </button>
              <button
                onClick={() => setMode("update")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === "update" 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Update Existing
              </button>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 mb-6">
          <label className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-indigo-200 rounded-2xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400 transition-all bg-slate-50/50 group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileUp size={28} className={uploading ? "text-indigo-500 animate-pulse" : "text-indigo-500"} />
              </div>
              <p className="text-base font-bold text-slate-700 mb-1">
                {uploading ? "Processing your file..." : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-slate-500">CSV files only (Max 2000 rows)</p>
            </div>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFile} 
              disabled={uploading} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-white rounded-[24px] border border-green-100 shadow-[0_8px_30px_rgb(16,185,129,0.05)] p-6 md:p-8 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-full text-green-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Import Completed</h3>
                <p className="text-sm text-slate-500">Your data has been processed successfully.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-slate-500 mb-1 text-xs uppercase font-bold tracking-wider">Created</div>
                <div className="font-extrabold text-green-600 text-2xl">{result.summary.created}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-slate-500 mb-1 text-xs uppercase font-bold tracking-wider">Updated</div>
                <div className="font-extrabold text-blue-600 text-2xl">{result.summary.updated}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-slate-500 mb-1 text-xs uppercase font-bold tracking-wider">Skipped</div>
                <div className="font-extrabold text-slate-700 text-2xl">{result.summary.skipped}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-slate-500 mb-1 text-xs uppercase font-bold tracking-wider">Errors</div>
                <div className="font-extrabold text-red-500 text-2xl">{result.summary.errors}</div>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <details className="mt-5 text-sm bg-red-50/50 rounded-xl border border-red-100 p-4">
                <summary className="cursor-pointer text-red-600 font-bold">View Row Errors</summary>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {result.errors.map((e: any, i: number) => (
                    <div key={i} className="bg-white p-3 rounded-lg text-red-700 text-xs border border-red-100 shadow-sm">
                      <span className="font-bold">Row {e.row}:</span> {e.message}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm flex items-start gap-3 mb-6 shadow-sm animate-in fade-in">
            <AlertCircle size={20} className="shrink-0 mt-0.5" /> 
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Sample Template - Premium Code Block */}
        <div className="bg-slate-900 rounded-[24px] p-6 md:p-8 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <FileSpreadsheet size={120} className="text-white" />
          </div>
          <div className="relative z-10">
            <strong className="text-white text-sm font-bold block mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              CSV Format Reference
            </strong>
            <pre className="bg-slate-950/50 p-4 rounded-xl overflow-x-auto text-[12px] text-indigo-300 border border-slate-800 shadow-inner font-mono leading-relaxed custom-scrollbar">
name,brand,genericName,category,unit,purchasePrice,sellingPrice,stock,stripsize,boxSize,manufacturer
Napa,Square,Paracetamol,Analgesic,piece,0.5,1,500,10,100,Square Pharmaceuticals
SecIo,Eskay,Omeprazole,Antacid,piece,3,5,200,10,100,Eskayef
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}

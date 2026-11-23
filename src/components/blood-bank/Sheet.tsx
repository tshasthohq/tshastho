"use client";
import type { ReactNode } from "react";
import { X } from "lucide-react";

export const fld =
  "w-full pl-10 pr-3 py-3 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl text-sm shadow-sm outline-none focus:ring-2 focus:ring-red-500";

export async function api(url: string, method: string, body?: any) {
  const r = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || d.message || "Failed"), { needsConfirm: !!d.needsConfirm });
  return d;
}

export function Field({ label, icon: Icon, children }: { label: string; icon: any; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

export function Sheet({ title, onClose, footer, children }: { title: string; onClose: () => void; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[92vh]"
        style={{ colorScheme: "light" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-4">{children}</div>
        {footer && (
          <div className="px-5 pt-3 border-t border-slate-100" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

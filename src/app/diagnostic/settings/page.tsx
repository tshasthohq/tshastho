"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ui } from "@/lib/diagnostic/ui";
import HistoryPanel from "@/components/diagnostic/HistoryPanel";
import { Upload, Trash2 } from "lucide-react";

export default function Branding() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "SUPER_ADMIN"]);
  const [c, setC] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [hk, setHk] = useState(0);

  const load = useCallback(async () => {
    const r = await fetch("/api/diagnostic/branding", { credentials: "include" });
    const d = await r.json();
    if (d.success) setC(d.center);
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const saveLogo = async (logo: string | null) => {
    const r = await fetch("/api/diagnostic/branding", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ logo }),
    });
    const d = await r.json();
    if (r.ok) { setMsg(logo ? "Logo save hoyeche" : "Logo muche fela hoyeche"); load(); setHk((k) => k + 1); } else setMsg(d.message || "Failed");
  };

  const upload = async (file: File) => {
    setBusy(true); setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (r.ok && d.url) await saveLogo(d.url); else setMsg(d.error || "Upload failed");
    } catch { setMsg("Upload failed"); }
    setBusy(false);
  };

  if (loading || !user || !c) return <p className="p-6 text-slate-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className={ui.h1}>Center <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Branding</span></h1>
        <p className={ui.sub}>Apnar center-er logo report ar letterhead-e uporе print hobe.</p>
      </div>

      {msg && <p className="rounded-xl bg-slate-900 p-2.5 text-center text-xs font-bold text-white">{msg}</p>}

      <div className={ui.card}>
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Letterhead preview</p>
        <div className="flex items-center justify-center gap-4 rounded-2xl border border-slate-100 bg-white p-5">
          {c.logo ? (
            <img src={c.logo} alt="logo" className="h-20 w-20 object-contain" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-teal-500 text-2xl font-black text-white">
              {(c.name || "D").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-center">
            <p className="text-xl font-black text-blue-900">{c.name}</p>
            <p className="text-xs text-slate-600">{[c.address, c.city].filter(Boolean).join(", ")}</p>
            {c.phone && <p className="text-xs text-slate-600">Phone: {c.phone}</p>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className={ui.btn + " flex cursor-pointer items-center gap-1.5"}>
            <Upload size={15} /> {busy ? "Uploading..." : c.logo ? "Logo bodlan" : "Logo upload"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {c.logo && (
            <button onClick={() => saveLogo(null)} className={ui.btnGhost + " flex items-center gap-1.5 !text-red-600"}><Trash2 size={15} /> Remove</button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Choturbhuj (square) PNG, shada ba transparent background-e bhalo dekhay. Max 5MB.</p>
      </div>

      <div className={ui.card}>
        <p className="mb-4 text-xs font-black uppercase tracking-wide text-slate-400">Change History</p>
        <HistoryPanel entity="CENTER" entityId={c.id} refreshKey={hk} />
      </div>
    </div>
  );
}

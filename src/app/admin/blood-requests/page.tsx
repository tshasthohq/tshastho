"use client";
import { useEffect, useState } from "react";
import { Loader2, Phone } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import { groupLabel } from "@/lib/bd-locations";

type Tab = "open" | "all";

export default function AdminBloodRequestsPage() {
  const [tab, setTab] = useState<Tab>("open");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr("");
    fetch(`/api/admin/blood/requests?status=${tab}`, { signal: ac.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setItems(d.requests || []);
      })
      .catch((e) => { if (e.name !== "AbortError") setErr(e.message); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [tab]);

  async function cancel(id: string) {
    if (!confirm("Cancel this request? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/blood/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (r.ok)
        setItems((list) =>
          list
            .filter((x) => tab === "all" || x.id !== id)
            .map((x) => (x.id === id ? { ...x, status: "CANCELLED" } : x))
        );
      else setErr((await r.json()).error || "Failed");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <BackHeader title="Blood Requests" />
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 bg-slate-200/60 p-1 rounded-2xl mb-4">
          {(["open", "all"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize ${tab === t ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>{t}</button>
          ))}
        </div>

        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

        {loading ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No requests here.</p>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-extrabold shrink-0">{groupLabel(r.bloodGroup)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{r.hospital}</p>
                    <p className="text-sm text-slate-500">{r.district} · {r.units} bag · {r.urgency}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{r.status}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">By {r.requester?.name || "Unknown"} {r.requester?.phone ? `(${r.requester.phone})` : ""} · {r._count?.responses || 0} responses</p>
                <a href={`tel:${r.contactPhone}`} className="text-sm text-emerald-700 font-semibold flex items-center gap-1 mt-1"><Phone size={13} />{r.contactPhone}</a>
                {r.note && <p className="text-sm text-slate-600 mt-1">{r.note}</p>}
                {(r.status === "OPEN" || r.status === "MATCHED") && (
                  <button disabled={busyId === r.id} onClick={() => cancel(r.id)}
                    className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm bg-red-600 text-white disabled:opacity-60">
                    {busyId === r.id ? "Cancelling..." : "Cancel (fake / spam)"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

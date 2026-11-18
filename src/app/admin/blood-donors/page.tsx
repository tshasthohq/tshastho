"use client";
import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, Phone } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import { groupLabel } from "@/lib/bd-locations";

type Status = "pending" | "verified" | "all";

export default function AdminBloodDonorsPage() {
  const [status, setStatus] = useState<Status>("pending");
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr("");
    fetch(`/api/admin/blood/donors?status=${status}`, { signal: ac.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setDonors(d.donors || []);
      })
      .catch((e) => { if (e.name !== "AbortError") setErr(e.message); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [status]);

  async function toggle(id: string, verified: boolean) {
    setBusyId(id);
    try {
      const r = await fetch("/api/admin/blood/donors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId: id, verified }),
      });
      if (r.ok)
        setDonors((list) =>
          list
            .filter((d) => status === "all" || d.id !== id)
            .map((d) => (d.id === id ? { ...d, verified } : d))
        );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <BackHeader title="Blood Donors" />
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 bg-slate-200/60 p-1 rounded-2xl mb-4">
          {(["pending", "verified", "all"] as Status[]).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize ${status === s ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>{s}</button>
          ))}
        </div>

        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

        {loading ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : donors.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No donors here.</p>
        ) : (
          <div className="space-y-3">
            {donors.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-extrabold shrink-0">{groupLabel(d.bloodGroup)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 flex items-center gap-1 truncate">
                      {d.user?.name || "Unnamed"} {d.verified && <BadgeCheck size={16} className="text-blue-500 shrink-0" />}
                    </p>
                    <p className="text-sm text-slate-500">{[d.upazila, d.district].filter(Boolean).join(", ")} · {d.gender || "-"}</p>
                    {d.user?.phone && (
                      <a href={`tel:${d.user.phone}`} className="text-sm text-emerald-700 font-semibold flex items-center gap-1 mt-0.5"><Phone size={13} />{d.user.phone}</a>
                    )}
                  </div>
                </div>
                <button disabled={busyId === d.id} onClick={() => toggle(d.id, !d.verified)}
                  className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 ${d.verified ? "bg-slate-100 text-slate-700" : "bg-blue-600 text-white"}`}>
                  {busyId === d.id ? "Saving..." : d.verified ? "Remove verification" : "Verify donor"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

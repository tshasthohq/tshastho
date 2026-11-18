"use client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, Phone, HeartHandshake, Droplet } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import { groupLabel } from "@/lib/bd-locations";
import { useAuth } from "@/hooks/useAuth";

const ST: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  MATCHED: "bg-blue-100 text-blue-700",
  FULFILLED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  EXPIRED: "bg-slate-100 text-slate-500",
};

export default function MyBloodPage() {
  const { user } = useAuth();
  const push = usePushNotifications();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState("");
  const [resp, setResp] = useState<Record<string, any[]>>({});

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/blood/me", { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  async function patchMe(body: any) {
    setBusy("me");
    setMsg("");
    try {
      const r = await fetch("/api/blood/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) setMsg(d.error || "Failed");
      else await load();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy("");
    }
  }

  async function setStatus(id: string, status: string) {
    if (!confirm(status === "FULFILLED" ? "Mark this request as fulfilled?" : "Cancel this request?")) return;
    setBusy(id);
    setMsg("");
    try {
      const r = await fetch(`/api/blood/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (!r.ok) setMsg(d.error || "Failed");
      else await load();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy("");
    }
  }

  async function toggleResp(id: string) {
    if (open === id) { setOpen(""); return; }
    setOpen(id);
    if (resp[id]) return;
    try {
      const r = await fetch(`/api/blood/requests/${id}/responders`);
      const d = await r.json();
      setResp((p) => ({ ...p, [id]: d.responders || [] }));
    } catch {
      setResp((p) => ({ ...p, [id]: [] }));
    }
  }

  if (!user) return (
    <div className="min-h-screen bg-slate-50">
      <BackHeader title="My Blood Profile" />
      <div className="p-4 flex justify-center">
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-sm w-full mt-6">
          <Droplet className="mx-auto text-red-600 mb-3" size={40} />
          <p className="text-sm text-slate-500 mb-5">Please log in to see your blood profile.</p>
          <Link href="/login" className="block bg-red-600 text-white font-bold py-3 rounded-xl">Log in</Link>
        </div>
      </div>
    </div>
  );

  const donor = data?.donor;
  const requests: any[] = data?.requests || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <BackHeader title="My Blood Profile" />
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {msg && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{msg}</p>}

        {push.supported && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm">Phone alerts</p>
              <p className="text-xs text-slate-500">
                {push.permission === "denied"
                  ? "Notifications are blocked in your browser settings."
                  : "Get notified when someone near you needs your blood group."}
              </p>
            </div>
            <button
              disabled={push.busy || push.permission === "denied"}
              onClick={() => (push.subscribed ? push.disable() : push.enable())}
              className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-60 ${push.subscribed ? "bg-emerald-100 text-emerald-700" : "bg-red-600 text-white"}`}
            >
              {push.busy ? "..." : push.subscribed ? "On" : "Enable"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : (
          <>
            {!donor ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                <HeartHandshake className="mx-auto text-red-600 mb-2" size={32} />
                <p className="font-bold text-slate-900">You are not a donor yet</p>
                <Link href="/blood-bank/donate" className="inline-block mt-3 bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl">Become a Donor</Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl font-extrabold">{groupLabel(donor.bloodGroup)}</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      Donor {donor.verified && <BadgeCheck size={16} className="text-blue-500" />}
                    </p>
                    <p className="text-sm text-slate-500">{[donor.upazila, donor.district].filter(Boolean).join(", ")}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {donor.lastDonationDate ? `Last donated ${new Date(donor.lastDonationDate).toLocaleDateString()}` : "No donation recorded"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-slate-900">{donor.totalDonations}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">donations</p>
                  </div>
                </div>

                <div className={`mt-4 text-sm font-semibold rounded-xl px-3 py-2 ${data.eligible ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {data.eligible ? "You are eligible and visible to requesters" : "Currently not shown in search (paused or donated recently)"}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button disabled={busy === "me"} onClick={() => patchMe({ action: "toggle", isAvailable: !donor.isAvailable })}
                    className="py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-800 disabled:opacity-60">
                    {donor.isAvailable ? "Pause donating" : "Resume donating"}
                  </button>
                  <button disabled={busy === "me"} onClick={() => { if (confirm("Record a donation made today?")) patchMe({ action: "donated" }); }}
                    className="py-3 rounded-xl font-bold text-sm bg-red-600 text-white disabled:opacity-60">
                    I donated today
                  </button>
                </div>
              </div>
            )}

            <h2 className="font-extrabold text-slate-900 pt-2">My blood requests</h2>
            {requests.length === 0 ? (
              <p className="text-sm text-slate-500 bg-white rounded-2xl border border-slate-100 p-5 text-center">No requests yet.</p>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-extrabold">{groupLabel(r.bloodGroup)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{r.hospital}</p>
                      <p className="text-sm text-slate-500">{r.district} · {r.units} bag{r.units > 1 ? "s" : ""}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${ST[r.status] || ""}`}>{r.status}</span>
                  </div>

                  <button onClick={() => toggleResp(r.id)} className="mt-3 w-full text-sm font-bold text-blue-600 py-2 rounded-xl bg-blue-50">
                    {r._count?.responses || 0} donor(s) responded {open === r.id ? "▲" : "▼"}
                  </button>

                  {open === r.id && (
                    <div className="mt-2 space-y-2">
                      {!resp[r.id] ? (
                        <div className="flex justify-center py-3 text-slate-400"><Loader2 className="animate-spin" size={18} /></div>
                      ) : resp[r.id].length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-2">No responses yet.</p>
                      ) : (
                        resp[r.id].map((p, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                              {p.name} {p.verified && <BadgeCheck size={14} className="text-blue-500" />}
                            </p>
                            {p.phone ? (
                              <a href={`tel:${p.phone}`} className="text-sm font-bold text-emerald-700 flex items-center gap-1"><Phone size={13} />{p.phone}</a>
                            ) : (
                              <span className="text-xs text-slate-400">Will call you</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {(r.status === "OPEN" || r.status === "MATCHED") && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <button disabled={busy === r.id} onClick={() => setStatus(r.id, "FULFILLED")} className="py-2.5 rounded-xl font-bold text-sm bg-emerald-600 text-white disabled:opacity-60">Got blood</button>
                      <button disabled={busy === r.id} onClick={() => setStatus(r.id, "CANCELLED")} className="py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 disabled:opacity-60">Cancel</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";
import BackHeader from "@/components/BackHeader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Droplet, MapPin, BadgeCheck, Phone, Siren, HeartHandshake, Loader2, Hospital } from "lucide-react";
import { GROUPS, DISTRICTS, groupLabel } from "@/lib/bd-locations";
import { useAuth } from "@/hooks/useAuth";

const URG: Record<string, { t: string; c: string }> = {
  CRITICAL: { t: "Critical", c: "bg-red-100 text-red-700" },
  TODAY: { t: "Today", c: "bg-amber-100 text-amber-700" },
  SCHEDULED: { t: "Scheduled", c: "bg-blue-100 text-blue-700" },
};

function ago(s: string) {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

export default function BloodBankPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"requests" | "donors">("requests");
  const [group, setGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    const qs = new URLSearchParams();
    if (group) qs.set("bloodGroup", group);
    if (district) qs.set("district", district);
    fetch(`/api/blood/${tab}?${qs}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => setItems(d[tab] || []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [tab, group, district]);

  async function respond(id: string) {
    if (!user) { router.push("/login"); return; }
    setMsg((m) => ({ ...m, [id]: "" }));
    try {
      const r = await fetch(`/api/blood/requests/${id}/respond`, { method: "POST" });
      const d = await r.json();
      if (r.ok) setPhones((p) => ({ ...p, [id]: d.contactPhone }));
      else setMsg((m) => ({ ...m, [id]: d.error || "Failed" }));
    } catch {
      setMsg((m) => ({ ...m, [id]: "Network error" }));
    }
  }

  function share(r: any) {
    const text = `Blood needed: ${groupLabel(r.bloodGroup)} (${r.units} bag) at ${r.hospital}, ${r.district}. Can you help? ${window.location.origin}/blood-bank`;
    if (typeof navigator !== "undefined" && (navigator as any).share) (navigator as any).share({ text }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <BackHeader title="Blood Bank" />
      <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white px-4 pt-8 pb-14">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-red-100 text-sm font-semibold mb-2">
            <Droplet size={16} /> Tshastho Blood Bank
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">Find blood donors fast.<br />Save a life today.</h1>
          <p className="text-red-100 text-sm mt-2">Verified donors across Bangladesh. Free, always.</p>
          <Link href="/blood-bank/me" className="inline-block mt-2 text-xs font-bold underline text-white/90">My blood profile →</Link>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <Link href="/blood-bank/request" className="flex items-center justify-center gap-2 bg-white text-red-700 font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition">
              <Siren size={18} /> Need Blood
            </Link>
            <Link href="/blood-bank/donate" className="flex items-center justify-center gap-2 bg-red-900/40 border border-white/30 font-bold py-3.5 rounded-2xl active:scale-95 transition">
              <HeartHandshake size={18} /> Become a Donor
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-4">
          <div className="grid grid-cols-4 gap-2">
            {GROUPS.map((g) => (
              <button key={g.v} onClick={() => setGroup(group === g.v ? "" : g.v)}
                className={`py-2.5 rounded-xl font-extrabold text-base transition ${group === g.v ? "bg-red-600 text-white shadow-md" : "bg-slate-50 text-slate-700 border border-slate-200"}`}>
                {g.l}
              </button>
            ))}
          </div>
          <div className="relative mt-3">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-red-500">
              <option value="">All districts</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4 bg-slate-200/60 p-1 rounded-2xl">
          {(["requests", "donors"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${tab === t ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
              {t === "requests" ? "Blood Requests" : "Donors"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
              <Droplet className="mx-auto text-slate-300 mb-2" size={36} />
              <p className="font-bold text-slate-700">{tab === "requests" ? "No open requests" : "No donors found"}</p>
              <p className="text-sm text-slate-500 mt-1">Try another blood group or district.</p>
            </div>
          ) : tab === "requests" ? (
            items.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-extrabold shrink-0">{groupLabel(r.bloodGroup)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${URG[r.urgency]?.c}`}>{URG[r.urgency]?.t}</span>
                      <span className="text-xs text-slate-400">{ago(r.createdAt)}</span>
                    </div>
                    <p className="font-bold text-slate-900 mt-1 flex items-center gap-1 truncate"><Hospital size={14} className="text-slate-400 shrink-0" />{r.hospital}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin size={13} />{[r.upazila, r.district].filter(Boolean).join(", ")} · {r.units} bag{r.units > 1 ? "s" : ""}</p>
                    {r.note && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{r.note}</p>}
                  </div>
                </div>
                {phones[r.id] ? (
                  <a href={`tel:${phones[r.id]}`} className="mt-3 flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3 rounded-xl">
                    <Phone size={16} /> Call {phones[r.id]}
                  </a>
                ) : (
                  <button onClick={() => respond(r.id)} className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl active:scale-95 transition">
                    I can donate
                  </button>
                )}
                {msg[r.id] && <p className="text-xs text-red-600 mt-2 text-center">{msg[r.id]}</p>}
                <button onClick={() => share(r)} className="mt-2 w-full text-sm font-bold text-green-700 bg-green-50 py-2.5 rounded-xl">Share on WhatsApp / Facebook</button>
                {r._count?.responses > 0 && <p className="text-xs text-slate-400 mt-2 text-center">{r._count.responses} donor(s) responded</p>}
              </div>
            ))
          ) : (
            items.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-extrabold shrink-0">{groupLabel(d.bloodGroup)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 flex items-center gap-1">{d.name}{d.verified && <BadgeCheck size={16} className="text-blue-500" />}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin size={13} />{[d.area, d.upazila, d.district].filter(Boolean).join(", ")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-extrabold text-slate-900">{d.totalDonations}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">donations</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

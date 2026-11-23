"use client";
import BackHeader from "@/components/BackHeader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Droplet, MapPin, BadgeCheck, Phone, Siren, HeartHandshake, Loader2, Hospital } from "lucide-react";
import { GROUPS, DISTRICTS, groupLabel } from "@/lib/bd-locations";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageProvider";
import EligibilityCheck from "@/components/blood-bank/EligibilityCheck";

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
  const { t: tt } = useLanguage();
  const tr = (k: string, fb: string) => { const v = tt(k); return v && v !== k ? v : fb; };
  const [banks, setBanks] = useState<any[]>([]);
  const [stats, setStats] = useState({ donors: 0, banks: 0, open: 0 });
  const rankOf = (b: any) => ({ AVAILABLE: 0, LOW: 1, OUT: 2 } as Record<string, number>)[b.stock?.[group] || "OUT"];
  const rankedBanks = group ? [...banks].sort((a: any, b: any) => rankOf(a) - rankOf(b)) : banks;
  const stockTag = (g: string) => {
    if (!banks.length) return null;
    let a = 0, l = 0;
    banks.forEach((b: any) => { const v = b.stock?.[g]; if (v === "AVAILABLE") a++; else if (v === "LOW") l++; });
    const dot = a ? "bg-emerald-500" : l ? "bg-amber-500" : "bg-slate-300";
    const u = banks.reduce((n: number, b: any) => n + (Number(b.units?.[g]) || 0), 0);
    const txt = u > 0 ? `${u} ${u === 1 && tr("bb.units", "units") === "units" ? "unit" : tr("bb.units", "units")}` : a ? `${a} ${a > 1 ? tr("bb.banksN", "banks") : tr("bb.bankN", "bank")}` : l ? tr("bb.low", "Low") : tr("bb.none", "None");
    return (<span className="block text-[10px] font-semibold leading-tight mt-0.5 opacity-80"><i className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${dot}`} />{txt}</span>);
  };
  useEffect(() => {
    const pick = (d: any): any[] => Array.isArray(d) ? d : ((d && (Object.values(d) as any[]).find(Array.isArray)) || []);
    const get = (u: string) => fetch(u).then((r) => r.json()).catch(() => null);
    Promise.all([get("/api/blood/banks"), get("/api/blood/donors"), get("/api/blood/requests")]).then(([b, d, r]) => {
      const bl = pick(b), dl = pick(d), rl = pick(r);
      setBanks(bl);
      setStats({ banks: bl.length, donors: typeof d?.total === "number" ? d.total : dl.length, open: rl.length });
    });
  }, []);

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
      <div className="bg-gradient-to-b from-red-50 via-rose-50/60 to-slate-50 text-slate-900 pt-8 pb-14">
        <div className="max-w-2xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white border border-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm mb-3">
            <Droplet size={16} /> {tr("bb.brand","Tshastho Blood Bank")}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900">{tr("bb.h1a","Find blood donors fast.")}<br /><span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">{tr("bb.h1b","Save a life today.")}</span></h1>
          <p className="text-slate-500 text-sm mt-2">{tr("bb.sub","Verified donors across Bangladesh. Free, always.")}</p>
          <Link href="/blood-bank/me" className="inline-flex items-center gap-1 mt-3 text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-700 shadow-sm hover:border-red-200 hover:text-red-600 transition">{tr("bb.profile","My blood profile")} →</Link>
          <Link href="/blood-bank/banks" className="inline-flex items-center gap-1 mt-3 ml-2 text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-700 shadow-sm hover:border-red-200 hover:text-red-600 transition">{tr("bb.banks","Blood banks")} →</Link>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <Link href="/blood-bank/request" className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3.5 rounded-full shadow-lg shadow-red-200 hover:from-red-700 hover:to-rose-700 active:scale-95 transition">
              <Siren size={18} /> {tr("bb.need","Need Blood")}
            </Link>
            <Link href="/blood-bank/donate" className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-800 font-bold py-3.5 rounded-full shadow-sm hover:border-red-200 active:scale-95 transition">
              <HeartHandshake size={18} /> {tr("bb.donor","Become a Donor")}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-500 mb-2">{tr("bb.selGroup","Select blood group")}</p>
            <div className="grid grid-cols-4 gap-2">
            {GROUPS.map((g) => (
              <button key={g.v} onClick={() => setGroup(group === g.v ? "" : g.v)}
                className={`py-2.5 rounded-full font-bold text-sm transition ${group === g.v ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-slate-50 text-slate-700 border border-slate-200"}`}>
                {g.l}{stockTag(g.v)}
              </button>
            ))}
          </div>
          <div className="relative mt-3">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-red-400">
              <option value="">{tr("bb.allDist","All districts")}</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {(stats.donors > 0 || stats.banks > 0 || stats.open > 0) && (
          <div className="flex gap-2 mt-4">
            {[[stats.donors, tr("bb.statEligible", "Eligible donors")], [stats.banks, tr("bb.statBanks", "Blood banks")], [stats.open, tr("bb.statOpen", "Open requests")]].filter(([n]) => Number(n) > 0).map(([n, l]) => (
              <div key={String(l)} className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm py-3 text-center">
                <p className="text-xl font-extrabold text-slate-900">{n}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        )}

        {banks.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900">{tr("bb.nearBanks", "Blood banks")}</h2>
              <Link href="/blood-bank/banks" className="text-xs font-bold text-red-600">{tr("bb.viewAll", "View all")}</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x">
              {rankedBanks.slice(0, 6).map((b: any) => (
                <Link key={b.id} href={`/blood-bank/banks/${b.id}`} className="snap-start shrink-0 w-56 bg-white border border-slate-100 rounded-2xl shadow-sm p-3 hover:border-red-200 transition">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Hospital size={16} /></span>
                    <p className="font-bold text-sm text-slate-900 truncate">{b.name}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 truncate"><MapPin size={12} />{[b.area, b.district].filter(Boolean).join(", ")}</p>
                  {group && (() => { const st = b.stock?.[group] || "OUT"; return (<p className={`text-[11px] font-extrabold mt-1 ${st === "AVAILABLE" ? "text-emerald-700" : st === "LOW" ? "text-amber-700" : "text-red-600"}`}>{GROUPS.find((x) => x.v === group)?.l}: {st === "AVAILABLE" ? tr("bb.inStock", "In stock") : st === "LOW" ? tr("bb.low", "Low") : tr("bb.none", "None")}</p>); })()}
                <p className="text-[11px] text-emerald-600 font-semibold mt-1 truncate">{(() => { const a = GROUPS.filter((g) => b.stock?.[g.v] && b.stock[g.v] !== "OUT").map((g) => (b.units?.[g.v] ? `${g.l} ${b.units[g.v]}` : g.l)); return a.length ? `${tr("bb.inStock", "In stock")}: ${a.join(" · ")}` : tr("bb.noStock", "Stock not updated"); })()}</p>
                  {b.stockUpdatedAt && (<p className={`text-[10px] mt-0.5 ${Date.now() - new Date(b.stockUpdatedAt).getTime() > 86400000 ? "text-amber-600" : "text-slate-400"}`}>{tr("bb.updated", "Updated")} {ago(b.stockUpdatedAt)}</p>)}
                </Link>
              ))}
            </div>
          </div>
        )}

        <EligibilityCheck />

        <div className="flex gap-2 mt-4 bg-slate-200/60 p-1 rounded-2xl">
          {(["requests", "donors"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${tab === t ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
              {t === "requests" ? tr("bb.tabReq","Blood Requests") : tr("bb.tabDon","Donors")}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-3">{[0,1,2].map((i) => (<div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 animate-pulse"><div className="w-14 h-14 rounded-2xl bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-3 w-1/3 bg-slate-100 rounded" /><div className="h-4 w-2/3 bg-slate-100 rounded" /><div className="h-3 w-1/2 bg-slate-100 rounded" /></div></div>))}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Droplet className="mx-auto text-slate-300 mb-2" size={36} />
              <p className="font-bold text-slate-700">{tab === "requests" ? tr("bb.noReq","No open requests") : tr("bb.noDon","No donors found")}</p>
              <p className="text-sm text-slate-500 mt-1">{tab === "requests" ? tr("bb.noReqSub","Nobody is asking for blood right now.") : tr("bb.noDonSub","No donors registered here yet.")}</p>
              <Link href={tab === "requests" ? "/blood-bank/request" : "/blood-bank/donate"} className="inline-block mt-4 bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm active:scale-95 transition">
                {tab === "requests" ? tr("bb.reqBtn","Request blood") : tr("bb.firstDon","Become the first donor")}
              </Link>
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
                    {tr("bb.canDonate","I can donate")}
                  </button>
                )}
                {msg[r.id] && <p className="text-xs text-red-600 mt-2 text-center">{msg[r.id]}</p>}
                <button onClick={() => share(r)} className="mt-2 w-full text-sm font-bold text-green-700 bg-green-50 py-2.5 rounded-xl">{tr("bb.share","Share on WhatsApp / Facebook")}</button>
                {r._count?.responses > 0 && <p className="text-xs text-slate-400 mt-2 text-center">{r._count.responses} {tr("bb.responded","donor(s) responded")}</p>}
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
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{tr("bb.donations","donations")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

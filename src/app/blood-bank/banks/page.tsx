"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Loader2, BadgeCheck, Droplet, Search, ChevronRight, Building2 } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import { GROUPS, DISTRICTS } from "@/lib/bd-locations";
import { STATUS_WORD, STATUS_CHIP, STATUS_TILE, hoursText, joinAddr, ago } from "@/lib/blood-bank-ui";

export default function BloodBanksPage() {
  const [group, setGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [q, setQ] = useState("");
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    const qs = new URLSearchParams();
    if (group) qs.set("bloodGroup", group);
    if (district) qs.set("district", district);
    fetch(`/api/blood/banks?${qs}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => setBanks(d.banks || []))
      .catch((e) => { if (e.name !== "AbortError") setBanks([]); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [group, district]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return banks;
    return banks.filter((b) => [b.name, b.area, b.district, b.address].some((x) => (x || "").toLowerCase().includes(t)));
  }, [banks, q]);

  const selected = GROUPS.find((g) => g.v === group);

  return (
    <div className="min-h-screen bg-slate-50 pb-24" style={{ colorScheme: "light" }}>
      <BackHeader title="Find blood banks" />
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by blood bank name or area..."
            className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-2xl text-sm shadow-sm outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
          <button onClick={() => setGroup("")} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${!group ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white text-slate-700 border border-slate-200"}`}>All groups</button>
          {GROUPS.map((g) => (
            <button key={g.v} onClick={() => setGroup(group === g.v ? "" : g.v)} className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap ${group === g.v ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white text-slate-700 border border-slate-200"}`}>{g.l}</button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-3">
          <p className="text-sm font-semibold text-slate-500">{loading ? "Loading..." : `${shown.length} blood bank${shown.length === 1 ? "" : "s"} found`}</p>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="pl-8 pr-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-full text-xs font-bold outline-none focus:ring-2 focus:ring-red-500">
              <option value="">All districts</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
          ) : shown.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
              <Droplet className="mx-auto text-slate-300 mb-2" size={36} />
              <p className="font-bold text-slate-700">No blood banks found</p>
              <p className="text-sm text-slate-500 mt-1">Try another district or clear the search.</p>
            </div>
          ) : (
            shown.map((b) => {
              const have = GROUPS.filter((g) => b.stock[g.v] !== "OUT").length;
              return (
                <div key={b.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shrink-0 shadow-md shadow-red-200">
                      <Droplet size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-slate-900 flex items-center gap-1 truncate">{b.name}<BadgeCheck size={16} className="text-blue-500 shrink-0" /></p>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={13} className="shrink-0" /><span className="truncate">{joinAddr(b.area, b.district)}</span></p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${b.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${b.isOpen ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {b.isOpen ? hoursText(b) : "Closed now"}
                        </span>
                        <span className="text-[11px] text-slate-400">Stock activity {ago(b.stockUpdatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {selected && b.match && (
                    <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold flex items-center justify-between ${STATUS_CHIP[b.match]}`}>
                      <span>{selected.l} blood</span>
                      <span>{STATUS_WORD[b.match]}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    {GROUPS.map((g) => (
                      <button key={g.v} type="button" onClick={() => { setGroup(group === g.v ? "" : g.v); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={`rounded-lg border py-1.5 text-center active:scale-95 transition ${STATUS_TILE[b.stock[g.v]]}`}>
                        <p className="text-xs font-extrabold leading-none">{g.l}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">{have} of 8 blood groups in stock</p>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <a href={`tel:${b.phone}`} className="flex items-center justify-center gap-1.5 bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-emerald-200 active:scale-95 transition"><Phone size={15} />Call</a>
                    <Link href={`/blood-bank/banks/${b.id}`} className="flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-800 font-bold py-3 rounded-xl text-sm active:scale-95 transition">View details<ChevronRight size={15} /></Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-xs text-slate-400 text-center mt-5">Green means available, amber means low and red means out of stock. Availability can change quickly, so please call to confirm.</p>

        <Link href="/register/blood-bank" className="mt-4 flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Building2 size={18} /></div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm">Run a blood bank?</p>
            <p className="text-xs text-slate-500">List it on Tshastho and manage your stock online.</p>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0" />
        </Link>
      </div>
    </div>
  );
}

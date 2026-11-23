"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, Phone, Clock, Loader2, BadgeCheck, Navigation, Siren, ShieldCheck, Share2, Activity } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import { Sheet } from "@/components/blood-bank/Sheet";
import { GROUPS } from "@/lib/bd-locations";
import { STATUS_WORD, STATUS_TILE, STATUS_DOT, hoursText, joinAddr, ago } from "@/lib/blood-bank-ui";

export default function BloodBankDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bank, setBank] = useState<any>(null);
  const [err, setErr] = useState("");
  const [pick, setPick] = useState("");

  useEffect(() => {
    fetch(`/api/blood/banks/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load");
        setBank(d.bank);
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  const address = bank ? joinAddr(bank.address, bank.district) : "";
  const mapUrl = bank ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(joinAddr(bank.name, bank.address, bank.district))}` : "#";
  const have = bank ? GROUPS.filter((g) => bank.stock[g.v] !== "OUT").length : 0;

  function share() {
    const url = window.location.href;
    const text = `${bank.name} blood bank, ${address}`;
    if ((navigator as any).share) (navigator as any).share({ title: bank.name, text, url }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32" style={{ colorScheme: "light" }}>
      <BackHeader title="Blood bank" />

      {bank && pick && (() => {
        const g = GROUPS.find((x) => x.v === pick)!;
        const st = bank.stock[pick] || "OUT";
        return (
          <Sheet
            title={`${g.l} blood`}
            onClose={() => setPick("")}
            footer={
              st === "OUT" ? (
                <Link href={`/blood-bank/request?group=${pick}&district=${encodeURIComponent(bank.district)}`} className="block text-center bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-md shadow-red-200">Post a request for {g.l}</Link>
              ) : (
                <a href={`tel:${bank.phone}`} className="block text-center bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-200">Call to confirm {g.l}</a>
              )
            }
          >
            <div className={`rounded-2xl border p-5 text-center ${STATUS_TILE[st]}`}>
              <p className="text-4xl font-black leading-none">{g.l}</p>
              <p className="text-sm font-bold mt-2">{STATUS_WORD[st]}</p>
            </div>
            <p className="text-sm text-slate-600">
              {st === "OUT"
                ? `No tested ${g.l} bags are listed at ${bank.name} right now. You can post a blood request so nearby donors can see it.`
                : `Please call ${bank.name} to confirm that ${g.l} blood is still available and to ask which documents to bring.`}
            </p>
          </Sheet>
        );
      })()}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {err ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{err}</p>
        ) : !bank ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : (
          <>
            <section className="relative overflow-hidden bg-[#0B1120] rounded-[2rem] p-6 text-white shadow-2xl shadow-red-900/20">
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-red-500/40 to-rose-500/40 rounded-full blur-[80px] -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-orange-500/25 to-amber-500/25 rounded-full blur-[60px] -ml-10 -mb-10" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${bank.isOpen ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                    <span className="text-[10px] font-bold tracking-wider uppercase">{bank.isOpen ? "Open" : "Closed now"}</span>
                  </div>
                  <h1 className="text-2xl font-black flex items-center gap-2">{bank.name}<BadgeCheck size={20} className="text-sky-300 shrink-0" /></h1>
                  <p className="text-slate-300 text-sm mt-1 flex items-start gap-1"><MapPin size={14} className="mt-0.5 shrink-0" />{address}</p>
                </div>
                <button onClick={share} aria-label="Share" className="w-10 h-10 shrink-0 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center"><Share2 size={16} /></button>
              </div>
              <div className="relative flex flex-wrap gap-2 mt-4">
                <span className="text-[11px] font-bold bg-white/10 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1"><ShieldCheck size={12} />License verified</span>
                <span className="text-[11px] font-bold bg-white/10 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1"><Clock size={12} />{hoursText(bank)}</span>
                <span className="text-[11px] font-bold bg-white/10 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1"><Activity size={12} />Stock activity {ago(bank.stockUpdatedAt)}</span>
              </div>
            </section>

            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-slate-900">Blood availability</h2>
                <span className="text-xs font-bold text-slate-500">{have} of 8 in stock</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {GROUPS.map((g) => {
                  const st = bank.stock[g.v] || "OUT";
                  return (
                    <button key={g.v} type="button" onClick={() => setPick(g.v)} className={`rounded-2xl border p-2.5 text-center active:scale-95 transition ${STATUS_TILE[st]}`}>
                      <p className="text-xl font-black leading-none">{g.l}</p>
                      <p className="text-[10px] font-bold mt-1.5 leading-tight">{STATUS_WORD[st]}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-[11px] text-slate-500">
                {(["AVAILABLE", "LOW", "OUT"] as const).map((k) => (
                  <span key={k} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${STATUS_DOT[k]}`} />{STATUS_WORD[k]}</span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">Only tested and unexpired bags are counted. Availability can change quickly, so please call to confirm before you travel.</p>
            </section>

            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">Contact</h2>
              <a href={`tel:${bank.phone}`} className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Phone size={18} /></span>
                <span><span className="block text-[11px] font-bold text-slate-400 tracking-wider">PHONE</span><span className="font-bold text-slate-900">{bank.phone}</span></span>
              </a>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><MapPin size={18} /></span>
                <span className="min-w-0"><span className="block text-[11px] font-bold text-slate-400 tracking-wider">ADDRESS</span><span className="font-bold text-slate-900">{address}</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Clock size={18} /></span>
                <span><span className="block text-[11px] font-bold text-slate-400 tracking-wider">HOURS</span><span className="font-bold text-slate-900">{hoursText(bank)}</span></span>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">Every blood bank on Tshastho has its license checked. Stock is updated by the blood bank itself. Blood is never sold. Blood banks may charge only for services such as screening, grouping and processing.</p>
            </section>

            <Link href="/blood-bank/request" className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-700 font-bold py-3.5 rounded-2xl"><Siren size={16} />Post a blood request instead</Link>
          </>
        )}
      </div>

      {bank && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-100" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3 p-3">
            <a href={`tel:${bank.phone}`} className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-emerald-200"><Phone size={16} />Call now</a>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-2xl"><Navigation size={16} />Directions</a>
          </div>
        </div>
      )}
    </div>
  );
}

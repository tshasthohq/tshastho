"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Phone, Clock, Star, User, Headset } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PublicHeader from "@/components/PublicHeader";
import PageTitleBar from "@/components/PageTitleBar";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function DoctorsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"all" | "booking" | "directory">("all");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);
  const [loading, setLoading] = useState(true);
  const [hotlineNumber, setHotlineNumber] = useState("01737326555");

  useEffect(() => {
    fetch('/api/settings/public').then(res => res.json()).then(data => { if(data.hotlineNumber) setHotlineNumber(data.hotlineNumber); });
    fetch(`/api/doctors?mode=${mode}`)
      .then(res => res.json())
      .then(data => {
        setDoctors(data.doctors || []);
        setFiltered(data.doctors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mode]);

  useEffect(() => {
    const filterList = doctors.filter(d =>
      d.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filterList);
  }, [search, doctors]);

  if (loading) return <div className="p-10 text-center text-slate-500">{t("doc.loading")}</div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: "linear-gradient(180deg,#dbeafe 0%,#eff6ff 38%,#f8fafc 100%)" }}>
      <PublicHeader />
      <PageTitleBar title={t("w.Find Doctors")} count={filtered.length} />

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={20} />
          <input
            type="text"
            placeholder={t("doc.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/95 backdrop-blur-xl border border-white/70 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-[0_8px_30px_rgba(30,64,175,0.08)]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {([["all","All"],["booking","Online Booking"],["directory","Directory Only"]] as const).map(([k,label]) => (
            <button key={k} onClick={() => setMode(k)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${mode === k ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white/95 rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-8 text-center text-slate-500">
            {t("doc.none")}
          </div>
        )}

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/doctors/${doc.id}`)}
              className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5 hover:shadow-[0_14px_40px_rgba(30,64,175,0.16)] hover:-translate-y-0.5 active:scale-[0.99] transition cursor-pointer flex flex-col"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-sky-100 text-blue-600 rounded-2xl ring-2 ring-white shadow-md overflow-hidden flex items-center justify-center flex-shrink-0">
                  {doc.user?.avatarUrl ? (
                     <img src={doc.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-3xl font-extrabold text-blue-600">{(doc.displayName || "D").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">
                    Dr. {doc.displayName}
                  </h2>
                  {!doc.isClaimed && <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Directory listing</p>}
            <p className="inline-block text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full font-semibold mt-1">{doc.specialty}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      {Number(doc.averageRating || 0).toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {doc.experience} {t("doc.yrsExp")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 p-3 rounded-2xl">
                  <p className="text-[10px] text-blue-700 mb-0.5">{t("doc.fee")}</p>
                  <p className="text-lg font-extrabold text-blue-700">
                    ৳ {Number(doc.consultationFee || 0).toFixed(0)}
                  </p>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl">
                  <p className="text-[10px] text-slate-500 mb-0.5">{t("doc.license")}</p>
                  <p className="text-xs font-mono text-slate-800 truncate">{doc.licenseNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    window.location.href = `tel:${doc.isClaimed ? (doc.bookingPhone || doc.phone || hotlineNumber) : hotlineNumber}`; 
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-blue-600 bg-white border border-blue-200 rounded-2xl hover:bg-blue-50 transition text-sm font-semibold"
                >
                  <Phone size={16} /> {t("doc.call")}
                </button>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    window.location.href = `tel:${hotlineNumber}`; 
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-emerald-600 bg-white border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition text-sm font-semibold"
                >
                  <Headset size={16} /> {t("foot.hotline")}
                </button>
                {doc.isClaimed ? (
              <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    router.push(`/doctors/${doc.id}#slots`); 
                  }}
                  className="col-span-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/30 active:scale-[0.99] transition text-center"
                >
                  {t("doc.book")}
                </button>
            ) : doc.claimStatus === "PENDING" ? (
              <div className="col-span-2 text-center py-3 rounded-2xl text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Claim under review
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/register/doctor?bmdc=${encodeURIComponent(doc.licenseNumber)}`); }}
                className="col-span-2 bg-slate-800 text-white py-3 rounded-2xl text-sm font-bold text-center"
              >
                Are you this doctor? Claim this profile
              </button>
            )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-white/95 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900">{t("doc.helpTitle")}</p>
            <p className="text-sm text-slate-600 mt-0.5">{t("doc.helpText")}</p>
          </div>
          <a href={`tel:${hotlineNumber}`} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold px-5 py-3 rounded-2xl text-sm shadow-lg shadow-emerald-600/25">
            <Headset size={16} /> {hotlineNumber}
          </a>
        </div>
      </div>
    </div>
  );
}

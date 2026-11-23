"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, X, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "text-amber-500 fill-amber-500" : "text-slate-300"} />
      ))}
    </span>
  );
}

export default function MedicineReviewsSheet({
  masterMedicineId, name, onClose,
}: { masterMedicineId: string; name: string; onClose: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () =>
    fetch(`/api/medicines/reviews?masterMedicineId=${masterMedicineId}`, { credentials: "include" })
      .then((r) => r.json()).then(setData).catch(() => {});
  useEffect(() => { load(); }, [masterMedicineId]);

  const submit = async () => {
    if (!rating || busy) return;
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/medicines/reviews", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterMedicineId, rating, comment }),
      });
      const j = await res.json();
      if (res.ok) { setMsg(t("mr.thanks", "Thank you for your review!")); setRating(0); setComment(""); await load(); }
      else setMsg(j.error || "Error");
    } catch { setMsg("Network error"); }
    setBusy(false);
  };

  const reviews: any[] = data?.reviews || [];
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n, c: reviews.filter((r: any) => Math.round(r.rating) === n).length,
  }));

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full md:max-w-lg bg-white/95 backdrop-blur-xl rounded-t-3xl md:rounded-3xl max-h-[88vh] overflow-y-auto p-5 border border-white/70 shadow-[0_-8px_40px_rgba(30,64,175,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t("mr.title", "Reviews")}</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight">{name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label={t("mr.close", "Close")}
            className="h-11 w-11 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={20} />
          </button>
        </div>

        {data && data.reviewCount > 0 && (
          <div className="flex items-center gap-4 mb-5 rounded-3xl p-4 border border-blue-100"
            style={{ background: "linear-gradient(135deg,#eff6ff 0%,#f0f9ff 100%)" }}>
            <div className="text-center shrink-0">
              <div className="text-5xl font-black text-slate-900 leading-none">{Number(data.avgRating).toFixed(1)}</div>
              <div className="mt-2"><Stars value={data.avgRating} size={16} /></div>
              <p className="text-sm text-slate-500 mt-1">{data.reviewCount} {t("mr.title", "Reviews")}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {dist.map((d) => (
                <div key={d.n} className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-3 font-bold">{d.n}</span>
                  <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                      style={{ width: (reviews.length ? (d.c / reviews.length) * 100 : 0) + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 mb-5">
          {data && reviews.length === 0 && (
            <div className="text-center py-8 rounded-3xl bg-slate-50 border border-slate-100">
              <Star size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-base font-bold text-slate-700">{t("mr.none", "No reviews yet.")}</p>
              <p className="text-sm text-slate-500 mt-1">{t("mr.noneHint", "Be the first to share your experience.")}</p>
            </div>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-3xl p-4 bg-white border border-slate-100 shadow-[0_4px_16px_rgba(30,64,175,0.06)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black flex items-center justify-center">
                  {String(r.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{r.name}</p>
                  {r.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                      <ShieldCheck size={13} /> {t("mr.verified", "Verified purchase")}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <Stars value={r.rating} size={14} />
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {r.comment && <p className="text-[15px] text-slate-700 mt-2.5 leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4">
          {!user ? (
            <Link href="/login?redirect=/medicines"
              className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-base font-bold shadow-lg shadow-blue-500/25">
              {t("mr.loginHint", "Log in to review")}
            </Link>
          ) : data?.myReview ? (
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-sm font-bold text-slate-500 mb-1">{t("mr.yours", "Your review")}</p>
              <Stars value={data.myReview.rating} size={20} />
            </div>
          ) : data?.canReview ? (
            <div>
              <p className="text-base font-bold text-slate-800">{t("mr.write", "Write a review")}</p>
              <p className="text-sm text-slate-500 mb-2">{t("mr.tapStar", "Tap a star to rate")}</p>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setRating(i)} className="h-12 w-12 flex items-center justify-center active:scale-90 transition-transform">
                    <Star size={34} className={i <= rating ? "text-amber-500 fill-amber-500" : "text-slate-300"} />
                  </button>
                ))}
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1000}
                placeholder={t("mr.placeholder", "Share your experience (optional)")}
                className="w-full border border-slate-200 bg-white rounded-2xl p-3.5 text-base outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              <button type="button" onClick={submit} disabled={!rating || busy}
                className="mt-3 w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-base font-bold shadow-lg shadow-blue-500/25 disabled:opacity-40">
                {t("mr.submit", "Submit")}
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center">{t("mr.onlyBuyers", "Only customers who received this medicine can review it.")}</p>
          )}
          {msg && <p className="text-sm font-semibold text-slate-700 mt-3 text-center">{msg}</p>}
        </div>
      </div>
    </div>
  );
}

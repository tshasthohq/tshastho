"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Share2, Copy, CheckCircle, Users, DollarSign, TrendingUp } from "lucide-react";

export default function ReferralPage() {
  const { user } = useAuth();
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/referrals", { credentials: "include" });
    const data = await res.json();
    setReferral(data.referral);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const copyCode = () => {
    if (!referral?.code) return;
    navigator.clipboard.writeText(referral.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!referral) return <div className="p-6 text-center text-slate-500">No referral</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">My Referral Program</h1>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white mb-4 shadow-lg">
        <div className="text-xs text-blue-100 mb-1">My Referral Code</div>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold font-mono tracking-wider">{referral.code}</div>
          <button onClick={copyCode}
            className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl flex items-center gap-1 text-sm">
            {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <div className="text-xs text-blue-100 mt-3">
          Commission Rate: <strong>{Number(referral.commissionRate)}%</strong> of every order
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Users size={12} /> Referrals</div>
          <div className="text-lg font-bold text-slate-800">{referral.totalReferrals}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><TrendingUp size={12} /> Sales</div>
          <div className="text-lg font-bold text-slate-800">৳{Number(referral.totalSales).toFixed(0)}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
          <div className="flex items-center gap-1 text-xs text-green-700 mb-1"><DollarSign size={12} /> Earned</div>
          <div className="text-lg font-bold text-green-700">৳{Number(referral.totalEarned).toFixed(0)}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-1 text-xs text-blue-700 mb-1">Paid</div>
          <div className="text-lg font-bold text-blue-700">৳{Number(referral.totalPaid).toFixed(0)}</div>
        </div>
      </div>

      {/* Pending Balance */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
        <div className="text-xs text-amber-700 mb-1">Pending Payout</div>
        <div className="text-2xl font-bold text-amber-700">
          ৳{(Number(referral.totalEarned) - Number(referral.totalPaid)).toFixed(2)}
        </div>
      </div>

      {/* Recent Referral Usage */}
      <h2 className="text-sm font-bold text-slate-600 mb-2">Recent Referrals</h2>
      {referral.usages?.length === 0 ? (
        <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">
          No referrals yet. Share your code to start earning!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {referral.usages.map((u: any) => (
            <div key={u.id} className="p-3 flex justify-between items-center">
              <div>
                <div className="text-sm text-slate-800">Order: ৳{Number(u.orderAmount).toFixed(2)}</div>
                <div className="text-xs text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-green-600">
                  +৳{Number(u.commissionAmount).toFixed(2)}
                </div>
                <div className={`text-xs ${
                  u.status === "PAID" ? "text-green-600" : "text-amber-600"
                }`}>{u.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

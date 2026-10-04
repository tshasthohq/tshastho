"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Star, TrendingUp, Gift, Award } from "lucide-react";

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/loyalty", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!data?.account) return <div className="p-6 text-center text-slate-500">No account</div>;

  const tierColor = (t: string) => {
    switch (t) {
      case "PLATINUM": return "from-slate-600 to-slate-800";
      case "GOLD": return "from-yellow-500 to-amber-600";
      case "SILVER": return "from-slate-400 to-slate-500";
      default: return "from-amber-600 to-orange-700";
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Star className="text-amber-500" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Loyalty Points</h1>
      </div>

      <div className={`bg-gradient-to-br ${tierColor(data.account.tier)} rounded-2xl p-5 text-white mb-4 shadow-lg`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award size={18} />
            <span className="text-xs text-white/80">{data.account.tier} Member</span>
          </div>
        </div>
        <div className="text-3xl font-bold mb-1">{data.account.points} points</div>
        <div className="text-sm text-white/80">Worth ৳{data.account.discountValue} discount</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <TrendingUp size={12} /> Lifetime Points
          </div>
          <div className="text-lg font-bold text-slate-800">{data.account.lifetimePoints}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <Gift size={12} /> Tier
          </div>
          <div className="text-lg font-bold text-slate-800">{data.account.tier}</div>
        </div>
      </div>

      <h2 className="text-sm font-bold text-slate-600 mb-2">History</h2>
      {data.transactions?.length === 0 ? (
        <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">
          No transactions yet. Shop to earn points!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {data.transactions.map((t: any) => (
            <div key={t.id} className="p-3 flex justify-between items-center">
              <div>
                <div className="text-sm text-slate-800">{t.description}</div>
                <div className="text-xs text-slate-500">
                  {new Date(t.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className={`font-bold text-sm ${t.points > 0 ? "text-green-600" : "text-red-600"}`}>
                {t.points > 0 ? "+" : ""}{t.points}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800">
        <strong>How it works:</strong> Earn 1 point for every ৳100 spent. 100 points = ৳100 discount. Tiers: Silver (1000 pts), Gold (5000 pts), Platinum (15000 pts).
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, Receipt,
  ShoppingCart, Package, Clock, ArrowRight, PiggyBank
} from "lucide-react";

export default function FinancePage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/pharmacy/finance/overview", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-center text-slate-500">No data</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="text-blue-600" size={24} />
        <h1 className="text-xl font-bold text-slate-800">Finance</h1>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <PiggyBank size={16} />
          <span className="text-xs text-blue-100">Current Balance</span>
        </div>
        <div className="text-3xl font-bold mb-3">৳ {Number(data.balance || 0).toFixed(2)}</div>
        {data.pendingSettlements?.count > 0 && (
          <div className="bg-white/10 rounded-xl p-2 text-xs flex justify-between items-center">
            <span>Pending Settlements ({data.pendingSettlements.count})</span>
            <span className="font-bold">৳ {Number(data.pendingSettlements.total).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Today's Stats */}
      <h2 className="text-sm font-bold text-slate-600 mb-2 mt-4">Today</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <TrendingUp size={12} /> Sales
          </div>
          <div className="text-lg font-bold text-slate-800">৳ {Number(data.today?.sales || 0).toFixed(0)}</div>
          <div className="text-xs text-slate-500">{data.today?.orderCount + data.today?.posCount} transactions</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <TrendingDown size={12} /> Expenses
          </div>
          <div className="text-lg font-bold text-red-600">৳ {Number(data.today?.expenses || 0).toFixed(0)}</div>
          <div className="text-xs text-slate-500">Today's spend</div>
        </div>
      </div>

      {/* This Month */}
      <h2 className="text-sm font-bold text-slate-600 mb-2">This Month</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Total Sales</div>
          <div className="text-base font-bold text-slate-800">৳ {Number(data.month?.sales || 0).toFixed(0)}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
          <div className="text-xs text-green-700 mb-1">POS Profit</div>
          <div className="text-base font-bold text-green-700">৳ {Number(data.month?.posProfit || 0).toFixed(0)}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Expenses</div>
          <div className="text-base font-bold text-red-600">৳ {Number(data.month?.expenses || 0).toFixed(0)}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Purchases</div>
          <div className="text-base font-bold text-slate-800">৳ {Number(data.month?.purchases || 0).toFixed(0)}</div>
        </div>
      </div>
// CONTINUES IN PART 2

      {/* Quick Actions */}
      <h2 className="text-sm font-bold text-slate-600 mb-2">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <Link href="/pharmacy/finance/expenses"
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <Receipt className="text-red-600" size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Expenses</div>
            <div className="text-xs text-slate-500">Manage</div>
          </div>
        </Link>

        <Link href="/pharmacy/finance/ledger"
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Wallet className="text-blue-600" size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Ledger</div>
            <div className="text-xs text-slate-500">All entries</div>
          </div>
        </Link>

        <Link href="/pharmacy/finance/daily-closing"
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <DollarSign className="text-green-600" size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Daily Close</div>
            <div className="text-xs text-slate-500">Cash count</div>
          </div>
        </Link>

        <Link href="/pharmacy/finance/settlements"
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <PiggyBank className="text-purple-600" size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Settlement</div>
            <div className="text-xs text-slate-500">Withdraw</div>
          </div>
        </Link>

        <Link href="/pharmacy/pos/sales"
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <ShoppingCart className="text-amber-600" size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">POS Sales</div>
            <div className="text-xs text-slate-500">View</div>
          </div>
        </Link>

        <Link href="/pharmacy/orders"
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <Package className="text-teal-600" size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Orders</div>
            <div className="text-xs text-slate-500">Online</div>
          </div>
        </Link>
      </div>
// CONTINUES IN PART 3

      {/* Recent Closings */}
      {data.recentClosings?.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-slate-600 mb-2 mt-4">Recent Daily Closings</h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {data.recentClosings.map((c: any) => (
              <div key={c.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    {new Date(c.closingDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    Sales: ৳{Number(c.totalSales + c.totalPosSales).toFixed(0)} • Expected cash: ৳{Number(c.expectedCash).toFixed(0)}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                    c.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {c.status}
                  </span>
                  {Number(c.difference) !== 0 && (
                    <div className={`text-xs font-medium mt-0.5 ${
                      Number(c.difference) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Number(c.difference) > 0 ? '+' : ''}৳{Number(c.difference).toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

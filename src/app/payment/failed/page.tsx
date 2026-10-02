"use client";

import Link from "next/link";
import { XCircle, Home, RefreshCw } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="text-red-600" size={48} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h1>
        <p className="text-slate-500 text-sm mb-6">
          We couldn't process your payment. Please try again or contact support.
        </p>

        <div className="flex gap-2">
          <Link
            href="/cart"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700"
          >
            <RefreshCw size={18} /> Try Again
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200"
          >
            <Home size={18} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

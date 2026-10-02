"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Home, FileText } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get("paymentId");
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (!paymentId) return;
    fetch(`/api/payments/${paymentId}/status`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => d.payment && setPayment(d.payment))
      .catch(() => {});
  }, [paymentId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h1>
        <p className="text-slate-500 text-sm mb-6">
          Your payment has been processed successfully.
        </p>

        {payment && (
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Payment ID</span>
              <span className="font-medium text-slate-800">{payment.paymentNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Amount</span>
              <span className="font-bold text-slate-800">৳ {Number(payment.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-medium text-green-600">{payment.status}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700"
          >
            <Home size={18} /> Dashboard
          </Link>
          <Link
            href="/dashboard/orders"
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200"
          >
            <FileText size={18} /> Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

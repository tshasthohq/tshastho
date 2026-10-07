'use client';

import { useEffect, useState } from 'react';

export default function ExpiryAlertBanner({ className }: { className?: string }) {
  const [t30, setT30] = useState(0);
  const [t60, setT60] = useState(0);
  const [t90, setT90] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/pharmacy/expiry-alerts?status=OPEN&limit=1')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.success) {
          setT30(j.summary?.T30 ?? 0);
          setT60(j.summary?.T60 ?? 0);
          setT90(j.summary?.T90 ?? 0);
        }
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const total = t30 + t60 + t90;
  if (loading || total === 0) return null;

  const color = t30 > 0 ? 'border-red-300 bg-red-50 text-red-800'
              : t60 > 0 ? 'border-orange-300 bg-orange-50 text-orange-800'
              : 'border-yellow-300 bg-yellow-50 text-yellow-800';

  return (
    <div className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 ${color} ${className ?? ''}`}>
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-medium">
          Expiry alerts: {t30} within 30d · {t60} within 60d · {t90} within 90d
        </span>
      </div>
      <a href="/pharmacy/expiry-alerts" className="rounded-md bg-white/70 px-3 py-1.5 text-xs font-medium hover:bg-white">
        Review
      </a>
    </div>
  );
}

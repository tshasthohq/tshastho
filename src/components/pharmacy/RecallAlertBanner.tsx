'use client';

// Top-of-page red banner if any OPEN drug recalls match this pharmacy's stock.
// Item 17

import { useEffect, useState } from 'react';

interface Props {
  pharmacyId: string;
  className?: string;
}

export default function RecallAlertBanner({ pharmacyId, className }: Props) {
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/pharmacy/recalls?status=OPEN&limit=1');
        const json = await res.json();
        if (!cancelled && json?.success) {
          setOpenCount(json.total ?? 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [pharmacyId]);

  if (loading || openCount === 0) return null;

  return (
    <div
      className={
        'flex items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 ' +
        (className ?? '')
      }
    >
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-medium text-red-800">
          {openCount} drug recall {openCount === 1 ? 'match' : 'matches'} need your attention
        </span>
      </div>
      <a
        href="/pharmacy/recalls"
        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
      >
        Review now
      </a>
    </div>
  );
}

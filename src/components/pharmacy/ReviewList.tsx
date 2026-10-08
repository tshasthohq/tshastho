'use client';

// Review list with rating summary + filters — Item 14

import { useEffect, useState, useCallback } from 'react';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  customer?: { id: string; name: string | null } | null;
  order?: { id: string; orderNumber: string } | null;
  replyText?: string | null;
  repliedAt?: string | null;
}

interface Summary {
  avgRating: number;
  totalReviews: number;
  ratingBreakdown?: Record<string, number> | null;
}

interface Props {
  pharmacyId: string;
  summary?: Summary;
  canReply?: boolean;
  onReply?: (reviewId: string) => void;
}

export default function ReviewList({ pharmacyId, summary, canReply, onReply }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ pharmacyId, limit: '20' });
      if (filterRating) params.set('rating', String(filterRating));
      const res = await fetch(`/api/pharmacy/reviews?${params.toString()}`);
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error ?? 'Failed to load');
      setReviews(json.reviews);
      setTotal(json.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, filterRating]);

  useEffect(() => {
    load();
  }, [load]);

  const avg = summary?.avgRating ?? 0;
  const count = summary?.totalReviews ?? total;
  const breakdown = summary?.ratingBreakdown ?? {};

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{avg.toFixed(1)}</div>
            <StarRating value={Math.round(avg)} readOnly size="sm" />
            <div className="mt-1 text-xs text-gray-500">{count} reviews</div>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = breakdown[String(n)] ?? 0;
              const pct = count > 0 ? (c / count) * 100 : 0;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFilterRating(filterRating === n ? null : n)}
                  className={`flex w-full items-center gap-2 text-xs ${
                    filterRating === n ? 'font-bold' : ''
                  }`}
                >
                  <span className="w-3">{n}</span>
                  <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.9 6.26 6.85.62-5.18 4.53 1.54 6.69L12 16.9l-6.11 3.2 1.54-6.69-5.18-4.53 6.85-.62L12 2z" />
                  </svg>
                  <div className="h-2 flex-1 overflow-hidden rounded bg-gray-200">
                    <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-gray-500">{c}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {loading && <p className="text-sm text-gray-500">Loading reviews…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && reviews.length === 0 && (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} canReply={canReply} onReply={onReply} />
        ))}
      </div>
    </div>
  );
}

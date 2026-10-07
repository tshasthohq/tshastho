'use client';

// Single review card — Item 14

import StarRating from './StarRating';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  createdAt: string | Date;
  customer?: { id: string; name: string | null } | null;
  order?: { id: string; orderNumber: string } | null;
  replyText?: string | null;
  repliedAt?: string | Date | null;
}

interface Props {
  review: Review;
  onReply?: (reviewId: string) => void;
  canReply?: boolean;
}

export default function ReviewCard({ review, onReply, canReply }: Props) {
  const date = new Date(review.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {review.customer?.name ?? 'Anonymous'}
            </span>
            {review.isVerified && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                ✓ Verified
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={review.rating} readOnly size="sm" />
            <span className="text-xs text-gray-500">{date}</span>
          </div>
        </div>
      </div>

      {review.title && (
        <h4 className="mt-3 text-sm font-semibold text-gray-900">{review.title}</h4>
      )}
      {review.comment && (
        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{review.comment}</p>
      )}

      {review.replyText && (
        <div className="mt-3 rounded-md border-l-4 border-blue-400 bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-900">Pharmacy reply</p>
          <p className="mt-1 text-sm text-blue-800 whitespace-pre-wrap">{review.replyText}</p>
        </div>
      )}

      {canReply && !review.replyText && onReply && (
        <button
          type="button"
          onClick={() => onReply(review.id)}
          className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Reply
        </button>
      )}
    </div>
  );
}

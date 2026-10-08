// Pharmacy Rating/Review service — Item 14

import { prisma } from '@/lib/prisma';

export interface CreateReviewParams {
  pharmacyId: string;
  orderId: string;
  customerId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface CreateReviewResult {
  ok: boolean;
  reviewId?: string;
  error?: string;
}

export interface ListReviewsParams {
  pharmacyId: string;
  status?: string;
  rating?: number;
  limit?: number;
  offset?: number;
}

const VALID_STATUSES = ['PUBLISHED', 'HIDDEN', 'DELETED'];

/**
 * Create a pharmacy review.
 * Rules:
 *  - rating 1..5
 *  - order must belong to this pharmacy
 *  - order must belong to this customer
 *  - order must be DELIVERED
 *  - one review per order (unique orderId)
 *  - fires recalcPharmacyRating after create
 */
export async function createPharmacyReview(
  params: CreateReviewParams,
): Promise<CreateReviewResult> {
  const { pharmacyId, orderId, customerId, rating, title, comment } = params;

  if (rating < 1 || rating > 5) {
    return { ok: false, error: 'Rating must be between 1 and 5' };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, pharmacyId: true, patientId: true, status: true },
  });
  if (!order) return { ok: false, error: 'Order not found' };
  if (order.pharmacyId !== pharmacyId) {
    return { ok: false, error: 'Order does not belong to this pharmacy' };
  }
  if (order.patientId !== customerId) {
    return { ok: false, error: 'Order does not belong to this customer' };
  }
  if (order.status !== 'DELIVERED') {
    return { ok: false, error: 'Only delivered orders can be reviewed' };
  }

  const existing = await prisma.pharmacyReview.findUnique({
    where: { orderId },
    select: { id: true },
  });
  if (existing) return { ok: false, error: 'This order has already been reviewed' };

  try {
    const review = await prisma.pharmacyReview.create({
      data: {
        pharmacyId,
        orderId,
        customerId,
        rating,
        title: title ?? null,
        comment: comment ?? null,
        isVerified: true,
      },
    });

    await recalcPharmacyRating(pharmacyId).catch((e) =>
      console.error('[RECALC_RATING]', pharmacyId, e),
    );

    return { ok: true, reviewId: review.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Unique constraint')) {
      return { ok: false, error: 'Duplicate review' };
    }
    return { ok: false, error: msg };
  }
}

/**
 * Recalculate pharmacy avgRating, totalReviews, ratingBreakdown.
 * ratingBreakdown = { "1": n, "2": n, ... "5": n }
 * Only PUBLISHED reviews count.
 */
export async function recalcPharmacyRating(pharmacyId: string): Promise<void> {
  const rows = await prisma.pharmacyReview.groupBy({
    by: ['rating'],
    where: { pharmacyId, status: 'PUBLISHED' },
    _count: { rating: true },
  });

  const breakdown: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let total = 0;
  let sum = 0;
  for (const r of rows) {
    const key = String(r.rating);
    const count = r._count.rating;
    if (key in breakdown) breakdown[key] = count;
    total += count;
    sum += r.rating * count;
  }
  const avg = total > 0 ? sum / total : 0;

  await prisma.pharmacy.update({
    where: { id: pharmacyId },
    data: {
      avgRating: avg,
      totalReviews: total,
      ratingBreakdown: breakdown as object,
    },
  });
}

/**
 * List pharmacy reviews (paginated, filter by status + rating).
 */
export async function listPharmacyReviews(params: ListReviewsParams) {
  const {
    pharmacyId,
    status,
    rating,
    limit = 20,
    offset = 0,
  } = params;

  const safeLimit = Math.min(100, Math.max(1, limit));
  const safeOffset = Math.max(0, offset);

  const where = {
    pharmacyId,
    ...(status && VALID_STATUSES.includes(status) ? { status } : {}),
    ...(rating && rating >= 1 && rating <= 5 ? { rating } : {}),
  };

  const [reviews, total] = await Promise.all([
    prisma.pharmacyReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      skip: safeOffset,
      include: {
        customer: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    }),
    prisma.pharmacyReview.count({ where }),
  ]);

  return { reviews, total, limit: safeLimit, offset: safeOffset };
}

/**
 * Moderate a review: HIDE | SHOW | DELETE.
 */
export async function moderateReview(params: {
  reviewId: string;
  action: 'HIDE' | 'SHOW' | 'DELETE';
  reason?: string;
  byUserId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { reviewId, action, reason, byUserId } = params;

  const review = await prisma.pharmacyReview.findUnique({
    where: { id: reviewId },
    select: { id: true, pharmacyId: true },
  });
  if (!review) return { ok: false, error: 'Review not found' };

  const statusMap: Record<typeof action, string> = {
    HIDE: 'HIDDEN',
    SHOW: 'PUBLISHED',
    DELETE: 'DELETED',
  };

  await prisma.pharmacyReview.update({
    where: { id: reviewId },
    data: {
      status: statusMap[action],
      ...(action === 'HIDE' || action === 'DELETE'
        ? { flaggedBy: byUserId, flagReason: reason ?? null }
        : { flaggedBy: null, flagReason: null }),
    },
  });

  await recalcPharmacyRating(review.pharmacyId).catch((e) =>
    console.error('[RECALC_RATING]', review.pharmacyId, e),
  );

  return { ok: true };
}

/**
 * Pharmacy owner reply to a review.
 */
export async function replyToReview(params: {
  reviewId: string;
  pharmacyId: string;
  replyText: string;
  byUserId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { reviewId, pharmacyId, replyText, byUserId } = params;

  const review = await prisma.pharmacyReview.findUnique({
    where: { id: reviewId },
    select: { id: true, pharmacyId: true },
  });
  if (!review) return { ok: false, error: 'Review not found' };
  if (review.pharmacyId !== pharmacyId) {
    return { ok: false, error: 'Review does not belong to this pharmacy' };
  }

  await prisma.pharmacyReview.update({
    where: { id: reviewId },
    data: {
      replyText,
      repliedAt: new Date(),
      repliedBy: byUserId,
    },
  });

  return { ok: true };
}

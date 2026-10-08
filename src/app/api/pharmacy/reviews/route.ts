// POST /api/pharmacy/reviews — create review
// GET  /api/pharmacy/reviews?pharmacyId=... — list reviews

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import {
  createPharmacyReview,
  listPharmacyReviews,
} from '@/lib/pharmacy/reviews';
import { z } from 'zod';

const createSchema = z.object({
  pharmacyId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(['PATIENT', 'CUSTOMER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const result = await createPharmacyReview({
      pharmacyId: data.pharmacyId,
      orderId: data.orderId,
      customerId: user.id,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
    });

    if (!result.ok) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, result.error ?? 'Failed', 400);
    }
    return NextResponse.json({ success: true, reviewId: result.reviewId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[REVIEW_CREATE]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create review', 500);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pharmacyId = url.searchParams.get('pharmacyId');
    if (!pharmacyId) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'pharmacyId required', 400);
    }

    const ratingRaw = url.searchParams.get('rating');
    const rating = ratingRaw ? parseInt(ratingRaw, 10) : undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    const result = await listPharmacyReviews({
      pharmacyId,
      status: url.searchParams.get('status') ?? 'PUBLISHED',
      rating: rating && rating >= 1 && rating <= 5 ? rating : undefined,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[REVIEW_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch reviews', 500);
  }
}

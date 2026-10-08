// POST /api/pharmacy/reviews/[id]/moderate — HIDE | SHOW | DELETE

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { moderateReview } from '@/lib/pharmacy/reviews';
import { z } from 'zod';

const schema = z.object({
  action: z.enum(['HIDE', 'SHOW', 'DELETE']),
  reason: z.string().max(300).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['SUPER_ADMIN', 'PHARMACY_OWNER']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const result = await moderateReview({
      reviewId: id,
      action: data.action,
      reason: data.reason,
      byUserId: user.id,
    });

    if (!result.ok) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, result.error ?? 'Failed', 400);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[REVIEW_MODERATE]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Moderation failed', 500);
  }
}

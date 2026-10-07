// POST /api/pharmacy/reviews/[id]/reply — pharmacy owner replies

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { replyToReview } from '@/lib/pharmacy/reviews';
import { z } from 'zod';

const schema = z.object({
  replyText: z.string().min(1).max(1000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Resolve pharmacyId
    let pharmacyId: string | null = user.parentPharmacyId ?? null;
    if (user.role === 'PHARMACY_OWNER') {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id ?? null;
    }
    if (!pharmacyId && user.role !== 'SUPER_ADMIN') {
      return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);
    }

    const result = await replyToReview({
      reviewId: id,
      pharmacyId: pharmacyId ?? '',
      replyText: data.replyText,
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
    console.error('[REVIEW_REPLY]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Reply failed', 500);
  }
}

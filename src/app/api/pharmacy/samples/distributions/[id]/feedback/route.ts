// POST /api/pharmacy/samples/distributions/[id]/feedback — Item 37

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { addDistributionFeedback } from '@/lib/pharmacy/samples';
import { z } from 'zod';

const schema = z.object({ feedback: z.string().min(1).max(1000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  try {
    let pharmacyId: string | null = user.parentPharmacyId ?? null;
    if (user.role === 'PHARMACY_OWNER') {
      const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = p?.id ?? null;
    }
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const data = schema.parse(await req.json());
    const updated = await addDistributionFeedback({
      distributionId: id,
      pharmacyId,
      feedback: data.feedback,
    });
    return NextResponse.json({ success: true, distribution: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    const msg = error instanceof Error ? error.message : 'Failed';
    console.error('[SAMPLE_FEEDBACK]', error);
    return errorResponse(ErrorCodes.VALIDATION_ERROR, msg, 400);
  }
}

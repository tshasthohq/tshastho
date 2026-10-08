// POST /api/pharmacy/returns/[id]/retry-refund
// Manually retry a FAILED or PENDING refund for a processed return — Item 13

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { processReturnRefund } from '@/lib/pharmacy/refund-service';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  try {
    const ret = await prisma.returnOrder.findUnique({
      where: { id },
      select: {
        id: true,
        pharmacyId: true,
        type: true,
        status: true,
        refundStatus: true,
        refundAttempts: true,
      },
    });
    if (!ret) {
      return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Return not found', 404);
    }

    // Scope check
    if (user.role !== 'SUPER_ADMIN') {
      let pharmacyId: string | null = user.parentPharmacyId ?? null;
      if (user.role === 'PHARMACY_OWNER') {
        const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
        pharmacyId = pharmacy?.id ?? null;
      }
      if (!pharmacyId || ret.pharmacyId !== pharmacyId) {
        return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Return not found', 404);
      }
    }

    if (ret.type !== 'CUSTOMER_RETURN') {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Only customer returns support refund retry',
        400,
      );
    }
    if (ret.status !== 'PROCESSED') {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Return must be in PROCESSED state',
        400,
      );
    }
    if (ret.refundStatus === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Refund already completed' },
        { status: 409 },
      );
    }
    if (ret.refundAttempts >= 5) {
      return NextResponse.json(
        { success: false, error: 'Max retry attempts reached (5)' },
        { status: 429 },
      );
    }

    const result = await processReturnRefund({ returnId: id, userId: user.id });

    if (!result.ok) {
      return NextResponse.json({ success: false, ...result }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[RETURN_REFUND_RETRY]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Retry failed', 500);
  }
}

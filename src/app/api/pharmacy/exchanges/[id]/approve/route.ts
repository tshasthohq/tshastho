// POST /api/pharmacy/exchanges/[id]/approve — Item 38

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  try {
    const ret = await prisma.returnOrder.findUnique({ where: { id } });
    if (!ret) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Exchange not found', 404);
    if (ret.status !== 'PENDING') return errorResponse(ErrorCodes.CONFLICT, 'Already processed', 409);

    const updated = await prisma.returnOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, exchange: updated });
  } catch (error) {
    console.error('[EXCHANGE_APPROVE]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

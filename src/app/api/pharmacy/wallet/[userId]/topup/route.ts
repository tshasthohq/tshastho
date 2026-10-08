// POST /api/pharmacy/wallet/[userId]/topup — staff cash top-up — Item 36

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { walletTopUp } from '@/lib/wallet';
import { z } from 'zod';

const schema = z.object({
  amount: z.number().positive().max(500000),
  notes: z.string().max(300).optional(),
  referenceNumber: z.string().max(80).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { userId } = await params;

  try {
    let pharmacyId: string | null = user.parentPharmacyId ?? null;
    if (user.role === 'PHARMACY_OWNER') {
      const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = p?.id ?? null;
    }

    const data = schema.parse(await req.json());

    const result = await walletTopUp({
      userId,
      amount: data.amount,
      ctx: {
        vertical: 'PHARMACY',
        contextId: pharmacyId ?? undefined,
        referenceType: 'TOPUP_CASH',
        referenceNumber: data.referenceNumber,
        description: 'Cash top-up at pharmacy counter',
        notes: data.notes,
        createdBy: user.id,
        createdByRole: user.role,
      },
    });

    if (!result.ok) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, result.error ?? 'Failed', 400);
    }

    return NextResponse.json({
      success: true,
      txnId: result.txnId,
      balanceAfter: result.balanceAfter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[WALLET_TOPUP]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Top-up failed', 500);
  }
}

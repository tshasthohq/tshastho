// POST /api/wallet/internal/spend — service-role spend trigger — Item 36

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { walletSpend } from '@/lib/wallet';
import { z } from 'zod';

const schema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive(),
  vertical: z.enum(['PHARMACY', 'DOCTOR', 'DIAGNOSTIC', 'DELIVERY', 'HOSPITAL', 'INTERNATIONAL', 'PLATFORM']),
  contextId: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  referenceNumber: z.string().optional(),
  description: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'DOCTOR', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const data = schema.parse(await req.json());
    const result = await walletSpend({
      userId: data.userId,
      amount: data.amount,
      ctx: {
        vertical: data.vertical,
        contextId: data.contextId,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        referenceNumber: data.referenceNumber,
        description: data.description,
        idempotencyKey: data.idempotencyKey,
        createdBy: user.id,
        createdByRole: user.role,
      },
    });

    if (!result.ok) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, result.error ?? 'Spend failed', 400);
    }
    return NextResponse.json({ success: true, txnId: result.txnId, balanceAfter: result.balanceAfter });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[WALLET_SPEND]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Spend failed', 500);
  }
}

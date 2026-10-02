import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { generatePayoutNumber } from '@/lib/payments/utils';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';

const schema = z.object({
  partnerId: z.string().min(1),
  partnerType: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const payout = await prisma.payout.create({
      data: {
        payoutNumber: generatePayoutNumber(),
        partnerId: data.partnerId,
        partnerType: data.partnerType,
        amount: data.amount,
        method: data.method,
        status: 'PENDING',
        metadata: { notes: data.notes, initiatedBy: auth.user!.id },
      },
    });

    return NextResponse.json({ success: true, payout }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[PAYOUT]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Payout failed', 500);
  }
}

export async function GET() {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ success: true, payouts });
}

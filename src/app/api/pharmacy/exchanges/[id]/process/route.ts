// POST /api/pharmacy/exchanges/[id]/process — Item 38
// Restock IN items + deduct OUT items. Difference settlement manual (cash at counter).

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { processExchange } from '@/lib/pharmacy/exchanges';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  const result = await processExchange({ exchangeId: id, userId: user.id });
  if (!result.ok) {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, result.error ?? 'Failed', 400);
  }
  return NextResponse.json({ success: true });
}

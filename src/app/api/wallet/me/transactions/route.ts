// GET /api/wallet/me/transactions — own history — Item 36

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { listWalletTransactions } from '@/lib/wallet';

export async function GET(req: Request) {
  const auth = await requireRole(['PATIENT', 'CUSTOMER', 'PHARMACY_OWNER', 'PHARMACY_STAFF', 'DOCTOR', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const url = new URL(req.url);
    const result = await listWalletTransactions({
      userId: user.id,
      vertical: url.searchParams.get('vertical') ?? undefined,
      type: url.searchParams.get('type') ?? undefined,
      limit: parseInt(url.searchParams.get('limit') ?? '20', 10),
      offset: parseInt(url.searchParams.get('offset') ?? '0', 10),
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[WALLET_TXN_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

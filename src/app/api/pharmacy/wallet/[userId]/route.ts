// GET /api/pharmacy/wallet/[userId] — staff view customer wallet — Item 36

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { getOrCreateWallet, listWalletTransactions } from '@/lib/wallet';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const { userId } = await params;

  try {
    const wallet = await getOrCreateWallet(userId);
    const url = new URL(req.url);
    const txns = await listWalletTransactions({
      userId,
      vertical: url.searchParams.get('vertical') ?? 'PHARMACY',
      limit: parseInt(url.searchParams.get('limit') ?? '20', 10),
      offset: parseInt(url.searchParams.get('offset') ?? '0', 10),
    });

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: Number(wallet.balance),
        availableBalance: Number(wallet.availableBalance),
        currency: wallet.currency,
        isActive: wallet.isActive,
        isFrozen: wallet.isFrozen,
        totalTopUp: Number(wallet.totalTopUp),
        totalSpent: Number(wallet.totalSpent),
      },
      transactions: txns,
    });
  } catch (error) {
    console.error('[PHARMACY_WALLET_VIEW]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

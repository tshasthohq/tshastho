// GET /api/wallet/me — own wallet balance + stats — Item 36

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { getOrCreateWallet } from '@/lib/wallet';

export async function GET() {
  const auth = await requireRole(['PATIENT', 'CUSTOMER', 'PHARMACY_OWNER', 'PHARMACY_STAFF', 'DOCTOR', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const wallet = await getOrCreateWallet(user.id);
    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        balance: Number(wallet.balance),
        availableBalance: Number(wallet.availableBalance),
        holdBalance: Number(wallet.holdBalance),
        currency: wallet.currency,
        totalTopUp: Number(wallet.totalTopUp),
        totalSpent: Number(wallet.totalSpent),
        totalEarnings: Number(wallet.totalEarnings),
        totalRefunds: Number(wallet.totalRefunds),
        isActive: wallet.isActive,
        isFrozen: wallet.isFrozen,
        kycLevel: wallet.kycLevel,
      },
    });
  } catch (error) {
    console.error('[WALLET_ME]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
import { getOrCreateAccount, pointsToDiscount } from '@/lib/pharmacy/loyalty';

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user!;

  const account = await getOrCreateAccount(user.id);

  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    success: true,
    account: {
      ...account,
      discountValue: pointsToDiscount(account.points),
    },
    transactions,
  });
}

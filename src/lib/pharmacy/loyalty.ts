import { prisma } from '@/lib/prisma';
import { getTierBenefit } from './tier-benefits';

const POINTS_PER_TAKA = 1;
const TAKA_PER_POINT = 1;
const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 15000,
};

export function calculateTier(lifetimePoints: number): string {
  if (lifetimePoints >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
  if (lifetimePoints >= TIER_THRESHOLDS.GOLD) return 'GOLD';
  if (lifetimePoints >= TIER_THRESHOLDS.SILVER) return 'SILVER';
  return 'BRONZE';
}

export async function getOrCreateAccount(userId: string) {
  let account = await prisma.loyaltyAccount.findUnique({ where: { userId } });
  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: { userId, points: 0, lifetimePoints: 0, tier: 'BRONZE' },
    });
  }
  return account;
}

export async function earnPoints(params: {
  userId: string;
  amount: number;
  referenceId?: string;
  referenceType?: string;
  description?: string;
}) {
  const pointsToEarn = Math.floor((params.amount / 100) * POINTS_PER_TAKA);
  if (pointsToEarn <= 0) return null;

  return await prisma.$transaction(async (tx) => {
    let account = await tx.loyaltyAccount.findUnique({ where: { userId: params.userId } });
    if (!account) {
      account = await tx.loyaltyAccount.create({
        data: { userId: params.userId, points: 0, lifetimePoints: 0, tier: 'BRONZE' },
      });
    }

    const oldTier = account.tier;
    const newBalance = account.points + pointsToEarn;
    const newLifetime = account.lifetimePoints + pointsToEarn;
    const newTier = calculateTier(newLifetime);

    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newBalance, lifetimePoints: newLifetime, tier: newTier },
    });

    // Log tier change if upgraded
    if (oldTier !== newTier) {
      await tx.loyaltyTierHistory.create({
        data: {
          userId: params.userId,
          oldTier,
          newTier,
          reason: 'THRESHOLD_REACHED',
        },
      }).catch(() => {});

      // Notify user
      const tierInfo = getTierBenefit(newTier);
      await tx.notification.create({
        data: {
          userId: params.userId,
          title: `🎉 Welcome to ${tierInfo.label}!`,
          message: `You've reached ${tierInfo.label} tier. Enjoy: ${tierInfo.benefits.join(', ')}`,
          type: 'success',
          category: 'LOYALTY',
          link: '/dashboard/loyalty',
        },
      }).catch(() => {});
    }

    return await tx.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        type: 'EARN',
        points: pointsToEarn,
        balance: newBalance,
        referenceId: params.referenceId || null,
        referenceType: params.referenceType || null,
        description: params.description || `Earned on ৳${params.amount} purchase`,
      },
    });
  });
}

export async function redeemPoints(params: {
  userId: string;
  points: number;
  referenceId?: string;
  description?: string;
}) {
  if (params.points <= 0) throw new Error('Invalid points');

  return await prisma.$transaction(async (tx) => {
    const account = await tx.loyaltyAccount.findUnique({ where: { userId: params.userId } });
    if (!account) throw new Error('No loyalty account');
    if (account.points < params.points) throw new Error('Insufficient points');

    const newBalance = account.points - params.points;

    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newBalance },
    });

    return await tx.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        type: 'REDEEM',
        points: -params.points,
        balance: newBalance,
        referenceId: params.referenceId || null,
        referenceType: 'REDEEM',
        description: params.description || `Redeemed ${params.points} points`,
      },
    });
  });
}

export function pointsToDiscount(points: number): number {
  return points * TAKA_PER_POINT;
}

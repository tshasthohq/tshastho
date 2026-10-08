export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface TierBenefit {
  tier: LoyaltyTier;
  label: string;
  minLifetimePoints: number;
  discountPercent: number;
  pointsMultiplier: number;
  bgColor: string;
  icon: string;
  benefits: string[];
}

export const TIERS: TierBenefit[] = [
  { tier: 'BRONZE', label: 'Bronze', minLifetimePoints: 0, discountPercent: 0, pointsMultiplier: 1, bgColor: 'bg-gradient-to-br from-amber-600 to-orange-700', icon: '🥉', benefits: ['Basic loyalty points', 'Order history'] },
  { tier: 'SILVER', label: 'Silver', minLifetimePoints: 1000, discountPercent: 2, pointsMultiplier: 1.5, bgColor: 'bg-gradient-to-br from-slate-400 to-slate-600', icon: '🥈', benefits: ['2% extra discount', '1.5x points', 'Priority support'] },
  { tier: 'GOLD', label: 'Gold', minLifetimePoints: 5000, discountPercent: 5, pointsMultiplier: 2, bgColor: 'bg-gradient-to-br from-yellow-500 to-amber-600', icon: '🥇', benefits: ['5% discount', '2x points', 'Free delivery', 'Priority support'] },
  { tier: 'PLATINUM', label: 'Platinum', minLifetimePoints: 15000, discountPercent: 10, pointsMultiplier: 3, bgColor: 'bg-gradient-to-br from-slate-700 to-slate-900', icon: '💎', benefits: ['10% discount', '3x points', 'Free delivery', 'Dedicated agent'] },
];

export function getTierBenefit(tier: string): TierBenefit {
  return TIERS.find((t) => t.tier === tier) || TIERS[0];
}

export function getNextTier(current: string): TierBenefit | null {
  const idx = TIERS.findIndex((t) => t.tier === current);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

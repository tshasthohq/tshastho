// Wallet core helpers — Item 36
import { prisma } from '@/lib/prisma';

export async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.walletAccount.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.walletAccount.create({ data: { userId } });
  }
  return wallet;
}

export async function getWallet(userId: string) {
  return prisma.walletAccount.findUnique({ where: { userId } });
}

export async function isWalletUsable(userId: string) {
  const w = await prisma.walletAccount.findUnique({
    where: { userId },
    select: { isActive: true, isFrozen: true, frozenReason: true },
  });
  if (!w) return { ok: false, error: 'Wallet not found' };
  if (!w.isActive) return { ok: false, error: 'Wallet inactive' };
  if (w.isFrozen) return { ok: false, error: w.frozenReason ?? 'Wallet frozen' };
  return { ok: true };
}

export async function freezeWallet(userId: string, reason: string) {
  return prisma.walletAccount.update({
    where: { userId },
    data: { isFrozen: true, frozenReason: reason },
  });
}

export async function unfreezeWallet(userId: string) {
  return prisma.walletAccount.update({
    where: { userId },
    data: { isFrozen: false, frozenReason: null },
  });
}

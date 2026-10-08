// Wallet transaction engine — Item 36
import { prisma } from '@/lib/prisma';
import { CREDIT_TYPES, type TxnType, type Direction, type Vertical } from './constants';

export interface ApplyTxnParams {
  userId: string;
  type: TxnType;
  amount: number;
  vertical?: Vertical;
  contextId?: string;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  idempotencyKey?: string;
  description?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  createdByRole?: string;
}

export interface ApplyTxnResult {
  ok: boolean;
  txnId?: string;
  balanceAfter?: number;
  error?: string;
  idempotentReplay?: boolean;
}

export async function applyWalletTxn(params: ApplyTxnParams): Promise<ApplyTxnResult> {
  const {
    userId, type, amount, vertical = 'PLATFORM', contextId, referenceType,
    referenceId, referenceNumber, idempotencyKey, description, notes,
    metadata, createdBy, createdByRole,
  } = params;

  if (amount <= 0) return { ok: false, error: 'Amount must be positive' };

  if (idempotencyKey) {
    const existing = await prisma.walletTransaction.findUnique({
      where: { idempotencyKey },
      select: { id: true, balanceAfter: true },
    });
    if (existing) {
      return { ok: true, txnId: existing.id, balanceAfter: Number(existing.balanceAfter), idempotentReplay: true };
    }
  }

  const direction: Direction = CREDIT_TYPES.includes(type) ? 'CREDIT' : 'DEBIT';

  try {
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.walletAccount.findUnique({
        where: { userId },
        select: { id: true, balance: true, isActive: true, isFrozen: true, frozenReason: true },
      });
      if (!wallet) throw new Error('Wallet not found');
      if (!wallet.isActive) throw new Error('Wallet inactive');
      if (wallet.isFrozen) throw new Error(wallet.frozenReason ?? 'Wallet frozen');

      const balanceBefore = Number(wallet.balance);
      const delta = direction === 'CREDIT' ? amount : -amount;
      const balanceAfter = balanceBefore + delta;

      if (balanceAfter < 0) {
        throw new Error(`Insufficient balance. Available: ${balanceBefore.toFixed(2)}, required: ${amount.toFixed(2)}`);
      }

      const updated = await tx.walletAccount.updateMany({
        where: {
          id: wallet.id,
          ...(direction === 'DEBIT' ? { balance: { gte: amount } } : {}),
        },
        data: {
          balance: { increment: delta },
          ...(type === 'TOPUP' ? { totalTopUp: { increment: amount } } : {}),
          ...(type === 'SPEND' ? { totalSpent: { increment: amount } } : {}),
          ...(type === 'EARN' ? { totalEarnings: { increment: amount } } : {}),
          ...(type === 'REFUND' ? { totalRefunds: { increment: amount } } : {}),
        },
      });
      if (updated.count === 0) throw new Error('Balance update failed — concurrent modification');

      const txn = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          direction,
          amount,
          balanceBefore,
          balanceAfter,
          vertical,
          contextId: contextId ?? null,
          referenceType: referenceType ?? null,
          referenceId: referenceId ?? null,
          referenceNumber: referenceNumber ?? null,
          idempotencyKey: idempotencyKey ?? null,
          description: description ?? null,
          notes: notes ?? null,
          metadata: (metadata as object) ?? undefined,
          createdBy: createdBy ?? null,
          createdByRole: createdByRole ?? null,
          status: 'COMPLETED',
        },
      });

      return { txnId: txn.id, balanceAfter };
    });

    return { ok: true, txnId: result.txnId, balanceAfter: result.balanceAfter };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listWalletTransactions(params: {
  userId: string;
  vertical?: string;
  type?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const wallet = await prisma.walletAccount.findUnique({
    where: { userId: params.userId },
    select: { id: true },
  });
  if (!wallet) return { items: [], total: 0, limit: 0, offset: 0 };

  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const offset = Math.max(0, params.offset ?? 0);

  const where = {
    walletId: wallet.id,
    ...(params.vertical ? { vertical: params.vertical } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.from || params.to
      ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return { items, total, limit, offset };
}

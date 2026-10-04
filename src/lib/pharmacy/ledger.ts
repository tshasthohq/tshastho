import { prisma } from '@/lib/prisma';

export type LedgerEntryType =
  | 'SALE'
  | 'POS_SALE'
  | 'PURCHASE'
  | 'EXPENSE'
  | 'PAYMENT_RECEIVED'
  | 'REFUND'
  | 'SETTLEMENT'
  | 'ADJUSTMENT';

export type LedgerDirection = 'CREDIT' | 'DEBIT';

interface RecordEntryParams {
  pharmacyId: string;
  entryType: LedgerEntryType;
  direction: LedgerDirection;
  amount: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  createdById?: string;
  metadata?: any;
}

/**
 * Records a ledger entry with running balance.
 * CREDIT = money in (increases balance)
 * DEBIT = money out (decreases balance)
 */
export async function recordLedgerEntry(params: RecordEntryParams) {
  const {
    pharmacyId,
    entryType,
    direction,
    amount,
    description,
    referenceId,
    referenceType,
    createdById,
    metadata,
  } = params;

  return await prisma.$transaction(async (tx) => {
    // Get last balance
    const last = await tx.pharmacyLedger.findFirst({
      where: { pharmacyId },
      orderBy: { createdAt: 'desc' },
      select: { balance: true },
    });

    const previousBalance = Number(last?.balance || 0);
    const newBalance = direction === 'CREDIT'
      ? previousBalance + amount
      : previousBalance - amount;

    const entry = await tx.pharmacyLedger.create({
      data: {
        pharmacyId,
        entryType: entryType as any,
        direction: direction as any,
        amount,
        balance: newBalance,
        description: description || null,
        referenceId: referenceId || null,
        referenceType: referenceType || null,
        createdById: createdById || null,
        metadata: metadata || undefined,
      },
    });

    return entry;
  });
}

/**
 * Gets current balance for a pharmacy.
 */
export async function getCurrentBalance(pharmacyId: string): Promise<number> {
  const last = await prisma.pharmacyLedger.findFirst({
    where: { pharmacyId },
    orderBy: { createdAt: 'desc' },
    select: { balance: true },
  });
  return Number(last?.balance || 0);
}

/**
 * Gets ledger summary for a date range.
 */
export async function getLedgerSummary(
  pharmacyId: string,
  startDate: Date,
  endDate: Date
) {
  const entries = await prisma.pharmacyLedger.groupBy({
    by: ['entryType', 'direction'],
    where: {
      pharmacyId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const summary: any = {
    totalCredit: 0,
    totalDebit: 0,
    byType: {},
  };

  entries.forEach((e) => {
    const amt = Number(e._sum.amount || 0);
    if (e.direction === 'CREDIT') summary.totalCredit += amt;
    else summary.totalDebit += amt;

    if (!summary.byType[e.entryType]) {
      summary.byType[e.entryType] = { credit: 0, debit: 0, count: 0 };
    }
    if (e.direction === 'CREDIT') summary.byType[e.entryType].credit += amt;
    else summary.byType[e.entryType].debit += amt;
    summary.byType[e.entryType].count += e._count._all;
  });

  summary.netFlow = summary.totalCredit - summary.totalDebit;
  return summary;
}

/**
 * Auto-record from order placement (called by order API).
 */
export async function recordOrderSale(params: {
  pharmacyId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  createdById?: string;
}) {
  return recordLedgerEntry({
    pharmacyId: params.pharmacyId,
    entryType: 'SALE',
    direction: 'CREDIT',
    amount: params.amount,
    description: `Online order ${params.orderNumber}`,
    referenceId: params.orderId,
    referenceType: 'Order',
    createdById: params.createdById,
  });
}

/**
 * Auto-record from POS sale.
 */
export async function recordPosSale(params: {
  pharmacyId: string;
  saleId: string;
  saleNumber: string;
  amount: number;
  createdById?: string;
}) {
  return recordLedgerEntry({
    pharmacyId: params.pharmacyId,
    entryType: 'POS_SALE',
    direction: 'CREDIT',
    amount: params.amount,
    description: `POS sale ${params.saleNumber}`,
    referenceId: params.saleId,
    referenceType: 'PosSale',
    createdById: params.createdById,
  });
}

/**
 * Auto-record purchase (money out).
 */
export async function recordPurchase(params: {
  pharmacyId: string;
  purchaseId: string;
  purchaseNumber: string;
  amount: number;
  createdById?: string;
}) {
  return recordLedgerEntry({
    pharmacyId: params.pharmacyId,
    entryType: 'PURCHASE',
    direction: 'DEBIT',
    amount: params.amount,
    description: `Purchase ${params.purchaseNumber}`,
    referenceId: params.purchaseId,
    referenceType: 'PurchaseOrder',
    createdById: params.createdById,
  });
}

/**
 * Auto-record expense (money out).
 */
export async function recordExpense(params: {
  pharmacyId: string;
  expenseId: string;
  description: string;
  amount: number;
  createdById?: string;
}) {
  return recordLedgerEntry({
    pharmacyId: params.pharmacyId,
    entryType: 'EXPENSE',
    direction: 'DEBIT',
    amount: params.amount,
    description: params.description,
    referenceId: params.expenseId,
    referenceType: 'PharmacyExpense',
    createdById: params.createdById,
  });
}

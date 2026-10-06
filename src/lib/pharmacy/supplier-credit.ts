import { prisma } from '@/lib/prisma';

function genCreditNumber(seq: number) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `SCN-${y}${m}-${String(seq + 1).padStart(5, '0')}`;
}

/**
 * Issues a supplier credit note after a return is processed.
 */
export async function issueSupplierCredit(params: {
  pharmacyId: string;
  supplierId: string;
  returnOrderId: string;
  amount: number;
  originalPurchaseId?: string;
  notes?: string;
  userId: string;
}) {
  // Prevent duplicate
  const existing = await prisma.supplierCreditNote.findUnique({
    where: { returnOrderId: params.returnOrderId },
  });
  if (existing) return existing;

  const count = await prisma.supplierCreditNote.count({ where: { pharmacyId: params.pharmacyId } });
  const creditNumber = genCreditNumber(count);

  return prisma.supplierCreditNote.create({
    data: {
      creditNumber,
      pharmacyId: params.pharmacyId,
      supplierId: params.supplierId,
      returnOrderId: params.returnOrderId,
      originalPurchaseId: params.originalPurchaseId || null,
      amount: params.amount,
      balance: params.amount,
      status: 'ISSUED',
      notes: params.notes || null,
      issuedById: params.userId,
    },
  });
}

/**
 * Applies a credit note to a supplier's balance (e.g., against a purchase).
 */
export async function applyCredit(params: {
  creditNoteId: string;
  amount: number;
  userId: string;
}) {
  const credit = await prisma.supplierCreditNote.findUnique({ where: { id: params.creditNoteId } });
  if (!credit) throw new Error('Credit note not found');
  if (credit.status === 'VOIDED') throw new Error('Credit note is voided');

  const applyAmount = Math.min(params.amount, Number(credit.balance));
  if (applyAmount <= 0) throw new Error('Invalid amount');

  const newApplied = Number(credit.appliedAmount) + applyAmount;
  const newBalance = Number(credit.amount) - newApplied;
  const newStatus = newBalance <= 0 ? 'APPLIED' : 'PARTIALLY_APPLIED';

  return prisma.supplierCreditNote.update({
    where: { id: params.creditNoteId },
    data: {
      appliedAmount: newApplied,
      balance: newBalance,
      status: newStatus,
    },
  });
}

/**
 * Voids a credit note.
 */
export async function voidCredit(creditNoteId: string, reason: string, userId: string) {
  return prisma.supplierCreditNote.update({
    where: { id: creditNoteId },
    data: {
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedReason: reason,
    },
  });
}

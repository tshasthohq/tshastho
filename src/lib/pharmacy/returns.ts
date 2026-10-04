import { prisma } from '@/lib/prisma';
import { recordStockMovement } from './stock';
import { recordLedgerEntry } from './ledger';

export type ReturnType = 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN' | 'DAMAGE_WRITE_OFF' | 'EXPIRED_WRITE_OFF';

function generateReturnNumber(type: ReturnType, seq: number) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const prefix = type === 'CUSTOMER_RETURN' ? 'RET-C' :
                 type === 'SUPPLIER_RETURN' ? 'RET-S' :
                 type === 'DAMAGE_WRITE_OFF' ? 'DMG' : 'EXP';
  return `${prefix}-${y}${m}-${String(seq).padStart(4, '0')}`;
}

export async function getNextReturnNumber(pharmacyId: string, type: ReturnType) {
  const count = await prisma.returnOrder.count({ where: { pharmacyId, type } });
  return generateReturnNumber(type, count + 1);
}

interface ProcessReturnParams {
  returnId: string;
  userId: string;
}

/**
 * Process an approved return:
 * - CUSTOMER_RETURN: restock items (if usable), refund customer
 * - SUPPLIER_RETURN: reduce stock, credit from supplier
 * - DAMAGE/EXPIRED: reduce stock, no financial impact (already debited)
 */
export async function processReturn(params: ProcessReturnParams) {
  const { returnId, userId } = params;

  return await prisma.$transaction(async (tx) => {
    const ret = await tx.returnOrder.findUnique({
      where: { id: returnId },
      include: { items: true },
    });
    if (!ret) throw new Error('Return not found');
    if (ret.status !== 'APPROVED') throw new Error('Return must be APPROVED first');

    for (const item of ret.items) {
      if (ret.type === 'CUSTOMER_RETURN' && item.isRestocked) {
        // Restock to original batch
        await recordStockMovement({
          pharmacyId: ret.pharmacyId,
          medicineId: item.medicineId,
          type: 'RETURN_IN',
          quantity: item.quantity,
          batchId: item.batchId || undefined,
          referenceId: ret.id,
          reason: `Customer return ${ret.returnNumber}`,
          userId,
        });
      } else if (ret.type === 'SUPPLIER_RETURN' || ret.type === 'DAMAGE_WRITE_OFF' || ret.type === 'EXPIRED_WRITE_OFF') {
        // Deduct stock
        await recordStockMovement({
          pharmacyId: ret.pharmacyId,
          medicineId: item.medicineId,
          type: ret.type === 'SUPPLIER_RETURN' ? 'RETURN_OUT'
                : ret.type === 'DAMAGE_WRITE_OFF' ? 'DAMAGE' : 'EXPIRED',
          quantity: item.quantity,
          batchId: item.batchId || undefined,
          referenceId: ret.id,
          reason: `${ret.type}: ${ret.returnNumber}`,
          userId,
        });
      }
    }

    // Ledger entry for customer refund
    if (ret.type === 'CUSTOMER_RETURN' && Number(ret.refundAmount) > 0) {
      await recordLedgerEntry({
        pharmacyId: ret.pharmacyId,
        entryType: 'REFUND',
        direction: 'DEBIT',
        amount: Number(ret.refundAmount),
        description: `Refund for ${ret.returnNumber}`,
        referenceId: ret.id,
        referenceType: 'ReturnOrder',
        createdById: userId,
      });
    }

    // Ledger entry for supplier return (credit received)
    if (ret.type === 'SUPPLIER_RETURN' && Number(ret.totalAmount) > 0) {
      await recordLedgerEntry({
        pharmacyId: ret.pharmacyId,
        entryType: 'PAYMENT_RECEIVED',
        direction: 'CREDIT',
        amount: Number(ret.totalAmount),
        description: `Supplier credit ${ret.returnNumber}`,
        referenceId: ret.id,
        referenceType: 'ReturnOrder',
        createdById: userId,
      });
    }

    // Update return status
    const updated = await tx.returnOrder.update({
      where: { id: ret.id },
      data: {
        status: 'PROCESSED',
        processedById: userId,
        processedAt: new Date(),
      },
    });

    return updated;
  });
}

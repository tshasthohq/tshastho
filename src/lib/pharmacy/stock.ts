import { prisma } from '@/lib/prisma';

export type StockChangeType = 
  | 'PURCHASE' 
  | 'SALE' 
  | 'RETURN_IN' 
  | 'RETURN_OUT' 
  | 'ADJUSTMENT' 
  | 'DAMAGE' 
  | 'EXPIRED' 
  | 'TRANSFER_IN' 
  | 'TRANSFER_OUT' 
  | 'OPENING';

interface RecordMovementParams {
  pharmacyId: string;
  medicineId: string;
  type: StockChangeType;
  quantity: number; // always positive — service determines sign based on type
  batchId?: string;
  referenceId?: string;
  reason?: string;
  userId?: string;
  metadata?: any;
}

/**
 * Records a stock movement and updates both Medicine.stock and Batch.quantity.
 * Quantity is always positive in input; service determines direction.
 */
export async function recordStockMovement(params: RecordMovementParams) {
  const { pharmacyId, medicineId, type, quantity, batchId, referenceId, reason, userId, metadata } = params;

  // Determine direction
  const inwardTypes: StockChangeType[] = ['PURCHASE', 'RETURN_IN', 'TRANSFER_IN', 'OPENING'];
  const isInward = inwardTypes.includes(type);
  const signedQty = isInward ? quantity : -quantity;

  return await prisma.$transaction(async (tx) => {
    // Get current medicine stock
    const medicine = await tx.medicine.findUnique({
      where: { id: medicineId },
      select: { id: true, stock: true, pharmacyId: true },
    });

    if (!medicine) throw new Error('Medicine not found');
    if (medicine.pharmacyId !== pharmacyId) throw new Error('Medicine not in this pharmacy');

    const previousStock = medicine.stock;
    const newStock = previousStock + signedQty;

    if (newStock < 0) {
      throw new Error(`Insufficient stock. Available: ${previousStock}, required: ${quantity}`);
    }

    // Update medicine stock
    await tx.medicine.update({
      where: { id: medicineId },
      data: { stock: newStock },
    });

    // Update batch quantity if batchId provided
    if (batchId) {
      const batch = await tx.batch.findUnique({
        where: { id: batchId },
        select: { quantity: true, id: true },
      });
      if (batch) {
        const newBatchQty = batch.quantity + signedQty;
        if (newBatchQty < 0) {
          throw new Error(`Batch stock insufficient. Batch has ${batch.quantity}, needed ${quantity}`);
        }
        await tx.batch.update({
          where: { id: batchId },
          data: { quantity: newBatchQty },
        });
      }
    } else if (isInward === false) {
      // Outward movement without batch → FIFO deduct from oldest batches
      await deductFromBatchesFIFO(tx, medicineId, quantity);
    }

    // Create movement log
    const movement = await tx.stockMovement.create({
      data: {
        pharmacyId,
        medicineId,
        batchId: batchId || null,
        type: type as any,
        quantity: signedQty,
        previousStock,
        newStock,
        referenceId: referenceId || null,
        reason: reason || null,
        userId: userId || null,
        metadata: metadata || undefined,
      },
    });

    return movement;
  });
}

/**
 * FIFO deduction from batches — oldest expiry first.
 */
async function deductFromBatchesFIFO(tx: any, medicineId: string, quantityToDeduct: number) {
  const batches = await tx.batch.findMany({
    where: {
      medicineId,
      isActive: true,
      quantity: { gt: 0 },
    },
    orderBy: { expiryDate: 'asc' },
  });

  let remaining = quantityToDeduct;
  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    await tx.batch.update({
      where: { id: batch.id },
      data: { quantity: batch.quantity - take },
    });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error(`FIFO deduction failed. Short by ${remaining} units across batches.`);
  }
}

/**
 * Returns total batch stock for a medicine (should match Medicine.stock).
 */
export async function getBatchStockTotal(medicineId: string): Promise<number> {
  const result = await prisma.batch.aggregate({
    where: { medicineId, isActive: true },
    _sum: { quantity: true },
  });
  return result._sum.quantity || 0;
}

/**
 * Returns batches nearing expiry (default: 90 days).
 */
export async function getExpiringBatches(pharmacyId: string, daysAhead = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  return prisma.batch.findMany({
    where: {
      pharmacyId,
      isActive: true,
      quantity: { gt: 0 },
      expiryDate: { lte: cutoff },
    },
    include: {
      medicine: { select: { id: true, name: true, brand: true } },
    },
    orderBy: { expiryDate: 'asc' },
  });
}

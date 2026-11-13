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
    // Item 20 log vars (may be stale under race, used only for audit)
    const previousStock = medicine.stock;
    const newStock = previousStock + signedQty;
    if (medicine.pharmacyId !== pharmacyId) throw new Error('Medicine not in this pharmacy');

    // Item 20: atomic stock update with race-safe check
    if (signedQty < 0) {
      const result = await tx.medicine.updateMany({
        where: { id: medicineId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (result.count === 0) {
        const fresh = await tx.medicine.findUnique({ where: { id: medicineId }, select: { stock: true } });
        throw new Error(`Insufficient stock. Available: ${fresh?.stock ?? 0}, required: ${quantity}`);
      }
    } else if (signedQty > 0) {
      await tx.medicine.update({
        where: { id: medicineId },
        data: { stock: { increment: signedQty } },
      });
    }

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

    // Check if Auto PO is needed (Only if stock decreased)
    if (signedQty < 0) {
      await checkAndCreateAutoPO(tx, medicineId, pharmacyId);
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

/**
 * Automatically generates a Draft Purchase Order if stock falls below alert level.
 */
async function checkAndCreateAutoPO(tx: any, medicineId: string, pharmacyId: string) {
  const med = await tx.medicine.findUnique({
    where: { id: medicineId },
    select: { id: true, name: true, stock: true, lowStockAlert: true, purchasePrice: true, supplier: true }
  });

  if (!med || med.stock > med.lowStockAlert) return; // স্টক ঠিক আছে

  // চেক করা: এই ঔষধের জন্য আগে থেকেই কোনো PENDING/DRAFT PO আছে কি না
  const existingPO = await tx.purchaseOrder.findFirst({
    where: {
      pharmacyId,
      status: { in: ['DRAFT', 'ORDERED'] },
      items: { some: { medicineId } }
    }
  });

  if (existingPO) return; // আগে থেকেই PO আছে, নতুন করে তৈরি হবে না

  // নতুন PO নাম্বার জেনারেট করা
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await tx.purchaseOrder.count({ where: { pharmacyId } });
  const purchaseNumber = `PO-AUTO-${dateStr}-${String(count + 1).padStart(4, '0')}`;

  // কতটুকু অর্ডার করা হবে? (যেমন: lowStockAlert এর দ্বিগুণ)
  const orderQty = med.lowStockAlert * 2;
  const unitCost = Number(med.purchasePrice) || 0;
  const totalAmount = orderQty * unitCost;

  // সাপ্লায়ার নাম মিলিয়ে আইডি খোঁজা (যদি থাকে)
  let supplierId = null;
  if (med.supplier) {
    const supplier = await tx.supplier.findFirst({ where: { name: med.supplier, pharmacyId } });
    if (supplier) supplierId = supplier.id;
  }

  // PO তৈরি করা
  await tx.purchaseOrder.create({
    data: {
      pharmacyId,
      purchaseNumber,
      supplierId,
      status: 'DRAFT',
      totalAmount,
      dueAmount: totalAmount,
      createdBy: 'SYSTEM',
      notes: `Auto-generated: ${med.name} stock (${med.stock}) dropped below alert level (${med.lowStockAlert}).`,
      items: {
        create: [{
          medicineId,
          quantity: orderQty,
          unitCost,
          subtotal: totalAmount,
        }]
      }
    }
  });
}

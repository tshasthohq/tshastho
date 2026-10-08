// Exchange Medicine service — Item 38
// Customer returns item(s) AND takes new item(s) in one transaction.
// Difference settled via CASH / WALLET / GATEWAY.

import { prisma } from '@/lib/prisma';
import { recordStockMovement } from './stock';

export interface ExchangeItemIn {
  medicineId: string;
  quantity: number;
  unitPrice: number;
  batchId?: string;
  reason?: string;
  isRestocked?: boolean;
}

export interface ExchangeItemOut {
  medicineId: string;
  quantity: number;
  unitPrice: number;
  batchId?: string;
}

export interface CreateExchangeParams {
  pharmacyId: string;
  customerName: string;
  customerPhone?: string;
  customerUserId?: string;
  originalOrderId?: string;
  itemsIn: ExchangeItemIn[];
  itemsOut: ExchangeItemOut[];
  differenceMethod: 'CASH' | 'WALLET' | 'GATEWAY' | 'REFUND';
  reason?: string;
  notes?: string;
  createdBy: string;
}

function generateExchangeNumber(seq: number): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `EX-${y}${m}${day}-${String(seq).padStart(4, '0')}`;
}

/**
 * Create an EXCHANGE ReturnOrder.
 * itemsIn total = returned value (customer gets credit)
 * itemsOut total = new items value (customer owes)
 * difference = itemsOut - itemsIn
 *  - positive → customer pays difference (method: CASH/WALLET/GATEWAY)
 *  - negative → customer gets refund (method: CASH/WALLET/REFUND)
 */
export async function createExchange(params: CreateExchangeParams) {
  const {
    pharmacyId, customerName, customerPhone, customerUserId,
    originalOrderId, itemsIn, itemsOut, differenceMethod, reason, notes, createdBy,
  } = params;

  if (itemsIn.length === 0 && itemsOut.length === 0) {
    throw new Error('Exchange needs at least one item in or out');
  }

  // Validate all medicines belong to this pharmacy
  const allMedIds = Array.from(new Set([
    ...itemsIn.map((i) => i.medicineId),
    ...itemsOut.map((i) => i.medicineId),
  ]));
  const meds = await prisma.medicine.findMany({
    where: { id: { in: allMedIds }, pharmacyId },
    select: { id: true, name: true, sellingPrice: true },
  });
  if (meds.length !== allMedIds.length) {
    throw new Error('Some medicines not found in this pharmacy');
  }
  const medMap = new Map(meds.map((m) => [m.id, m]));

  // Compute amounts
  const inTotal = itemsIn.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const outTotal = itemsOut.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const difference = outTotal - inTotal;

  // Generate number
  const count = await prisma.returnOrder.count({ where: { pharmacyId, type: 'EXCHANGE' } });
  const exchangeNumber = generateExchangeNumber(count + 1);

  // Build return items (IN side, using ReturnItem shape)
  const returnItems = itemsIn.map((i) => ({
    medicineId: i.medicineId,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    subtotal: i.quantity * i.unitPrice,
    batchId: i.batchId ?? null,
    isRestocked: i.isRestocked ?? true,
    reason: i.reason ?? null,
    medicineName: medMap.get(i.medicineId)?.name ?? 'Item',
  }));

  // Out items stored as JSON
  const outItemsJson = itemsOut.map((o) => ({
    medicineId: o.medicineId,
    medicineName: medMap.get(o.medicineId)?.name ?? 'Item',
    quantity: o.quantity,
    unitPrice: o.unitPrice,
    subtotal: o.quantity * o.unitPrice,
    batchId: o.batchId ?? null,
  }));

  const totalAmount = inTotal;
  const refundAmount = difference < 0 ? Math.abs(difference) : 0;

  const order = await prisma.returnOrder.create({
    data: {
      returnNumber: exchangeNumber,
      pharmacyId,
      type: 'EXCHANGE' as any,
      status: 'PENDING',
      customerName,
      customerPhone: customerPhone ?? null,
      referenceType: originalOrderId ? 'Order' : null,
      referenceId: originalOrderId ?? null,
      totalAmount,
      refundAmount,
      refundMethod: (differenceMethod === 'REFUND' || differenceMethod === 'GATEWAY' ? 'ORIGINAL' : differenceMethod) as any,
      reason: reason ?? 'Exchange',
      notes: notes ?? null,
      exchangeOutItems: outItemsJson as object,
      exchangeOutAmount: outTotal,
      exchangeDifference: difference,
      exchangeDifferenceMethod: differenceMethod,
      items: { create: returnItems },
    },
    include: { items: true },
  });

  return {
    exchange: order,
    itemsInTotal: inTotal,
    itemsOutTotal: outTotal,
    difference,
    customerOwes: difference > 0 ? difference : 0,
    customerRefund: difference < 0 ? Math.abs(difference) : 0,
  };
}

/**
 * Process an approved exchange — restock IN items, deduct OUT items.
 * Difference settlement handled by caller (wallet/cash/gateway).
 */
export async function processExchange(params: {
  exchangeId: string;
  userId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { exchangeId, userId } = params;

  try {
    await prisma.$transaction(async (tx) => {
      const ret = await tx.returnOrder.findUnique({
        where: { id: exchangeId },
        include: { items: true },
      });
      if (!ret) throw new Error('Exchange not found');
      if (ret.type !== 'EXCHANGE') throw new Error('Not an exchange order');
      if (ret.status !== 'APPROVED') throw new Error('Exchange must be APPROVED first');

      // Restock IN items
      for (const item of ret.items) {
        if (item.isRestocked) {
          await recordStockMovement({
            pharmacyId: ret.pharmacyId,
            medicineId: item.medicineId,
            type: 'RETURN_IN',
            quantity: item.quantity,
            batchId: item.batchId ?? undefined,
            referenceId: ret.id,
            reason: `Exchange IN ${ret.returnNumber}`,
            userId,
          });
        }
      }

      // Deduct OUT items
      const outItems = (ret.exchangeOutItems as Array<{ medicineId: string; quantity: number; batchId?: string | null }> | null) ?? [];
      for (const o of outItems) {
        await recordStockMovement({
          pharmacyId: ret.pharmacyId,
          medicineId: o.medicineId,
          type: 'SALE',
          quantity: o.quantity,
          batchId: o.batchId ?? undefined,
          referenceId: ret.id,
          reason: `Exchange OUT ${ret.returnNumber}`,
          userId,
        });
      }

      await tx.returnOrder.update({
        where: { id: exchangeId },
        data: {
          status: 'PROCESSED',
          processedById: userId,
          processedAt: new Date(),
        },
      });
    });

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[EXCHANGE_PROCESS]', exchangeId, msg);
    return { ok: false, error: msg };
  }
}

/**
 * List exchanges for a pharmacy.
 */
export async function listExchanges(params: {
  pharmacyId: string;
  status?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(200, Math.max(1, params.limit ?? 50));
  const offset = Math.max(0, params.offset ?? 0);

  const where = {
    pharmacyId: params.pharmacyId,
    type: 'EXCHANGE' as any,
    ...(params.status ? { status: params.status as any } : {}),
    ...(params.from || params.to
      ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.returnOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { items: true },
    }),
    prisma.returnOrder.count({ where }),
  ]);

  return { items, total, limit, offset };
}

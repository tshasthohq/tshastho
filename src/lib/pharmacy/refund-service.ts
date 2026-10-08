// Unified refund service — Item 13
// Triggers actual payment refund when a CUSTOMER_RETURN is processed.
// Falls back to manual (no gateway) for CASH / unknown methods.

import { prisma } from '@/lib/prisma';
import { getGateway } from '@/lib/payments';
import { recordLedgerEntry } from '@/lib/payments/utils';

export interface ProcessReturnRefundParams {
  returnId: string;
  userId: string;
}

export interface ProcessReturnRefundResult {
  ok: boolean;
  refundId?: string;
  gatewayRefId?: string;
  method?: string;
  error?: string;
  manualRequired?: boolean;
}

/**
 * Trigger refund for a processed return.
 * - CUSTOMER_RETURN only (SUPPLIER_RETURN uses supplier credit, not customer refund)
 * - Look up the original Payment via orderId (referenceType='Order')
 * - Call gateway.refund() if provider is auto-refundable
 * - CASH / unknown → mark manual-required, still create Refund record
 * - Updates ReturnOrder.refundStatus / refundTxnId / refundedAt / refundError
 */
export async function processReturnRefund(
  params: ProcessReturnRefundParams,
): Promise<ProcessReturnRefundResult> {
  const { returnId, userId } = params;

  const ret = await prisma.returnOrder.findUnique({ where: { id: returnId } });
  if (!ret) return { ok: false, error: 'Return not found' };
  if (ret.type !== 'CUSTOMER_RETURN') {
    return { ok: false, error: 'Not a customer return' };
  }
  if (ret.status !== 'PROCESSED') {
    return { ok: false, error: 'Return must be PROCESSED before refund' };
  }

  const amount = Number(ret.refundAmount ?? 0);
  if (amount <= 0) {
    await prisma.returnOrder.update({
      where: { id: returnId },
      data: { refundStatus: 'COMPLETED', refundedAt: new Date() },
    });
    return { ok: true, method: 'NONE' };
  }

  const method = String(ret.refundMethod ?? 'CASH').toUpperCase();
  const isManual = method === 'CASH' || method === 'MANUAL';

  // Try to locate the original Payment
  let payment: { id: string; gatewayProvider: string | null; gatewayTxnId: string | null } | null = null;
  if (!isManual && ret.referenceType === 'Order' && ret.referenceId) {
    payment = await prisma.payment.findFirst({
      where: { orderId: ret.referenceId, status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] } },
      select: { id: true, gatewayProvider: true, gatewayTxnId: true },
    });
  }

  // Bump attempt counter
  await prisma.returnOrder.update({
    where: { id: returnId },
    data: { refundAttempts: { increment: 1 }, refundStatus: 'PROCESSING' },
  });

  // Item 36: WALLET refund — credit customer wallet
  if (method === 'WALLET') {
    let customerId: string | null = null;
    if (ret.referenceType === 'Order' && ret.referenceId) {
      const order = await prisma.order.findUnique({
        where: { id: ret.referenceId },
        select: { patientId: true },
      });
      customerId = order?.patientId ?? null;
    }
    if (!customerId) {
      await prisma.returnOrder.update({
        where: { id: returnId },
        data: { refundStatus: 'FAILED', refundError: 'Cannot resolve customer for wallet refund' },
      });
      return { ok: false, error: 'Cannot resolve customer for wallet refund', method };
    }

    const { walletRefund } = await import('@/lib/wallet');
    const wr = await walletRefund({
      userId: customerId,
      amount,
      ctx: {
        vertical: 'PHARMACY',
        contextId: ret.pharmacyId,
        referenceType: 'RETURN',
        referenceId: returnId,
        referenceNumber: ret.returnNumber,
        description: 'Wallet refund for return ' + ret.returnNumber,
        idempotencyKey: 'refund-' + returnId,
        createdBy: userId,
        createdByRole: 'SYSTEM',
      },
    });

    if (!wr.ok) {
      await prisma.returnOrder.update({
        where: { id: returnId },
        data: { refundStatus: 'FAILED', refundError: (wr.error ?? '').slice(0, 400) },
      });
      return { ok: false, error: wr.error, method };
    }

    const wrefund = await prisma.refund.create({
      data: {
        refundNumber: 'RET-' + returnId.slice(-8) + '-' + Date.now(),
        paymentId: payment?.id ?? '',
        amount,
        reason: 'Wallet refund for return',
        status: 'COMPLETED',
        processedAt: new Date(),
        gatewayRefId: wr.txnId,
        metadata: { returnId, walletTxnId: wr.txnId, method: 'WALLET' } as object,
      },
    }).catch(() => null);

    await prisma.returnOrder.update({
      where: { id: returnId },
      data: {
        refundStatus: 'COMPLETED',
        refundTxnId: wr.txnId ?? null,
        refundedAt: new Date(),
        refundError: null,
      },
    });

    await recordLedgerEntry({
      paymentId: payment?.id ?? returnId,
      debitAccount: 'PLATFORM',
      creditAccount: 'CUSTOMER',
      amount,
      description: 'Return refund (wallet) ' + ret.returnNumber,
      referenceId: wr.txnId ?? returnId,
    }).catch(() => undefined);

    return { ok: true, refundId: wrefund?.id, gatewayRefId: wr.txnId, method };
  }

  // Manual path — no gateway
  if (isManual || !payment || !payment.gatewayTxnId) {
    const refund = await prisma.refund.create({
      data: {
        refundNumber: 'RET-' + returnId.slice(-8) + '-' + Date.now(),
        paymentId: payment?.id ?? '',
        amount,
        reason: 'Return refund (' + method + ') — manual',
        status: 'COMPLETED',
        processedAt: new Date(),
        metadata: { returnId, manual: true, method } as object,
      },
    }).catch(() => null);

    await prisma.returnOrder.update({
      where: { id: returnId },
      data: {
        refundStatus: 'COMPLETED',
        refundTxnId: refund?.refundNumber ?? null,
        refundedAt: new Date(),
        refundError: null,
      },
    });

    await recordLedgerEntry({
      paymentId: payment?.id ?? returnId,
      debitAccount: 'PLATFORM',
      creditAccount: 'CUSTOMER',
      amount,
      description: 'Return refund (manual) ' + ret.returnNumber,
      referenceId: returnId,
    }).catch(() => undefined);

    return {
      ok: true,
      refundId: refund?.id,
      method,
      manualRequired: isManual,
    };
  }

  // Gateway path
  try {
    const gateway = getGateway(payment.gatewayProvider ?? 'SSLCOMMERZ');
    if (!gateway.refund) throw new Error('Gateway does not support refund');

    const result = await gateway.refund(
      payment.gatewayTxnId,
      amount,
      'Return ' + ret.returnNumber,
    );

    const refund = await prisma.refund.create({
      data: {
        refundNumber: 'RET-' + returnId.slice(-8) + '-' + Date.now(),
        paymentId: payment.id,
        amount,
        reason: 'Return refund via ' + (payment.gatewayProvider ?? 'gateway'),
        status: 'COMPLETED',
        processedAt: new Date(),
        gatewayRefId: result?.refundRefId ?? null,
        metadata: { returnId } as object,
      },
    });

    // Update payment totals
    const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
    const newRefunded = Number(fresh?.refundedAmount ?? 0) + amount;
    const fully = newRefunded >= Number(fresh?.amount ?? 0);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        refundedAmount: newRefunded,
        status: fully ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
    });

    await prisma.returnOrder.update({
      where: { id: returnId },
      data: {
        refundStatus: 'COMPLETED',
        refundTxnId: result?.refundRefId ?? refund.refundNumber,
        refundedAt: new Date(),
        refundError: null,
      },
    });

    await recordLedgerEntry({
      paymentId: payment.id,
      debitAccount: 'PLATFORM',
      creditAccount: 'CUSTOMER',
      amount,
      description: 'Return refund ' + ret.returnNumber,
      referenceId: result?.refundRefId ?? refund.id,
    }).catch(() => undefined);

    return {
      ok: true,
      refundId: refund.id,
      gatewayRefId: result?.refundRefId,
      method,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.returnOrder.update({
      where: { id: returnId },
      data: { refundStatus: 'FAILED', refundError: msg.slice(0, 400) },
    });
    console.error('[RETURN_REFUND_FAILED]', returnId, msg);
    return { ok: false, error: msg, method };
  }
}

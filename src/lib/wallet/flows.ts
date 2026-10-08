// High-level wallet flows — Item 36
import { applyWalletTxn } from './transactions';
import type { Vertical } from './constants';

export interface FlowContext {
  vertical?: Vertical;
  contextId?: string;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  description?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  createdByRole?: string;
  idempotencyKey?: string;
}

export async function walletTopUp(params: { userId: string; amount: number; ctx?: FlowContext }) {
  return applyWalletTxn({
    userId: params.userId, type: 'TOPUP', amount: params.amount,
    vertical: params.ctx?.vertical ?? 'PLATFORM',
    contextId: params.ctx?.contextId, referenceType: params.ctx?.referenceType,
    referenceId: params.ctx?.referenceId, referenceNumber: params.ctx?.referenceNumber,
    description: params.ctx?.description ?? 'Wallet top-up', notes: params.ctx?.notes,
    metadata: params.ctx?.metadata, createdBy: params.ctx?.createdBy,
    createdByRole: params.ctx?.createdByRole, idempotencyKey: params.ctx?.idempotencyKey,
  });
}

export async function walletSpend(params: { userId: string; amount: number; ctx?: FlowContext }) {
  return applyWalletTxn({
    userId: params.userId, type: 'SPEND', amount: params.amount,
    vertical: params.ctx?.vertical ?? 'PLATFORM',
    contextId: params.ctx?.contextId, referenceType: params.ctx?.referenceType,
    referenceId: params.ctx?.referenceId, referenceNumber: params.ctx?.referenceNumber,
    description: params.ctx?.description ?? 'Wallet payment', notes: params.ctx?.notes,
    metadata: params.ctx?.metadata, createdBy: params.ctx?.createdBy,
    createdByRole: params.ctx?.createdByRole, idempotencyKey: params.ctx?.idempotencyKey,
  });
}

export async function walletRefund(params: { userId: string; amount: number; ctx?: FlowContext }) {
  return applyWalletTxn({
    userId: params.userId, type: 'REFUND', amount: params.amount,
    vertical: params.ctx?.vertical ?? 'PLATFORM',
    contextId: params.ctx?.contextId, referenceType: params.ctx?.referenceType,
    referenceId: params.ctx?.referenceId, referenceNumber: params.ctx?.referenceNumber,
    description: params.ctx?.description ?? 'Refund to wallet', notes: params.ctx?.notes,
    metadata: params.ctx?.metadata, createdBy: params.ctx?.createdBy,
    createdByRole: params.ctx?.createdByRole, idempotencyKey: params.ctx?.idempotencyKey,
  });
}

export async function walletEarn(params: { userId: string; amount: number; ctx?: FlowContext }) {
  return applyWalletTxn({
    userId: params.userId, type: 'EARN', amount: params.amount,
    vertical: params.ctx?.vertical ?? 'PLATFORM',
    contextId: params.ctx?.contextId, referenceType: params.ctx?.referenceType,
    referenceId: params.ctx?.referenceId, referenceNumber: params.ctx?.referenceNumber,
    description: params.ctx?.description ?? 'Earnings', notes: params.ctx?.notes,
    metadata: params.ctx?.metadata, createdBy: params.ctx?.createdBy,
    createdByRole: params.ctx?.createdByRole, idempotencyKey: params.ctx?.idempotencyKey,
  });
}

export async function walletAdjust(params: { userId: string; amount: number; ctx?: FlowContext }) {
  return applyWalletTxn({
    userId: params.userId, type: 'ADJUST', amount: params.amount,
    vertical: params.ctx?.vertical ?? 'PLATFORM',
    contextId: params.ctx?.contextId, referenceType: params.ctx?.referenceType,
    referenceId: params.ctx?.referenceId, referenceNumber: params.ctx?.referenceNumber,
    description: params.ctx?.description ?? 'Admin adjustment', notes: params.ctx?.notes,
    metadata: params.ctx?.metadata, createdBy: params.ctx?.createdBy,
    createdByRole: params.ctx?.createdByRole, idempotencyKey: params.ctx?.idempotencyKey,
  });
}

// Expiry alert scanner — Item 28
// Daily scan for batches expiring within 90 days → tier-based alerts.
// Idempotent via unique(batchId, tier). Notifications best-effort.

import { prisma } from '@/lib/prisma';

export type ExpiryTier = 'T30' | 'T60' | 'T90';

export interface ScanResult {
  scanned: number;
  created: number;
  notified: number;
  errors: string[];
  byTier: { T30: number; T60: number; T90: number };
}

function tierFor(days: number): ExpiryTier | null {
  if (days <= 30 && days >= 0) return 'T30';
  if (days <= 60 && days > 30) return 'T60';
  if (days <= 90 && days > 60) return 'T90';
  return null;
}

/**
 * Scan all active batches expiring within 90 days and create ExpiryAlert rows.
 * Idempotent: unique(batchId, tier) prevents duplicates.
 */
export async function scanExpiringBatches(opts?: {
  pharmacyId?: string;
  notify?: boolean;
}): Promise<ScanResult> {
  const errors: string[] = [];
  const byTier = { T30: 0, T60: 0, T90: 0 };

  const now = new Date();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 90);

  const batches = await prisma.batch.findMany({
    where: {
      isActive: true,
      expiryDate: { lte: horizon },
      quantity: { gt: 0 },
      ...(opts?.pharmacyId ? { pharmacyId: opts.pharmacyId } : {}),
    },
    select: {
      id: true,
      pharmacyId: true,
      medicineId: true,
      batchNumber: true,
      expiryDate: true,
      quantity: true,
    },
  });

  let created = 0;
  for (const b of batches) {
    const expDate = b.expiryDate;
    if (!expDate) continue;
    const days = Math.floor((new Date(expDate).getTime() - now.getTime()) / 86_400_000);
    const tier = tierFor(days);
    if (!tier) continue;

    try {
      const existing = await prisma.expiryAlert.findUnique({
        where: { batchId_tier: { batchId: b.id, tier } },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.expiryAlert.create({
        data: {
          pharmacyId: b.pharmacyId,
          batchId: b.id,
          medicineId: b.medicineId,
          expiryDate: (expDate as Date),
          daysRemaining: days,
          tier,
          quantity: Number(b.quantity ?? 0),
        },
      });
      created += 1;
      byTier[tier] += 1;
    } catch (err) {
      errors.push(`${b.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Refresh daysRemaining for OPEN alerts
  const open = await prisma.expiryAlert.findMany({
    where: { status: 'OPEN', ...(opts?.pharmacyId ? { pharmacyId: opts.pharmacyId } : {}) },
    select: { id: true, expiryDate: true },
  });
  for (const a of open) {
    const d = Math.floor((new Date(a.expiryDate).getTime() - now.getTime()) / 86_400_000);
    if (d !== 0) {
      await prisma.expiryAlert.update({ where: { id: a.id }, data: { daysRemaining: d } }).catch(() => undefined);
    }
  }

  return { scanned: batches.length, created, notified: 0, errors, byTier };
}

/**
 * Mark alerts notified (best-effort). Actual channel integration
 * (email/SMS/WhatsApp) can be added here later.
 */
export async function markNotified(
  alertIds: string[],
  via: string,
): Promise<number> {
  if (alertIds.length === 0) return 0;
  const r = await prisma.expiryAlert.updateMany({
    where: { id: { in: alertIds } },
    data: { notifiedAt: new Date(), notifiedVia: via },
  });
  return r.count;
}

/**
 * List alerts for a pharmacy.
 */
export async function listExpiryAlerts(params: {
  pharmacyId: string;
  status?: string;
  tier?: string;
  limit?: number;
  offset?: number;
}) {
  const { pharmacyId, status, tier } = params;
  const limit = Math.min(200, Math.max(1, params.limit ?? 50));
  const offset = Math.max(0, params.offset ?? 0);

  const where = {
    pharmacyId,
    ...(status ? { status } : {}),
    ...(tier ? { tier } : {}),
  };

  const [items, total, counts] = await Promise.all([
    prisma.expiryAlert.findMany({
      where,
      orderBy: [{ daysRemaining: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
      include: {
        batch: { select: { batchNumber: true, quantity: true, sellingPrice: true } },
        medicine: { select: { id: true, name: true, brand: true } },
      },
    }),
    prisma.expiryAlert.count({ where }),
    prisma.expiryAlert.groupBy({
      by: ['tier'],
      where: { pharmacyId, status: 'OPEN' },
      _count: { _all: true },
    }),
  ]);

  const summary = { T30: 0, T60: 0, T90: 0 };
  for (const c of counts) {
    const k = c.tier as keyof typeof summary;
    if (k in summary) summary[k] = c._count._all;
  }

  return { items, total, summary, limit, offset };
}

/**
 * Acknowledge or dismiss an alert.
 */
export async function updateAlertStatus(params: {
  alertId: string;
  pharmacyId: string;
  status: 'ACKNOWLEDGED' | 'WRITTEN_OFF' | 'DISMISSED';
  userId: string;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { alertId, pharmacyId, status, userId, notes } = params;

  const alert = await prisma.expiryAlert.findUnique({
    where: { id: alertId },
    select: { id: true, pharmacyId: true },
  });
  if (!alert) return { ok: false, error: 'Alert not found' };
  if (alert.pharmacyId !== pharmacyId) return { ok: false, error: 'Access denied' };

  await prisma.expiryAlert.update({
    where: { id: alertId },
    data: {
      status,
      acknowledgedAt: status === 'ACKNOWLEDGED' ? new Date() : undefined,
      acknowledgedBy: userId,
      notes: notes ?? undefined,
    },
  });
  return { ok: true };
}

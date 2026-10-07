// Prescription Retention Policy — Item 18
// Auto-purge/anonymize prescriptions after retention period.

import { prisma } from '@/lib/prisma';

export type RetentionPolicy = 'DGDA_5Y' | 'GDPR_2Y' | 'MANUAL';

const POLICY_YEARS: Record<RetentionPolicy, number> = {
  DGDA_5Y: 5,
  GDPR_2Y: 2,
  MANUAL: 0,
};

/**
 * Compute retentionUntil from a base date + policy.
 */
export function computeRetentionUntil(
  baseDate: Date,
  policy: RetentionPolicy,
): Date {
  const years = POLICY_YEARS[policy];
  const d = new Date(baseDate);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export interface PurgeStats {
  anonymized: number;
  archived: number;
  skipped: number;
  errors: string[];
}

/**
 * Anonymize a single prescription — keeps audit-safe record,
 * removes PII + image, sets anonymizedAt.
 */
export async function anonymizePrescription(prescriptionId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const rx = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      select: { id: true, patientId: true, anonymizedAt: true, legalHold: true },
    });
    if (!rx) return { ok: false, error: 'Prescription not found' };
    if (rx.anonymizedAt) return { ok: true };
    if (rx.legalHold) return { ok: false, error: 'Legal hold active' };

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        imageUrl: 'REDACTED',
        anonymizedAt: new Date(),
      },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Purge run — anonymize all prescriptions past retentionUntil
 * that are not under legal hold and not yet anonymized.
 */
export async function runRetentionPurge(opts?: {
  pharmacyId?: string;
  limit?: number;
}): Promise<PurgeStats> {
  const limit = Math.min(500, Math.max(1, opts?.limit ?? 100));
  const now = new Date();

  const candidates = await prisma.prescription.findMany({
    where: {
      retentionUntil: { lte: now },
      anonymizedAt: null,
      legalHold: false,
      ...(opts?.pharmacyId ? { pharmacyId: opts.pharmacyId } : {}),
    },
    select: { id: true },
    take: limit,
  });

  const stats: PurgeStats = { anonymized: 0, archived: 0, skipped: 0, errors: [] };
  for (const c of candidates) {
    const r = await anonymizePrescription(c.id);
    if (r.ok) stats.anonymized += 1;
    else stats.errors.push(`${c.id}: ${r.error ?? 'unknown'}`);
  }
  return stats;
}

/**
 * Compute retention info + apply to a single prescription.
 */
export async function setRetention(
  prescriptionId: string,
  policy: RetentionPolicy,
): Promise<{ ok: boolean; retentionUntil?: Date; error?: string }> {
  const rx = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    select: { id: true, createdAt: true },
  });
  if (!rx) return { ok: false, error: 'Not found' };

  const until = computeRetentionUntil(rx.createdAt, policy);
  await prisma.prescription.update({
    where: { id: prescriptionId },
    data: { retentionPolicy: policy, retentionUntil: until },
  });
  return { ok: true, retentionUntil: until };
}

/**
 * Patient-requested erasure (right to be forgotten).
 * Requires no legal hold; anonymizes immediately.
 */
export async function requestErasure(params: {
  prescriptionId: string;
  patientId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const rx = await prisma.prescription.findUnique({
    where: { id: params.prescriptionId },
    select: { id: true, patientId: true, legalHold: true },
  });
  if (!rx) return { ok: false, error: 'Prescription not found' };
  if (rx.patientId !== params.patientId) return { ok: false, error: 'Access denied' };
  if (rx.legalHold) return { ok: false, error: 'Cannot erase under legal hold' };

  return anonymizePrescription(params.prescriptionId);
}

/**
 * Retention stats for admin dashboard.
 */
export async function getRetentionStats(pharmacyId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseWhere: any = pharmacyId ? { pharmacyId } : {};
  const now = new Date();

  const [total, expired, anonymized, legalHold, upcoming] = await Promise.all([
    prisma.prescription.count({ where: baseWhere }),
    prisma.prescription.count({
      where: { ...baseWhere, retentionUntil: { lte: now }, anonymizedAt: null },
    }),
    prisma.prescription.count({
      where: { ...baseWhere, anonymizedAt: { not: null } },
    }),
    prisma.prescription.count({
      where: { ...baseWhere, legalHold: true },
    }),
    prisma.prescription.count({
      where: {
        ...baseWhere,
        retentionUntil: { gt: now },
        anonymizedAt: null,
      },
    }),
  ]);

  return { total, expired, anonymized, legalHold, upcoming };
}

/**
 * Bulk-apply retention policy to all prescriptions missing retentionUntil
 * (migration helper). Idempotent.
 */
export async function backfillRetention(policy: RetentionPolicy = 'DGDA_5Y'): Promise<{
  updated: number;
}> {
  const pending = await prisma.prescription.findMany({
    where: { retentionUntil: null },
    select: { id: true, createdAt: true },
    take: 500,
  });
  for (const p of pending) {
    const until = computeRetentionUntil(p.createdAt, policy);
    await prisma.prescription.update({
      where: { id: p.id },
      data: { retentionPolicy: policy, retentionUntil: until },
    });
  }
  return { updated: pending.length };
}

// Sample Medicine Tracker service — Item 37
// Separate from saleable stock. Track received samples + distributions.

import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────────────────
// Receive new sample batch from supplier / rep
// ─────────────────────────────────────────────────────────
export interface ReceiveSampleParams {
  pharmacyId: string;
  medicineId: string;
  batchNumber?: string;
  expiryDate?: Date;
  quantity: number;
  supplierId?: string;
  repName?: string;
  repPhone?: string;
  notes?: string;
  receivedBy: string;
}

export async function receiveSampleBatch(params: ReceiveSampleParams) {
  const {
    pharmacyId, medicineId, batchNumber, expiryDate, quantity,
    supplierId, repName, repPhone, notes, receivedBy,
  } = params;

  if (quantity <= 0) throw new Error('Quantity must be positive');

  const medicine = await prisma.medicine.findFirst({
    where: { id: medicineId, pharmacyId },
    select: { id: true },
  });
  if (!medicine) throw new Error('Medicine not found in this pharmacy');

  return prisma.sampleBatch.create({
    data: {
      pharmacyId,
      medicineId,
      batchNumber: batchNumber ?? null,
      expiryDate: expiryDate ?? null,
      quantity,
      remaining: quantity,
      supplierId: supplierId ?? null,
      repName: repName ?? null,
      repPhone: repPhone ?? null,
      notes: notes ?? null,
      receivedBy,
    },
  });
}

// ─────────────────────────────────────────────────────────
// List sample batches (inventory view)
// ─────────────────────────────────────────────────────────
export async function listSampleBatches(params: {
  pharmacyId: string;
  medicineId?: string;
  activeOnly?: boolean;
  expiringInDays?: number;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(200, Math.max(1, params.limit ?? 50));
  const offset = Math.max(0, params.offset ?? 0);

  const where: Record<string, unknown> = {
    pharmacyId: params.pharmacyId,
    ...(params.activeOnly !== false ? { isActive: true } : {}),
    ...(params.medicineId ? { medicineId: params.medicineId } : {}),
  };

  if (params.expiringInDays) {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + params.expiringInDays);
    where.expiryDate = { lte: horizon };
  }

  const [items, total] = await Promise.all([
    prisma.sampleBatch.findMany({
      where,
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
      include: {
        medicine: { select: { id: true, name: true, brand: true } },
        supplier: { select: { id: true, name: true } },
      },
    }),
    prisma.sampleBatch.count({ where }),
  ]);

  return { items, total, limit, offset };
}

// ─────────────────────────────────────────────────────────
// Distribute sample to a doctor (atomic decrement)
// ─────────────────────────────────────────────────────────
export interface DistributeSampleParams {
  pharmacyId: string;
  sampleBatchId: string;
  doctorId?: string;
  doctorName: string;
  doctorPhone?: string;
  doctorClinic?: string;
  quantity: number;
  notes?: string;
  givenBy: string;
}

export async function distributeSample(params: DistributeSampleParams) {
  const {
    pharmacyId, sampleBatchId, doctorId, doctorName, doctorPhone,
    doctorClinic, quantity, notes, givenBy,
  } = params;

  if (quantity <= 0) throw new Error('Quantity must be positive');

  return prisma.$transaction(async (tx) => {
    const batch = await tx.sampleBatch.findFirst({
      where: { id: sampleBatchId, pharmacyId },
      select: { id: true, remaining: true, isActive: true },
    });
    if (!batch) throw new Error('Sample batch not found');
    if (!batch.isActive) throw new Error('Sample batch inactive');

    // Atomic decrement with race-safe check
    const updated = await tx.sampleBatch.updateMany({
      where: { id: sampleBatchId, remaining: { gte: quantity } },
      data: {
        remaining: { decrement: quantity },
      },
    });
    if (updated.count === 0) {
      throw new Error(`Insufficient sample stock. Available: ${batch.remaining}`);
    }

    const distribution = await tx.sampleDistribution.create({
      data: {
        pharmacyId,
        sampleBatchId,
        doctorId: doctorId ?? null,
        doctorName,
        doctorPhone: doctorPhone ?? null,
        doctorClinic: doctorClinic ?? null,
        quantity,
        notes: notes ?? null,
        givenBy,
      },
    });

    // Auto-deactivate when remaining hits 0
    const fresh = await tx.sampleBatch.findUnique({
      where: { id: sampleBatchId },
      select: { remaining: true },
    });
    if (fresh && fresh.remaining <= 0) {
      await tx.sampleBatch.update({
        where: { id: sampleBatchId },
        data: { isActive: false },
      });
    }

    return distribution;
  });
}

// ─────────────────────────────────────────────────────────
// List distributions (history)
// ─────────────────────────────────────────────────────────
export async function listDistributions(params: {
  pharmacyId: string;
  doctorId?: string;
  sampleBatchId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(200, Math.max(1, params.limit ?? 50));
  const offset = Math.max(0, params.offset ?? 0);

  const where = {
    pharmacyId: params.pharmacyId,
    ...(params.doctorId ? { doctorId: params.doctorId } : {}),
    ...(params.sampleBatchId ? { sampleBatchId: params.sampleBatchId } : {}),
    ...(params.from || params.to
      ? { givenAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.sampleDistribution.findMany({
      where,
      orderBy: { givenAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sampleBatch: {
          include: { medicine: { select: { id: true, name: true, brand: true } } },
        },
        doctor: { select: { id: true, user: { select: { name: true } } } },
      },
    }),
    prisma.sampleDistribution.count({ where }),
  ]);

  return { items, total, limit, offset };
}

// ─────────────────────────────────────────────────────────
// Add feedback to a distribution
// ─────────────────────────────────────────────────────────
export async function addDistributionFeedback(params: {
  distributionId: string;
  pharmacyId: string;
  feedback: string;
}) {
  const dist = await prisma.sampleDistribution.findFirst({
    where: { id: params.distributionId, pharmacyId: params.pharmacyId },
    select: { id: true },
  });
  if (!dist) throw new Error('Distribution not found');

  return prisma.sampleDistribution.update({
    where: { id: params.distributionId },
    data: { feedback: params.feedback, feedbackAt: new Date() },
  });
}

// ─────────────────────────────────────────────────────────
// Stats summary
// ─────────────────────────────────────────────────────────
export async function getSampleStats(pharmacyId: string) {
  const now = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const in90 = new Date();
  in90.setDate(in90.getDate() + 90);

  const [totalBatches, activeBatches, totalRemaining, expiring30, expiring90, totalDistributed, doctorsReached] =
    await Promise.all([
      prisma.sampleBatch.count({ where: { pharmacyId } }),
      prisma.sampleBatch.count({ where: { pharmacyId, isActive: true } }),
      prisma.sampleBatch.aggregate({
        where: { pharmacyId, isActive: true },
        _sum: { remaining: true },
      }),
      prisma.sampleBatch.count({
        where: { pharmacyId, isActive: true, expiryDate: { lte: in30, gte: now } },
      }),
      prisma.sampleBatch.count({
        where: { pharmacyId, isActive: true, expiryDate: { lte: in90, gte: now } },
      }),
      prisma.sampleDistribution.aggregate({
        where: { pharmacyId },
        _sum: { quantity: true },
      }),
      prisma.sampleDistribution.findMany({
        where: { pharmacyId },
        select: { doctorId: true },
        distinct: ['doctorId'],
      }),
    ]);

  return {
    totalBatches,
    activeBatches,
    totalRemaining: Number(totalRemaining._sum.remaining ?? 0),
    expiringIn30Days: expiring30,
    expiringIn90Days: expiring90,
    totalDistributed: Number(totalDistributed._sum.quantity ?? 0),
    uniqueDoctorsReached: doctorsReached.filter((d) => d.doctorId).length,
  };
}

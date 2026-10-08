// Cash Drawer service — Item 22

import { prisma } from '@/lib/prisma';

export type DrawerReason = 'MANUAL' | 'SALE' | 'CHANGE' | 'REFUND' | 'OPEN_SHIFT';

export interface LogDrawerParams {
  pharmacyId: string;
  userId: string;
  reason: DrawerReason;
  amount?: number;
  shiftId?: string;
  posSaleId?: string;
  notes?: string;
  deviceName?: string;
  success?: boolean;
  errorMessage?: string;
}

export async function logCashDrawer(params: LogDrawerParams) {
  return prisma.cashDrawerLog.create({
    data: {
      pharmacyId: params.pharmacyId,
      userId: params.userId,
      reason: params.reason,
      amount: params.amount ?? 0,
      shiftId: params.shiftId ?? null,
      posSaleId: params.posSaleId ?? null,
      notes: params.notes ?? null,
      deviceName: params.deviceName ?? null,
      success: params.success ?? true,
      errorMessage: params.errorMessage ?? null,
    },
  });
}

export async function listCashDrawerLogs(params: {
  pharmacyId: string;
  userId?: string;
  reason?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const { pharmacyId, userId, reason, from, to } = params;
  const limit = Math.min(200, Math.max(1, params.limit ?? 50));
  const offset = Math.max(0, params.offset ?? 0);

  const where = {
    pharmacyId,
    ...(userId ? { userId } : {}),
    ...(reason ? { reason } : {}),
    ...(from || to
      ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.cashDrawerLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.cashDrawerLog.count({ where }),
  ]);

  return { items, total, limit, offset };
}

export async function getDrawerStats(pharmacyId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayCount, todayAmount, openShifts] = await Promise.all([
    prisma.cashDrawerLog.count({
      where: { pharmacyId, createdAt: { gte: todayStart }, success: true },
    }),
    prisma.cashDrawerLog.aggregate({
      where: { pharmacyId, createdAt: { gte: todayStart }, reason: 'SALE' },
      _sum: { amount: true },
    }),
    prisma.cashDrawerLog.count({
      where: { pharmacyId, reason: 'OPEN_SHIFT', createdAt: { gte: todayStart } },
    }),
  ]);

  return {
    todayCount,
    todayAmount: Number(todayAmount._sum.amount ?? 0),
    openShifts,
  };
}

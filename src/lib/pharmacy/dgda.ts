import { prisma } from '@/lib/prisma';

export async function getRegulatoryLogs(params: {
  pharmacyId: string;
  from?: Date;
  to?: Date;
  schedule?: string;
  limit?: number;
}) {
  const where: any = { pharmacyId: params.pharmacyId };
  if (params.from || params.to) {
    where.entryDate = {};
    if (params.from) where.entryDate.gte = params.from;
    if (params.to) where.entryDate.lte = params.to;
  }
  if (params.schedule) where.drugSchedule = params.schedule;

  return prisma.regulatoryLog.findMany({
    where,
    orderBy: { entryDate: 'desc' },
    take: params.limit || 200,
    include: {
      medicine: { select: { id: true, name: true, brand: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });
}

export async function generateDGDAReport(params: {
  pharmacyId: string;
  periodStart: Date;
  periodEnd: Date;
  reportType: string;
  userId: string;
}) {
  const logs = await prisma.regulatoryLog.findMany({
    where: {
      pharmacyId: params.pharmacyId,
      entryDate: { gte: params.periodStart, lte: params.periodEnd },
    },
  });

  const narcoticCount = logs.filter(l => l.drugSchedule === 'NARCOTIC').length;
  const controlledCount = logs.filter(l => l.drugSchedule === 'CONTROLLED').length;

  const count = await prisma.dGDAReport.count({ where: { pharmacyId: params.pharmacyId } });
  const reportNumber = `DGDA-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  return prisma.dGDAReport.create({
    data: {
      pharmacyId: params.pharmacyId,
      reportNumber,
      reportType: params.reportType,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      totalEntries: logs.length,
      narcoticCount,
      controlledCount,
      generatedById: params.userId,
      metadata: { logIds: logs.map(l => l.id) },
    },
  });
}

import { prisma } from '@/lib/prisma';

const DEFAULT_PLATFORM_FEE_PERCENT = 15;
const HOLD_DAYS = 7; // funds available after 7 days

function generatePayoutNumber(seq: number) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `PAY-DOC-${y}${m}-${String(seq).padStart(4, '0')}`;
}

/**
 * Records earning when appointment is completed.
 * Splits gross → platform fee + doctor net.
 */
export async function recordAppointmentEarning(params: {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  grossAmount: number;
}) {
  // Check if already recorded
  const existing = await prisma.doctorEarning.findUnique({
    where: { appointmentId: params.appointmentId },
  });
  if (existing) return existing;

  // Get platform fee from settings
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'doctor_platform_fee_percent' },
  });
  const feePercent = setting ? parseFloat(setting.value) : DEFAULT_PLATFORM_FEE_PERCENT;

  const platformFee = (params.grossAmount * feePercent) / 100;
  const netAmount = params.grossAmount - platformFee;

  const availableAt = new Date();
  availableAt.setDate(availableAt.getDate() + HOLD_DAYS);

  return prisma.doctorEarning.create({
    data: {
      doctorId: params.doctorId,
      appointmentId: params.appointmentId,
      patientId: params.patientId,
      grossAmount: params.grossAmount,
      platformFee,
      netAmount,
      status: 'PENDING',
      availableAt,
    },
  });
}

/**
 * Marks pending earnings as AVAILABLE after hold period.
 */
export async function releaseAvailableEarnings(doctorId: string) {
  return prisma.doctorEarning.updateMany({
    where: {
      doctorId,
      status: 'PENDING',
      availableAt: { lte: new Date() },
    },
    data: { status: 'AVAILABLE' },
  });
}

/**
 * Gets doctor's earnings summary.
 */
export async function getEarningsSummary(doctorId: string) {
  // First release any due earnings
  await releaseAvailableEarnings(doctorId);

  const [pending, available, paid, total] = await Promise.all([
    prisma.doctorEarning.aggregate({
      where: { doctorId, status: 'PENDING' },
      _sum: { netAmount: true },
      _count: { _all: true },
    }),
    prisma.doctorEarning.aggregate({
      where: { doctorId, status: 'AVAILABLE' },
      _sum: { netAmount: true },
      _count: { _all: true },
    }),
    prisma.doctorEarning.aggregate({
      where: { doctorId, status: 'PAID' },
      _sum: { netAmount: true },
      _count: { _all: true },
    }),
    prisma.doctorEarning.aggregate({
      where: { doctorId, status: { not: 'CANCELLED' } },
      _sum: { netAmount: true, grossAmount: true, platformFee: true },
      _count: { _all: true },
    }),
  ]);

  return {
    pending: { amount: Number(pending._sum.netAmount || 0), count: pending._count._all },
    available: { amount: Number(available._sum.netAmount || 0), count: available._count._all },
    paid: { amount: Number(paid._sum.netAmount || 0), count: paid._count._all },
    lifetime: {
      net: Number(total._sum.netAmount || 0),
      gross: Number(total._sum.grossAmount || 0),
      platformFee: Number(total._sum.platformFee || 0),
      count: total._count._all,
    },
  };
}

/**
 * Creates a payout request from available earnings.
 */
export async function requestPayout(params: {
  doctorId: string;
  amount?: number;
  method: string;
  accountInfo: any;
  notes?: string;
}) {
  const availableEarnings = await prisma.doctorEarning.findMany({
    where: { doctorId: params.doctorId, status: 'AVAILABLE' },
    orderBy: { createdAt: 'asc' },
  });

  const totalAvailable = availableEarnings.reduce((s, e) => s + Number(e.netAmount), 0);
  if (totalAvailable <= 0) throw new Error('No available earnings to withdraw');

  const payoutAmount = params.amount && params.amount > 0 ? params.amount : totalAvailable;
  if (payoutAmount > totalAvailable) throw new Error('Insufficient available balance');

  // Select earnings to pay out (FIFO until amount covered)
  const earningsToPay: any[] = [];
  let remaining = payoutAmount;
  for (const e of availableEarnings) {
    if (remaining <= 0) break;
    earningsToPay.push(e);
    remaining -= Number(e.netAmount);
  }

  const count = await prisma.doctorPayout.count();
  const payoutNumber = generatePayoutNumber(count + 1);

  return prisma.$transaction(async (tx) => {
    const payout = await tx.doctorPayout.create({
      data: {
        payoutNumber,
        doctorId: params.doctorId,
        amount: payoutAmount,
        status: 'REQUESTED',
        method: params.method,
        accountInfo: params.accountInfo,
        notes: params.notes || null,
      },
    });

    // Link earnings to payout
    await tx.doctorEarning.updateMany({
      where: { id: { in: earningsToPay.map(e => e.id) } },
      data: { payoutId: payout.id },
    });

    return payout;
  });
}

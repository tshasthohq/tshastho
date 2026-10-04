import { prisma } from '@/lib/prisma';

function generateReferralCode(doctorName: string | null, id: string): string {
  const prefix = (doctorName || 'DOC').replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'DOC';
  const suffix = id.slice(-4).toUpperCase();
  return `${prefix}${suffix}`;
}

export async function getOrCreateReferral(doctorId: string) {
  let referral = await prisma.doctorReferral.findFirst({ where: { doctorId } });
  if (!referral) {
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { name: true },
    });
    let code = generateReferralCode(doctor?.name || null, doctorId);
    // Ensure uniqueness
    let attempt = 0;
    while (await prisma.doctorReferral.findUnique({ where: { code } })) {
      attempt++;
      code = `${generateReferralCode(doctor?.name || null, doctorId)}${attempt}`;
      if (attempt > 100) throw new Error('Could not generate unique code');
    }
    referral = await prisma.doctorReferral.create({
      data: { doctorId, code },
    });
  }
  return referral;
}

export async function findByCode(code: string) {
  return prisma.doctorReferral.findUnique({
    where: { code: code.toUpperCase() },
    include: { doctor: { select: { id: true, name: true, email: true } } },
  });
}

export async function recordReferralUsage(params: {
  referralId: string;
  orderId?: string;
  posSaleId?: string;
  customerId?: string;
  orderAmount: number;
}) {
  const referral = await prisma.doctorReferral.findUnique({ where: { id: params.referralId } });
  if (!referral) throw new Error('Referral not found');

  const commissionAmount = (params.orderAmount * Number(referral.commissionRate)) / 100;

  return await prisma.$transaction(async (tx) => {
    const usage = await tx.referralUsage.create({
      data: {
        referralId: params.referralId,
        orderId: params.orderId || null,
        posSaleId: params.posSaleId || null,
        customerId: params.customerId || null,
        orderAmount: params.orderAmount,
        commissionAmount,
        status: 'PENDING',
      },
    });

    await tx.doctorReferral.update({
      where: { id: params.referralId },
      data: {
        totalReferrals: { increment: 1 },
        totalSales: { increment: params.orderAmount },
        totalEarned: { increment: commissionAmount },
      },
    });

    return usage;
  });
}

export async function getDoctorEarnings(doctorId: string) {
  const referral = await prisma.doctorReferral.findFirst({
    where: { doctorId },
    include: {
      usages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });
  return referral;
}

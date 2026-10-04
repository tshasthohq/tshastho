import { prisma } from '@/lib/prisma';

export async function getPharmacyId(user: any) {
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    return p?.id || null;
  }
  return user.parentPharmacyId;
}

export async function ensureMainBranch(pharmacyId: string) {
  let main = await prisma.pharmacyBranch.findFirst({
    where: { pharmacyId, isMainBranch: true },
  });
  if (!main) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    main = await prisma.pharmacyBranch.create({
      data: {
        pharmacyId,
        name: pharmacy?.shopName || 'Main Branch',
        code: 'MAIN',
        address: pharmacy?.address || 'N/A',
        area: pharmacy?.area || null,
        city: pharmacy?.city || null,
        phone: null,
        isMainBranch: true,
        isActive: true,
      },
    });
  }
  return main;
}

export async function getBranchStock(branchId: string) {
  return prisma.branchStock.findMany({
    where: { branchId },
    include: {
      medicine: { select: { id: true, name: true, brand: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function setBranchStock(params: {
  branchId: string;
  medicineId: string;
  quantity: number;
}) {
  return prisma.branchStock.upsert({
    where: {
      branchId_medicineId: { branchId: params.branchId, medicineId: params.medicineId },
    },
    update: { quantity: params.quantity },
    create: {
      branchId: params.branchId,
      medicineId: params.medicineId,
      quantity: params.quantity,
    },
  });
}

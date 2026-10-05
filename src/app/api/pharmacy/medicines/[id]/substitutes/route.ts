import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

async function getPharmacyId(user: any) {
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    return p?.id || null;
  }
  return user.parentPharmacyId;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const pharmacyId = await getPharmacyId(user);
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const { id } = await params;

  const medicine = await prisma.medicine.findUnique({ where: { id } });
  if (!medicine || medicine.pharmacyId !== pharmacyId) {
    return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Medicine not found', 404);
  }

  // Find substitutes: same genericName, different brand, stock > 0
  let substitutes: any[] = [];
  if (medicine.genericName) {
    substitutes = await prisma.medicine.findMany({
      where: {
        pharmacyId,
        genericName: { equals: medicine.genericName, mode: 'insensitive' },
        id: { not: medicine.id },
        isActive: true,
        stock: { gt: 0 },
      },
      orderBy: [
        { stock: 'desc' },
        { sellingPrice: 'asc' },
      ],
      take: 10,
      select: {
        id: true,
        name: true,
        brand: true,
        genericName: true,
        sellingPrice: true,
        stock: true,
        unit: true,
      },
    });
  }

  // Fallback: same category if no generic matches
  if (substitutes.length === 0 && medicine.category) {
    substitutes = await prisma.medicine.findMany({
      where: {
        pharmacyId,
        category: medicine.category,
        id: { not: medicine.id },
        isActive: true,
        stock: { gt: 0 },
      },
      orderBy: [{ stock: 'desc' }, { sellingPrice: 'asc' }],
      take: 5,
      select: {
        id: true,
        name: true,
        brand: true,
        genericName: true,
        sellingPrice: true,
        stock: true,
        unit: true,
      },
    });
  }

  return NextResponse.json({
    success: true,
    medicine: {
      id: medicine.id,
      name: medicine.name,
      genericName: medicine.genericName,
      category: medicine.category,
    },
    substitutes,
  });
}

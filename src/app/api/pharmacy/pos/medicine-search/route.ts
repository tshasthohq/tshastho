import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  let pharmacyId = user.parentPharmacyId;
  if (user.role === 'PHARMACY_OWNER') {
    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = pharmacy?.id || null;
  }
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const branchId = url.searchParams.get('branchId');

  if (q.length < 2) {
    return NextResponse.json({ success: true, medicines: [] });
  }

  const whereClause: any = {
    pharmacyId,
    isActive: true,
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } },
      { genericName: { contains: q, mode: 'insensitive' } },
    ],
  };

  if (!branchId || branchId === "ALL") {
    whereClause.stock = { gt: 0 };
  }

  let medicines = await prisma.medicine.findMany({
    where: whereClause,
    select: {
      id: true, name: true, brand: true, genericName: true, sellingPrice: true, purchasePrice: true, stock: true, unit: true, stripSize: true, boxSize: true,
    },
    take: 20,
    orderBy: { name: 'asc' },
  });

  if (branchId && branchId !== "ALL" && medicines.length > 0) {
    const firstBranch = await prisma.pharmacyBranch.findFirst({
      where: { pharmacyId },
      orderBy: { createdAt: 'asc' }
    });
    const isMainBranch = firstBranch?.id === branchId;

    const stocks = await prisma.branchStock.findMany({
      where: { branchId, medicineId: { in: medicines.map(m => m.id) } }
    });
    const stockMap = new Map(stocks.map(s => [s.medicineId, s.quantity]));
    
    medicines = medicines.map(m => {
      let stock = 0;
      if (stockMap.has(m.id)) {
        stock = stockMap.get(m.id)!;
      } else if (isMainBranch) {
        stock = m.stock;
      }
      return { ...m, stock };
    }).filter(m => m.stock > 0);
  }

  return NextResponse.json({ success: true, medicines });
}

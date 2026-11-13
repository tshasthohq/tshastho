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
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = p?.id || null;
  }
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const url = new URL(req.url);
  const barcode = url.searchParams.get('barcode');
  const branchId = url.searchParams.get('branchId');

  if (!barcode) return errorResponse(ErrorCodes.VALIDATION_ERROR, 'barcode required', 400);

  const bc = await prisma.medicineBarcode.findUnique({
    where: { barcode },
    include: { medicine: true },
  });

  if (!bc || bc.medicine.pharmacyId !== pharmacyId) {
    return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Barcode not found', 404);
  }

  let currentStock = 0;

  if (branchId === "ALL") {
     // Sum all branch stocks for this medicine
     const allStocks = await prisma.branchStock.aggregate({
       where: { medicineId: bc.medicineId },
       _sum: { quantity: true }
     });
     currentStock = allStocks._sum.quantity || 0;
  } else if (branchId) {
    const branchStock = await prisma.branchStock.findUnique({
      where: { branchId_medicineId: { branchId, medicineId: bc.medicineId } }
    });
    currentStock = branchStock ? branchStock.quantity : 0;
  } else {
    currentStock = bc.medicine.stock; // Fallback
  }

  return NextResponse.json({
    success: true,
    medicine: {
      id: bc.medicine.id,
      name: bc.medicine.name,
      brand: bc.medicine.brand,
      sellingPrice: bc.medicine.sellingPrice,
      purchasePrice: bc.medicine.purchasePrice,
      stock: currentStock,
    },
  });
}

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
  if (!barcode) return errorResponse(ErrorCodes.VALIDATION_ERROR, 'barcode required', 400);

  const bc = await prisma.medicineBarcode.findUnique({
    where: { barcode },
    include: { medicine: true },
  });

  if (!bc || bc.medicine.pharmacyId !== pharmacyId) {
    return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Barcode not found', 404);
  }

  return NextResponse.json({
    success: true,
    medicine: {
      id: bc.medicine.id,
      name: bc.medicine.name,
      brand: bc.medicine.brand,
      sellingPrice: bc.medicine.sellingPrice,
      purchasePrice: bc.medicine.purchasePrice,
      stock: bc.medicine.stock,
    },
  });
}

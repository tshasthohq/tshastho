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

  if (q.length < 2) {
    return NextResponse.json({ success: true, medicines: [] });
  }

  const medicines = await prisma.medicine.findMany({
    where: {
      pharmacyId,
      isActive: true,
      stock: { gt: 0 },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { genericName: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      brand: true,
      genericName: true,
      sellingPrice: true,
      purchasePrice: true,
      stock: true,
      unit: true,
      stripSize: true,
      boxSize: true,
    },
    take: 20,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ success: true, medicines });
}

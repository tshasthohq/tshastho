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

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const pharmacyId = await getPharmacyId(user);
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const url = new URL(req.url);
  const supplierId = url.searchParams.get('supplierId');
  const status = url.searchParams.get('status');

  const where: any = { pharmacyId };
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;

  const credits = await prisma.supplierCreditNote.findMany({
    where,
    orderBy: { issuedAt: 'desc' },
    take: 200,
    include: {
      supplier: { select: { id: true, name: true, companyName: true } },
      returnOrder: { select: { id: true, returnNumber: true } },
      issuedBy: { select: { name: true } },
    },
  });

  // Summary
  const summary = {
    total: credits.reduce((s, c) => s + Number(c.amount), 0),
    available: credits.filter(c => c.status !== 'VOIDED').reduce((s, c) => s + Number(c.balance), 0),
    count: credits.length,
  };

  return NextResponse.json({ success: true, credits, summary });
}

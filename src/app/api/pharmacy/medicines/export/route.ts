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

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET() {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const pharmacyId = await getPharmacyId(user);
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const medicines = await prisma.medicine.findMany({
    where: { pharmacyId },
    orderBy: { name: 'asc' },
  });

  const headers = [
    'name', 'brand', 'genericName', 'category', 'strength',
    'unit', 'purchasePrice', 'sellingPrice', 'stock',
    'stripSize', 'boxSize', 'manufacturer', 'isActive'
  ];

  const rows = [headers.join(',')];
  for (const m of medicines) {
    rows.push([
      escapeCsv(m.name),
      escapeCsv(m.brand),
      escapeCsv(m.genericName),
      escapeCsv(m.category),
      escapeCsv((m as any).strength),
      escapeCsv(m.unit),
      m.purchasePrice,
      m.sellingPrice,
      m.stock,
      m.stripSize,
      m.boxSize,
      escapeCsv(m.manufacturer),
      m.isActive,
    ].join(','));
  }

  const csv = rows.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="medicines-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

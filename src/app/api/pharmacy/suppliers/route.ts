import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2),
  companyName: z.string().optional(),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  let pharmacyId = user.parentPharmacyId;
  if (user.role === 'PHARMACY_OWNER') {
    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = pharmacy?.id || null;
  }
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const suppliers = await prisma.supplier.findMany({
    where: { pharmacyId, isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { purchases: true, batches: true } },
    },
  });

  return NextResponse.json({ success: true, suppliers });
}

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    let pharmacyId = user.parentPharmacyId;
    if (user.role === 'PHARMACY_OWNER') {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id || null;
    }
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const supplier = await prisma.supplier.create({
      data: {
        pharmacyId,
        name: data.name,
        companyName: data.companyName || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        contactPerson: data.contactPerson || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ success: true, supplier }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[SUPPLIER_CREATE]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create supplier', 500);
  }
}

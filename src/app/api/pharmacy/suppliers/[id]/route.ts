import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  companyName: z.string().optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Supplier not found', 404);

    // Ownership check
    if (user.role === 'PHARMACY_OWNER') {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      if (!pharmacy || pharmacy.id !== supplier.pharmacyId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'Not your supplier', 403);
      }
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ success: true, supplier: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update supplier', 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Supplier not found', 404);

  if (user.role === 'PHARMACY_OWNER') {
    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy || pharmacy.id !== supplier.pharmacyId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Not your supplier', 403);
    }
  }

  await prisma.supplier.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ success: true });
}

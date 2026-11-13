import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, purchase: updated });
  } catch (error) {
    console.error("PO status update error:", error);
    return NextResponse.json({ message: "Failed to update status" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const updated = await prisma.branchTransfer.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: auth.user.id, approvedAt: new Date() },
    });
    return NextResponse.json({ success: true, transfer: updated });
  } catch (error) {
    return NextResponse.json({ message: "Failed to approve" }, { status: 500 });
  }
}

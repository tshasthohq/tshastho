import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  const transfer = await prisma.branchTransfer.findUnique({ where: { id } });
  if (!transfer) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Transfer not found', 404);
  if (transfer.status !== "PENDING") return errorResponse(ErrorCodes.CONFLICT, 'Transfer already processed', 409);

  const updated = await prisma.branchTransfer.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: user.id,
      approvedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, transfer: updated });
}

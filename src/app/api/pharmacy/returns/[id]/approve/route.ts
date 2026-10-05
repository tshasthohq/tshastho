import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  const ret = await prisma.returnOrder.findUnique({ where: { id } });
  if (!ret) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Return not found', 404);
  if (ret.status !== "PENDING") return errorResponse(ErrorCodes.CONFLICT, 'Return already processed', 409);

  const updated = await prisma.returnOrder.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: user.id,
      approvedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, return: updated });
}

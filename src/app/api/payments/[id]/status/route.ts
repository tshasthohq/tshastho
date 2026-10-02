import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user!;

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      paymentNumber: true,
      amount: true,
      currency: true,
      status: true,
      method: true,
      gatewayTxnId: true,
      gatewayRefId: true,
      paidAt: true,
      refundedAmount: true,
      orderId: true,
      userId: true,
      createdAt: true,
    },
  });

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  // Only owner or admin can view
  if (payment.userId !== user.id && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ success: true, payment });
}

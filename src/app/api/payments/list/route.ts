import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user!;

  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      paymentNumber: true,
      amount: true,
      currency: true,
      status: true,
      method: true,
      paidAt: true,
      orderId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, payments });
}

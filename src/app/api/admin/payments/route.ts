import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);

  const where: any = {};
  if (status) where.status = status;

  const [payments, stats] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    }),
    prisma.payment.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({ success: true, payments, stats });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user!;

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');

  const where: any = { patientId: user.id };
  if (statusFilter && statusFilter !== 'ALL') where.status = statusFilter as any;

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
    take: 200,
    include: {
      doctor: {
        include: { user: { select: { id: true, name: true } } },
      },
      statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  return NextResponse.json({ success: true, appointments });
}

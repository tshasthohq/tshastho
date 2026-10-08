import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'PENDING';

  const documents = await prisma.doctorDocument.findMany({
    where: { status: status as any },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      doctor: {
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      },
    },
  });

  return NextResponse.json({ success: true, documents });
}

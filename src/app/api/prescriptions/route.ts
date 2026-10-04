import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user!;

  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  return NextResponse.json({ success: true, prescriptions });
}

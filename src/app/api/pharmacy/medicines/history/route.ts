import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const medicineId = url.searchParams.get('medicineId');

  if (!medicineId) {
    return NextResponse.json({ message: "Medicine ID required" }, { status: 400 });
  }

  try {
    const history = await prisma.stockMovement.findMany({
      where: { medicineId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch history" }, { status: 500 });
  }
}

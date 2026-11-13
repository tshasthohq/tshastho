import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    const statusFilter = url.searchParams.get('status');

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const whereClause: any = { pharmacyId: pharmacy.id };
    
    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }
    if (branchId && branchId !== 'ALL') {
      whereClause.branchId = branchId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        patient: { select: { name: true, phone: true } },
        branch: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch orders" }, { status: 500 });
  }
}

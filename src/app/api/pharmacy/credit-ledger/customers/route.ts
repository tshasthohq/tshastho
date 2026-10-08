import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

async function getPharmacyId(user: any) {
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    return p?.id || null;
  }
  return user.parentPharmacyId;
}

export async function GET() {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const pharmacyId = await getPharmacyId(user);
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  // Group by customer to get latest balance
  const entries = await prisma.customerCreditLedger.findMany({
    where: { pharmacyId },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
    },
  });

  // Latest balance per customer
  const seen = new Set<string>();
  const customers: any[] = [];
  for (const e of entries) {
    if (seen.has(e.customerId)) continue;
    seen.add(e.customerId);
    const bal = Number(e.balance);
    if (bal !== 0) {
      customers.push({
        customerId: e.customerId,
        customer: e.customer,
        balance: bal,
        lastActivity: e.createdAt,
      });
    }
  }

  return NextResponse.json({ success: true, customers });
}

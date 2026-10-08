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

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const pharmacyId = await getPharmacyId(user);
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const action = url.searchParams.get('action');
  const userId = url.searchParams.get('userId');
  const severity = url.searchParams.get('severity');

  const where: any = { pharmacyId };
  if (action) where.action = action;
  if (userId) where.userId = userId;
  if (severity) where.severity = severity;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const logs = await prisma.pharmacyAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { user: { select: { id: true, name: true, email: true, staffRole: true } } },
  });

  return NextResponse.json({ success: true, logs });
}

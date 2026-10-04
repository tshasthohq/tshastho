import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth/guards';
import { getOrCreateReferral, findByCode, getDoctorEarnings } from '@/lib/pharmacy/referral';
import { errorResponse, ErrorCodes } from '@/lib/errors';

// GET /api/referrals - doctor's own referral stats OR lookup by code (query)
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user!;

  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  // Public lookup by code (for applying)
  if (code) {
    const referral = await findByCode(code);
    if (!referral) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Invalid referral code', 404);
    return NextResponse.json({
      success: true,
      referral: {
        code: referral.code,
        doctorName: referral.doctor?.name,
        commissionRate: referral.commissionRate,
      },
    });
  }

  // Doctor viewing their own stats
  if (user.role !== 'DOCTOR' && user.role !== 'SUPER_ADMIN') {
    return errorResponse(ErrorCodes.FORBIDDEN, 'Only doctors can view referral stats', 403);
  }

  const referral = await getDoctorEarnings(user.id);
  if (!referral) {
    const created = await getOrCreateReferral(user.id);
    return NextResponse.json({
      success: true,
      referral: { ...created, usages: [] },
    });
  }

  return NextResponse.json({ success: true, referral });
}

// POST /api/referrals - ensure referral code exists for current doctor
export async function POST() {
  const auth = await requireRole(['DOCTOR', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  const referral = await getOrCreateReferral(user.id);
  return NextResponse.json({ success: true, referral }, { status: 201 });
}

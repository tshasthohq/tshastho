import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { z } from 'zod';

const schema = z.object({ action: z.enum(['APPROVE', 'REJECT']), reason: z.string().optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  const { action, reason } = parsed.data;

  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) return NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 404 });
  if (doctor.claimStatus !== 'PENDING' || !doctor.userId) {
    return NextResponse.json({ success: false, message: 'No pending claim on this profile' }, { status: 409 });
  }
  const userId = doctor.userId;

  if (action === 'APPROVE') {
    await prisma.$transaction([
      prisma.doctor.update({ where: { id }, data: { claimStatus: 'CLAIMED', verificationStatus: 'VERIFIED' } }),
      prisma.user.update({ where: { id: userId }, data: { status: 'APPROVED' } }),
      prisma.notification.create({
        data: { userId, title: 'Profile Verified', message: 'Your doctor profile has been verified. You can now log in.' },
      }),
    ]);
    return NextResponse.json({ success: true, message: 'Claim approved' });
  }

  // REJECT: unlink the account, return profile to the directory, reject the user
  await prisma.$transaction([
    prisma.doctor.update({ where: { id }, data: { claimStatus: 'UNCLAIMED', userId: null } }),
    prisma.user.update({ where: { id: userId }, data: { status: 'REJECTED' } }),
  ]);
  return NextResponse.json({ success: true, message: 'Claim rejected', reason: reason || null });
}

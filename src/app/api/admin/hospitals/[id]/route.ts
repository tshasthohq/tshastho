import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { getClientIp } from '@/lib/hospital-access';

type Action = 'APPROVE' | 'REJECT' | 'SUSPEND';

const bodySchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND']),
  reason: z.string().trim().min(3).max(500).optional(),
});

const ALLOWED_FROM: Record<Action, string[]> = {
  APPROVE: ['PENDING', 'REJECTED', 'SUSPENDED'],
  REJECT: ['PENDING'],
  SUSPEND: ['APPROVED'],
};

const NEXT_STATUS: Record<Action, 'APPROVED' | 'REJECTED' | 'SUSPENDED'> = {
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  SUSPEND: 'SUSPENDED',
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(['SUPER_ADMIN']);
  if (error || !user) {
    return error ?? NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : 'Invalid JSON';
    return NextResponse.json({ error: `Invalid request: ${msg}` }, { status: 400 });
  }

  if ((body.action === 'REJECT' || body.action === 'SUSPEND') && !body.reason) {
    return NextResponse.json({ error: 'A reason is required' }, { status: 400 });
  }

  const hospital = await prisma.hospital.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

  if (!ALLOWED_FROM[body.action].includes(hospital.status)) {
    return NextResponse.json(
      { error: `Cannot ${body.action.toLowerCase()} a hospital that is ${hospital.status}` },
      { status: 409 }
    );
  }

  const nextStatus = NEXT_STATUS[body.action];
  const ip = getClientIp(req);

  await prisma.$transaction(async (tx) => {
    await tx.hospital.update({
      where: { id },
      data: {
        status: nextStatus,
        verifiedAt: nextStatus === 'APPROVED' ? new Date() : undefined,
        rejectionReason: nextStatus === 'APPROVED' ? null : body.reason ?? null,
      },
    });

    if (nextStatus === 'APPROVED') {
      const owners = await tx.hospitalMember.findMany({
        where: { hospitalId: id, role: 'OWNER', status: 'ACTIVE' },
        select: { userId: true },
      });
      await tx.user.updateMany({
        where: { id: { in: owners.map((o) => o.userId) }, status: 'PENDING' },
        data: { status: 'APPROVED' },
      });
    }

    await tx.hospitalAuditLog.create({
      data: {
        hospitalId: id,
        userId: user.id,
        action: `HOSPITAL_${nextStatus}`,
        resource: 'Hospital',
        resourceId: id,
        ipAddress: ip,
        details: body.reason ? { reason: body.reason } : undefined,
      },
    });
  });

  return NextResponse.json({ success: true, status: nextStatus });
}

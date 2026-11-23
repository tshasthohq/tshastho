import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

export type HospitalRole =
  | 'OWNER'
  | 'ADMIN'
  | 'BRANCH_MANAGER'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'ACCOUNTANT'
  | 'LAB_STAFF'
  | 'PHARMACIST';

export type HospitalCtx = { id: string; slug: string; name: string; status: string };
export type HospitalMemberCtx = { id: string | null; role: HospitalRole; branchIds: string[] };

export type HospitalAccess =
  | { error: NextResponse; user: null; hospital: null; member: null; isPlatformAdmin: false }
  | {
      error: null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: any;
      hospital: HospitalCtx;
      member: HospitalMemberCtx;
      isPlatformAdmin: boolean;
    };

type AccessOptions = {
  roles?: HospitalRole[];
  requireApproved?: boolean;
};

const ALL_BRANCH_ROLES: HospitalRole[] = ['OWNER', 'ADMIN'];

const deny = (error: NextResponse): HospitalAccess => ({
  error,
  user: null,
  hospital: null,
  member: null,
  isPlatformAdmin: false,
});

const notFound = () => NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

/** OWNER and ADMIN see every branch. Everyone else only their assigned branches. */
export function canAccessBranch(member: { role: string; branchIds: string[] }, branchId: string): boolean {
  if (ALL_BRANCH_ROLES.includes(member.role as HospitalRole)) return true;
  return member.branchIds.includes(branchId);
}

/**
 * Every hospital API must call this first.
 * Non-members get 404 (not 403) so hospital existence is never leaked.
 */
export async function requireHospitalAccess(
  hospitalId: string,
  options: AccessOptions = {}
): Promise<HospitalAccess> {
  const { roles, requireApproved = true } = options;

  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return deny(auth.error ?? NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
  }
  const user = auth.user;

  const hospital = await prisma.hospital.findFirst({
    where: { id: hospitalId, deletedAt: null },
    select: { id: true, slug: true, name: true, status: true },
  });
  if (!hospital) return deny(notFound());

  const isPlatformAdmin = user.role === 'SUPER_ADMIN';
  let member: HospitalMemberCtx;

  if (isPlatformAdmin) {
    member = { id: null, role: 'OWNER', branchIds: [] };
  } else {
    const m = await prisma.hospitalMember.findUnique({
      where: { hospitalId_userId: { hospitalId, userId: user.id } },
      select: { id: true, role: true, status: true, branchIds: true },
    });
    if (!m || m.status !== 'ACTIVE') return deny(notFound());
    member = { id: m.id, role: m.role, branchIds: m.branchIds };
  }

  if (requireApproved && hospital.status !== 'APPROVED' && !isPlatformAdmin) {
    return deny(
      NextResponse.json({ error: 'Hospital is not active', status: hospital.status }, { status: 403 })
    );
  }

  if (roles && !roles.includes(member.role)) {
    return deny(NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 }));
  }

  return { error: null, user, hospital, member, isPlatformAdmin };
}

/** Hospitals this user belongs to (for the branch/hospital switcher). */
export async function listMyHospitals(userId: string) {
  return prisma.hospitalMember.findMany({
    where: { userId, status: 'ACTIVE', hospital: { deletedAt: null } },
    select: {
      role: true,
      branchIds: true,
      hospital: { select: { id: true, slug: true, name: true, nameBn: true, logo: true, status: true } },
    },
  });
}

/** Audit logging must never break the main request. */
export async function logHospitalAudit(params: {
  hospitalId: string;
  userId?: string | null;
  branchId?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await prisma.hospitalAuditLog.create({
      data: {
        hospitalId: params.hospitalId,
        userId: params.userId ?? null,
        branchId: params.branchId ?? null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        details: params.details as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    console.error('[HOSPITAL_AUDIT]', e instanceof Error ? e.message : e);
  }
}

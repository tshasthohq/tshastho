import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { rateLimit } from '@/lib/rate-limit';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { getClientIp } from '@/lib/hospital-access';

const HOSPITAL_TYPES = [
  'GENERAL', 'SPECIALIZED', 'TEACHING', 'CLINIC', 'MATERNITY',
  'EYE', 'DENTAL', 'CANCER', 'HEART', 'CHILD', 'OTHER',
] as const;

const schema = z.object({
  ownerName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(20).optional(),
  password: z.string().min(8).max(100),

  hospitalName: z.string().trim().min(2).max(150),
  hospitalNameBn: z.string().trim().max(150).optional(),
  type: z.enum(HOSPITAL_TYPES).default('GENERAL'),
  licenseNo: z.string().trim().min(3).max(100),
  registrationNo: z.string().trim().max(100).optional(),
  licenseDocUrl: z.string().trim().max(500).optional(),

  branchName: z.string().trim().min(2).max(100).default('Main Branch'),
  address: z.string().trim().min(5).max(300),
  area: z.string().trim().max(100).optional(),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().max(100).optional(),
  branchPhone: z.string().trim().max(20).optional(),
  emergencyPhone: z.string().trim().max(20).optional(),
  bedCount: z.number().int().min(0).max(100000).optional(),
  is24x7: z.boolean().default(false),
  hasEmergency: z.boolean().default(false),
});

function makeSlug(name: string): string {
  const base =
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'hospital';
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(ip);
    if (!limit.success) return errorResponse(ErrorCodes.RATE_LIMITED, 'Too many requests', 429);

    const raw = await req.json();
    const cleaned = Object.fromEntries(
      Object.entries(raw ?? {}).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const data = schema.parse(cleaned);

    const [emailTaken, licenseTaken] = await Promise.all([
      prisma.user.findFirst({
        where: { email: { equals: data.email, mode: 'insensitive' } },
        select: { id: true },
      }),
      prisma.hospital.findUnique({ where: { licenseNo: data.licenseNo }, select: { id: true } }),
    ]);
    if (emailTaken) return errorResponse(ErrorCodes.CONFLICT, 'Email already exists', 409);
    if (licenseTaken) {
      return errorResponse(ErrorCodes.CONFLICT, 'This license number is already registered', 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.ownerName,
          email: data.email,
          password: hashedPassword,
          phone: data.phone || null,
          role: 'HOSPITAL_ADMIN',
          status: 'PENDING',
        },
      });

      const hospital = await tx.hospital.create({
        data: {
          slug: makeSlug(data.hospitalName),
          name: data.hospitalName,
          nameBn: data.hospitalNameBn || null,
          type: data.type,
          licenseNo: data.licenseNo,
          registrationNo: data.registrationNo || null,
          licenseDocUrl: data.licenseDocUrl || null,
          email: data.email,
          phone: data.branchPhone || data.phone || null,
          status: 'PENDING',
        },
      });

      const branch = await tx.hospitalBranch.create({
        data: {
          hospitalId: hospital.id,
          name: data.branchName,
          code: 'MAIN',
          address: data.address,
          area: data.area || null,
          city: data.city,
          district: data.district || null,
          phone: data.branchPhone || null,
          emergencyPhone: data.emergencyPhone || null,
          bedCount: data.bedCount ?? null,
          is24x7: data.is24x7,
          hasEmergency: data.hasEmergency,
          isMain: true,
        },
      });

      await tx.hospitalMember.create({
        data: { hospitalId: hospital.id, userId: user.id, role: 'OWNER', status: 'ACTIVE', branchIds: [] },
      });

      await tx.hospitalAuditLog.create({
        data: {
          hospitalId: hospital.id,
          branchId: branch.id,
          userId: user.id,
          action: 'HOSPITAL_REGISTERED',
          resource: 'Hospital',
          resourceId: hospital.id,
          ipAddress: ip,
        },
      });

      return { hospitalId: hospital.id, slug: hospital.slug };
    });

    return NextResponse.json(
      { success: true, message: 'Hospital registration submitted for approval', ...result },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const where = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
      return errorResponse(ErrorCodes.VALIDATION_ERROR, `${where}${issue?.message ?? 'Invalid input'}`, 400);
    }
    if ((error as { code?: string } | null)?.code === 'P2002') {
      return errorResponse(ErrorCodes.CONFLICT, 'Email or license number already registered', 409);
    }
    console.error('[HOSPITAL_REGISTER]', error instanceof Error ? error.message : 'Unknown error');
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

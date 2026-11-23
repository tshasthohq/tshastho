import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { rateLimit } from '@/lib/rate-limit';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  centerName: z.string().min(2),
  address: z.string().min(5),
  area: z.string().optional(),
  city: z.string().min(2),
  tradeLicense: z.string().optional(),
  dghsLicense: z.string().optional(),
  tradeLicenseUrl: z.string().optional(),
  dghsLicenseUrl: z.string().optional(),
});

const DEFAULT_DEPARTMENTS = [
  'Pathology', 'Hematology', 'Biochemistry', 'Microbiology', 'Immunology',
  'X-Ray', 'Ultrasonography', 'ECG', 'Others',
];

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = rateLimit(ip);
    if (!limit.success) return errorResponse(ErrorCodes.RATE_LIMITED, 'Too many requests', 429);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ message: 'Please check all required fields' }, { status: 400 });
    }
    const data = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return errorResponse(ErrorCodes.CONFLICT, 'Email already exists', 409);

    const hashed = await hashPassword(data.password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashed,
          phone: data.phone || null,
          role: 'DIAGNOSTIC_OWNER',
          status: 'PENDING',
        },
      });
      const diagnostic = await tx.diagnostic.create({
        data: {
          userId: user.id,
          centerName: data.centerName,
          phone: data.phone || null,
          address: data.address,
          area: data.area || null,
          city: data.city,
          tradeLicense: data.tradeLicense || null,
          dghsLicense: data.dghsLicense || null,
          tradeLicenseUrl: data.tradeLicenseUrl || null,
          dghsLicenseUrl: data.dghsLicenseUrl || null,
        },
      });
      await tx.diagnosticBranch.create({
        data: {
          diagnosticId: diagnostic.id,
          name: `${data.centerName} (Main)`,
          code: 'MAIN',
          address: data.address,
          city: data.city,
          phone: data.phone || null,
          isMain: true,
        },
      });
      await tx.diagnosticDepartment.createMany({
        data: DEFAULT_DEPARTMENTS.map((name, i) => ({
          diagnosticId: diagnostic.id,
          name,
          sortOrder: i,
        })),
      });
    });

    return NextResponse.json(
      { success: true, message: 'Application submitted. Admin will approve your account.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Diagnostic register error:', error);
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}

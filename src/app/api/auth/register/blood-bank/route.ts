import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { rateLimit } from '@/lib/rate-limit';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { BD_PHONE } from '@/lib/blood';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .refine((v) => BD_PHONE.test(v), 'Enter a valid Bangladeshi phone number'),
  bankName: z.string().min(2),
  dghsLicense: z.string().min(3),
  tradeLicense: z.string().optional(),
  licenseUrl: z.string().optional(),
  address: z.string().min(5),
  area: z.string().optional(),
  district: z.string().min(2),
  division: z.string().optional(),
  is24h: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = rateLimit(ip);
    if (!limit.success) return errorResponse(ErrorCodes.RATE_LIMITED, 'Too many requests', 429);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const data = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
      select: { id: true },
    });
    if (existing) return errorResponse(ErrorCodes.CONFLICT, 'Email or phone already registered', 409);

    const lic = await prisma.bloodBank.findUnique({ where: { dghsLicense: data.dghsLicense }, select: { id: true } });
    if (lic) return errorResponse(ErrorCodes.CONFLICT, 'This license is already registered', 409);

    const hashed = await hashPassword(data.password);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: data.name, email: data.email, password: hashed, phone: data.phone, role: 'BLOOD_BANK_OWNER', status: 'PENDING' },
      });
      await tx.bloodBank.create({
        data: {
          userId: user.id, name: data.bankName, phone: data.phone, address: data.address,
          area: data.area || null, district: data.district, division: data.division || null,
          dghsLicense: data.dghsLicense, tradeLicense: data.tradeLicense || null,
          licenseUrl: data.licenseUrl || null, is24h: data.is24h === true,
        },
      });
    });

    return NextResponse.json(
      { success: true, message: 'Registration submitted. We will review your license and approve your account.' },
      { status: 201 }
    );
  } catch (e) {
    console.error('[REGISTER_BLOOD_BANK]', e);
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}

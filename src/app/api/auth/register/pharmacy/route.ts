import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { rateLimit } from '@/lib/rate-limit';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  shopName: z.string().min(2),
  drugLicense: z.string().min(3),
  tradeLicense: z.string().min(3),
  address: z.string().min(5),
  area: z.string().min(2),
  city: z.string().min(2),
  drugLicenseUrl: z.string().optional(),
  tradeLicenseUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = rateLimit(ip);
    if (!limit.success) return errorResponse(ErrorCodes.RATE_LIMITED, 'Too many requests', 429);

    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return errorResponse(ErrorCodes.CONFLICT, 'Email already exists', 409);

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || null,
        role: 'PHARMACY_OWNER',
        status: "PENDING",
      },
    });

    const pharmacy = await prisma.pharmacy.create({
      data: {
        userId: user.id,
        shopName: data.shopName,
        drugLicense: data.drugLicense,
        tradeLicense: data.tradeLicense,
        drugLicenseUrl: data.drugLicenseUrl || null,
        tradeLicenseUrl: data.tradeLicenseUrl || null,
        address: data.address,
        area: data.area,
        city: data.city,
      },
    });

    // 🔥 Main Branch তৈরি করা হচ্ছে
    await prisma.pharmacyBranch.create({
      data: {
        pharmacyId: pharmacy.id,
        name: `${data.shopName} (Main)`,
        code: "MAIN",
        address: data.address,
        area: data.area,
        city: data.city,
        phone: data.phone || null,
        isMainBranch: true,
        isActive: true,
      }
    });

    // 🔥 AUTO-CATALOG SYNC: নতুন ফার্মেসির ইনভেন্টরিতে ৫,৬১৬টি মেডিসিন (স্টক ০) কপি করা
    try {
      const masterMeds = await prisma.masterMedicine.findMany();
      if (masterMeds.length > 0) {
        const medicinesData = masterMeds.map(master => ({
          pharmacyId: pharmacy.id,
          masterMedicineId: master.id,
          name: master.name,
          brand: master.brand,
          genericName: master.genericName,
          category: master.category,
          purchasePrice: 0,
          sellingPrice: 0,
          stock: 0,
          unit: "piece",
          isActive: true
        }));

        await prisma.medicine.createMany({
          data: medicinesData,
          skipDuplicates: true
        });
        console.log(`✅ Auto-synced ${masterMeds.length} medicines to new pharmacy: ${pharmacy.shopName}`);
      }
    } catch (syncError) {
      console.error('[PHARMACY_CATALOG_SYNC_ERROR]', syncError);
    }

    return NextResponse.json({ success: true, message: 'Pharmacy registration submitted for approval', userId: user.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, JSON.stringify(error.issues[0]), 400);
    console.error('[PHARMACY_REGISTER]', error instanceof Error ? error.message : 'Unknown error');
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

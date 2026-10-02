import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { pharmacyId, shopName, address, area, city, deliveryRadius, logo } = await req.json();

    const pharmacy = await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        shopName,
        address,
        area: area || null,
        city,
        deliveryRadius: parseInt(deliveryRadius) || 5,
        logo: logo || null,
      },
    });

    return NextResponse.json({ message: "Updated!", pharmacy }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

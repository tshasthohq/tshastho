import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
        const user = await prisma.user.findFirst({ where: { email: auth.user.email }});
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) {
      pharmacy = await prisma.pharmacy.findFirst({
        where: { id: user.parentPharmacyId },
        include: { user: true },
      });
    }
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.findFirst({
        where: { userId: user.id },
        include: { user: true },
      });
    }

    return NextResponse.json({ pharmacy }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

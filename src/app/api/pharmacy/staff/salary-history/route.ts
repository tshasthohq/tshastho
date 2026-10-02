import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { email, staffId } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    }
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    }
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const history = await prisma.salaryPayment.findMany({
      where: { staffId, pharmacyId: pharmacy.id },
      orderBy: { month: "desc" },
    });

    let totalPaid = 0;
    for (const h of history) {
      totalPaid += parseFloat(h.paidAmount.toString());
    }

    return NextResponse.json({ history, totalPaid }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

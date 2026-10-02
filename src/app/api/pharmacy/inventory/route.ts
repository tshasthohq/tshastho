import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { email } = await req.json();
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

    const medicines = await prisma.medicine.findMany({
      where: { pharmacyId: pharmacy.id },
      orderBy: { stock: "asc" },
    });

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const totalItems = medicines.length;
    const lowStock = medicines.filter(m => m.stock > 0 && m.stock <= 10).length;
    const outOfStock = medicines.filter(m => m.stock === 0).length;
    const totalStockValue = medicines.reduce((sum, m) => sum + (parseFloat(m.sellingPrice.toString()) * m.stock), 0);

    // Expiry stats
    const expired = medicines.filter(m => m.expiryDate && new Date(m.expiryDate) < now).length;
    const expiringSoon = medicines.filter(m => m.expiryDate && new Date(m.expiryDate) >= now && new Date(m.expiryDate) <= thirtyDaysLater).length;
    const expiringWarning = medicines.filter(m => m.expiryDate && new Date(m.expiryDate) > thirtyDaysLater && new Date(m.expiryDate) <= ninetyDaysLater).length;
    const safe = medicines.filter(m => !m.expiryDate || new Date(m.expiryDate) > ninetyDaysLater).length;

    return NextResponse.json({
      medicines,
      stats: {
        totalItems,
        lowStock,
        outOfStock,
        totalStockValue,
        expired,
        expiringSoon,
        expiringWarning,
        safe,
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

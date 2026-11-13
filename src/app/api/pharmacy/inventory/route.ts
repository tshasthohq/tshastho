import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    // সরাসরি auth থেকে ইউজার নেওয়া হচ্ছে
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const medicines = await prisma.medicine.findMany({
      where: { pharmacyId: pharmacy.id },
    });

    let totalItems = medicines.length;
    let lowStock = 0;
    let outOfStock = 0;
    let totalStockValue = 0;
    
    let expired = 0;
    let expiringSoon = 0; // < 30 days
    let expiringWarning = 0; // < 90 days
    let safe = 0;

    const now = new Date();

    for (const med of medicines) {
      // স্টক ক্যালকুলেশন
      if (med.stock === 0) outOfStock++;
      else if (med.stock <= (med.lowStockAlert || 10)) lowStock++;
      
      totalStockValue += med.stock * Number(med.sellingPrice);

      // এক্সপায়ারি ক্যালকুলেশন
      if (med.expiryDate) {
        const exp = new Date(med.expiryDate);
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) expired++;
        else if (daysLeft <= 30) expiringSoon++;
        else if (daysLeft <= 90) expiringWarning++;
        else safe++;
      } else {
        safe++; // যদি এক্সপায়ারি ডেট না থাকে
      }
    }

    return NextResponse.json({
      success: true,
      medicines,
      stats: {
        totalItems,
        lowStock,
        outOfStock,
        totalStockValue,
        expired,
        expiringSoon,
        expiringWarning,
        safe
      }
    });

  } catch (error) {
    console.error("Inventory stats error:", error);
    return NextResponse.json({ message: "Failed to fetch inventory stats" }, { status: 500 });
  }
}

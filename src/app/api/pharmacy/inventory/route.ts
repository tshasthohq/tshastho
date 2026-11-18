import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    else pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const page = body.page || 1;
    const limit = body.limit || 20;
    const search = body.search || '';

    const whereClause: any = {
      pharmacyId: pharmacy.id,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {})
    };

    const [medicines, totalItems] = await Promise.all([
      prisma.medicine.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { name: 'asc' }
      }),
      prisma.medicine.count({ where: whereClause })
    ]);

    const allMedicinesForStats = await prisma.medicine.findMany({
      where: { pharmacyId: pharmacy.id },
      select: { stock: true, sellingPrice: true, expiryDate: true, lowStockAlert: true }
    });

    let lowStock = 0, outOfStock = 0, totalStockValue = 0, expired = 0, expiringSoon = 0, expiringWarning = 0, safe = 0;
    const now = new Date();

    for (const med of allMedicinesForStats) {
      if (med.stock === 0) outOfStock++;
      else if (med.stock <= (med.lowStockAlert || 10)) lowStock++;
      totalStockValue += med.stock * Number(med.sellingPrice);
      if (med.expiryDate) {
        const exp = new Date(med.expiryDate);
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) expired++;
        else if (daysLeft <= 30) expiringSoon++;
        else if (daysLeft <= 90) expiringWarning++;
        else safe++;
      } else safe++;
    }

    return NextResponse.json({
      success: true,
      medicines,
      stats: { totalItems: allMedicinesForStats.length, lowStock, outOfStock, totalStockValue, expired, expiringSoon, expiringWarning, safe },
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) }
    });

  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

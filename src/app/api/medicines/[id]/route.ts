import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // ১. মেইন মেডিসিন ফেচ
    const targetMed = await prisma.medicine.findUnique({ where: { id } });
    if (!targetMed) return NextResponse.json({ message: "Medicine not found" }, { status: 404 });

    const medicine = await prisma.medicine.findFirst({
      where: { id },
      include: {
        masterMedicine: true,
        pharmacy: { select: { id: true, shopName: true, address: true, city: true, user: { select: { isVerified: true } } } },
        branchStocks: {
          where: { quantity: { gt: 0 } },
          include: { branch: { select: { name: true } } }
        }
      }
    });

    // ২. সব ফার্মেসির স্টক ও দাম (Best Price বের করার জন্য)
    const allPharmacies = await prisma.medicine.findMany({
      where: {
        name: targetMed.name,
        brand: targetMed.brand,
        strength: targetMed.strength,
        isActive: true,
        branchStocks: { some: { quantity: { gt: 0 } } }
      },
      include: {
        pharmacy: { select: { id: true, shopName: true, city: true, user: { select: { isVerified: true } } } },
        branchStocks: { where: { quantity: { gt: 0 } } }
      },
      orderBy: { sellingPrice: 'asc' }
    });

    // ৩. বিকল্প ওষুধ (Alternatives) - অন্য ব্র্যান্ডের একই জেনেরিক
    let substitutes: any[] = [];
    if (medicine?.genericName) {
      substitutes = await prisma.medicine.findMany({
        where: {
          genericName: { contains: medicine.genericName, mode: 'insensitive' },
          ...(medicine.category && { category: medicine.category }),
          isActive: true,
          NOT: {
            AND: [
              { name: medicine.name },
              { brand: medicine.brand }
            ]
          }
        },
        distinct: ['name', 'brand'],
        orderBy: { name: 'asc' },
        take: 200,
        select: { id: true, name: true, brand: true, sellingPrice: true, stock: true }
      });
    }

    // ৪. একই ব্র্যান্ডের অন্যান্য ডোজ (Also Available As)
    const sameBrandMeds = await prisma.medicine.findMany({
      where: {
        brand: targetMed.brand,
        id: { not: targetMed.id },
        isActive: true,
      },
      take: 5,
      select: { id: true, name: true, category: true, strength: true, sellingPrice: true }
    });

    return NextResponse.json({ medicine, allPharmacies, substitutes, sameBrandMeds });
  } catch (error) {
    console.error("Medicine details error:", error);
    return NextResponse.json({ message: "Error fetching details" }, { status: 500 });
  }
}

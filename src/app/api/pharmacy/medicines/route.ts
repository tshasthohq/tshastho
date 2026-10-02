import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
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
      orderBy: { createdAt: "desc" },
    });

    const setting = await prisma.systemSetting.findUnique({ where: { key: "platform_fee_percent" } });
    const platformFeePercent = setting ? parseFloat(setting.value) : 5;

    return NextResponse.json({ medicines, pharmacy, platformFeePercent }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, name, brand, genericName, category, description, purchasePrice, sellingPrice, discountPercent, stock, unit, manufacturer, masterMedicineId, images, expiryDate, batchNumber } = body;

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

    const medicine = await prisma.medicine.create({
      data: {
        pharmacyId: pharmacy.id,
        masterMedicineId: masterMedicineId || null,
        name,
        brand: brand || null,
        genericName: genericName || null,
        category: category || null,
        description: description || null,
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice),
        discountPercent: parseFloat(discountPercent) || 0,
        stock: parseInt(stock),
        unit: unit || "piece",
        manufacturer: manufacturer || null,
        images: Array.isArray(images) ? images : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        batchNumber: batchNumber || null,
      },
    });

    return NextResponse.json({ message: "Medicine added! ✅", medicine }, { status: 201 });
  } catch (error) {
    console.error("Add error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

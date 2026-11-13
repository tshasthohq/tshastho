import { requireRole } from "@/lib/auth/guards";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const branchId = body.branchId;

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
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

    let mappedMedicines = medicines;
    
    if (branchId) {
      if (branchId === "ALL") {
        const allStocks = await prisma.branchStock.groupBy({
          by: ['medicineId'],
          where: { medicine: { pharmacyId: pharmacy.id } },
          _sum: { quantity: true }
        });
        const globalStockMap = new Map(allStocks.map(s => [s.medicineId, s._sum.quantity || 0]));
        
        mappedMedicines = medicines.map(med => ({
          ...med,
          stock: globalStockMap.get(med.id) || 0
        }));
      } else {
        const medIds = medicines.map(m => m.id);
        const stocks = await prisma.branchStock.findMany({
          where: { branchId: branchId, medicineId: { in: medIds } }
        });
        const stockMap = new Map(stocks.map(s => [s.medicineId, s.quantity]));

        mappedMedicines = medicines.map(med => ({
          ...med,
          stock: stockMap.get(med.id) ?? 0 
        }));
      }
    }

    const setting = await prisma.systemSetting.findUnique({ where: { key: "platform_fee_percent" } });
    const platformFeePercent = setting ? parseFloat(setting.value) : 5;

    return NextResponse.json({ medicines: mappedMedicines, pharmacy, platformFeePercent }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { email, name, brand, genericName, category, description, purchasePrice, sellingPrice, discountPercent, stock, unit, manufacturer, masterMedicineId, images, expiryDate, batchNumber, lowStockAlert, barcode, supplier } = body;

    const user = await prisma.user.findFirst({ where: { email: auth.user.email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    }
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    }
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const parsedStock = parseInt(stock) || 0;

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
        stock: parsedStock, 
        unit: unit || "piece",
        manufacturer: manufacturer || null,
        images: Array.isArray(images) ? images : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        batchNumber: batchNumber || null, 
        lowStockAlert: parseInt(lowStockAlert) || 10, 
        barcode: barcode || null, 
        supplier: supplier || null,
      },
    });

    // 🔥 NEW: Automatically add the new medicine to the Main Branch's BranchStock
    const mainBranch = await prisma.pharmacyBranch.findFirst({
      where: { pharmacyId: pharmacy.id },
      orderBy: { createdAt: 'asc' }
    });

    if (mainBranch) {
      await prisma.branchStock.upsert({
        where: { branchId_medicineId: { branchId: mainBranch.id, medicineId: medicine.id } },
        update: { quantity: parsedStock },
        create: { branchId: mainBranch.id, medicineId: medicine.id, quantity: parsedStock }
      });
    }

    return NextResponse.json({ message: "Medicine added! ✅", medicine }, { status: 201 });
  } catch (error) {
    console.error("Add error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

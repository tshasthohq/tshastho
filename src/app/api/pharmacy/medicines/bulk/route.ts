import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from "@/lib/auth/guards";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { medicines } = body;

    if (!medicines || !Array.isArray(medicines)) {
      return NextResponse.json({ message: "Invalid data format" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    // ম্যাপিং লজিক (সব ডাটা একসাথে তৈরি)
    const medicinesData = [];
    let failCount = 0;

    for (const row of medicines) {
      const name = row.Name || row.name;
      const sellingPrice = row.SellingPrice || row.sellingPrice;

      if (!name || sellingPrice === undefined) {
        failCount++;
        continue;
      }

      medicinesData.push({
        id: randomUUID(),
        pharmacyId: pharmacy.id,
        name: String(name),
        brand: row.Brand || row.brand ? String(row.Brand || row.brand) : null,
        genericName: row.Generic || row.genericName ? String(row.Generic || row.genericName) : null,
        category: row.Category || row.category ? String(row.Category || row.category) : null,
        purchasePrice: parseFloat(row.PurchasePrice || row.purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        stock: parseInt(row.Stock || row.stock) || 0,
        unit: row.Unit || row.unit ? String(row.Unit || row.unit) : "Piece",
        manufacturer: row.Manufacturer || row.manufacturer ? String(row.Manufacturer || row.manufacturer) : null,
        batchNumber: row.BatchNumber || row.batchNumber ? String(row.BatchNumber || row.batchNumber) : null,
        expiryDate: row.ExpiryDate || row.expiryDate ? new Date(row.ExpiryDate || row.expiryDate) : null,
      });
    }

    // একবারে সব ডাটা ডাটাবেসে সেভ (সুপারফাস্ট)
    let successCount = 0;
    if (medicinesData.length > 0) {
      const result = await prisma.medicine.createMany({
        data: medicinesData,
        skipDuplicates: true,
      });
      successCount = result.count;
      try {
        const ids = medicinesData.map((m: any) => m.id);
        const qtyById = new Map(medicinesData.map((m: any) => [m.id, Number(m.stock || 0)]));
        const movements: any[] = [];
        for (let i = 0; i < ids.length; i += 5000) {
          const made = await prisma.medicine.findMany({ where: { id: { in: ids.slice(i, i + 5000) } }, select: { id: true } });
          for (const c of made) {
            const q = Number(qtyById.get(c.id) || 0);
            if (q > 0) movements.push({ pharmacyId: pharmacy!.id, medicineId: c.id, type: "OPENING", quantity: q, previousStock: 0, newStock: q, reason: "Bulk import", userId: auth.user.id });
          }
        }
        for (let i = 0; i < movements.length; i += 5000) {
          await prisma.stockMovement.createMany({ data: movements.slice(i, i + 5000) });
        }
      } catch (e) { console.error("[BULK] ledger write failed", e); }
    }

    return NextResponse.json({ success: true, message: `Added ${successCount} medicines. Failed: ${failCount}` });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ message: "Server error during import" }, { status: 500 });
  }
}

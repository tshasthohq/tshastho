import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

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

    let successCount = 0;
    let failCount = 0;

    for (const row of medicines) {
      // এক্সেলের হেডার অনুযায়ী ডাটা ম্যাপ করা (বড় হাতের অক্ষর)
      const name = row.Name || row.name;
      const sellingPrice = row.SellingPrice || row.sellingPrice;

      if (!name || sellingPrice === undefined) {
        failCount++; // কাউন্ট করা হচ্ছে কতোগুলো ফেইল হলো
        continue; 
      }

      try {
        await prisma.medicine.create({
          data: {
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
          }
        });
        successCount++;
      } catch (err) {
        console.error("Failed to insert row:", name, err);
        failCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Added ${successCount} medicines. Failed: ${failCount}` });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ message: "Server error during import" }, { status: 500 });
  }
}

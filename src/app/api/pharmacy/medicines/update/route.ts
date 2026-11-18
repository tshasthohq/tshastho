import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { medicineId, action } = body;

    if (action === "delete") {
      await prisma.medicine.delete({ where: { id: medicineId } });
      return NextResponse.json({ message: "Deleted!" }, { status: 200 });
    }

    // নতুন কোড: শুধু স্টক আপডেট করার জন্য
    if (action === "update_stock") {
      const oldMed = await prisma.medicine.findUnique({ where: { id: medicineId } });
      if (!oldMed) return NextResponse.json({ message: "Medicine not found" }, { status: 404 });

      const newStock = parseInt(body.stock) || 0;
      const diff = newStock - oldMed.stock;

      const updated = await prisma.medicine.update({
        where: { id: medicineId },
        data: { stock: newStock }
      });

      // স্টক মুভমেন্ট হিস্ট্রি সেভ করা
      if (diff !== 0) {
        await prisma.stockMovement.create({
          data: {
            pharmacyId: oldMed.pharmacyId,
            medicineId: medicineId,
            type: 'ADJUSTMENT',
            quantity: diff,
            previousStock: oldMed.stock,
            newStock: newStock,
            reason: 'Manual adjustment from inventory',
            userId: auth.user.id,
          }
        });
      }

      return NextResponse.json({ message: "Stock updated!", medicine: updated }, { status: 200 });
    }

    const { stock, branchId } = body;

      // ১. Medicine টেবিলে সাধারণ তথ্য আপডেট (স্টক ছাড়া)
      const medicine = await prisma.medicine.update({
        where: { id: medicineId },
        data: {
          
          name: body.name,
          brand: body.brand || null,
          genericName: body.genericName || null,
          category: body.category || null,
          description: body.description || null,
          strength: body.strength || null,
          purchasePrice: parseFloat(body.purchasePrice),
          sellingPrice: parseFloat(body.sellingPrice),
          discountPercent: parseFloat(body.discountPercent) || 0,
          unit: body.unit || "piece",
          manufacturer: body.manufacturer || null,
          masterMedicineId: body.masterMedicineId || null,
          images: Array.isArray(body.images) ? body.images : null,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          batchNumber: body.batchNumber || null,
          lowStockAlert: parseInt(body.lowStockAlert) || 10,
          barcode: body.barcode || null, 
          supplier: body.supplier || null,
        },
      });

      // ২. BranchStock টেবিলে স্টক আপডেট (মাল্টি-ব্রাঞ্চ লজিক)
      if (stock !== undefined) {
        let validBranchId = branchId;
        
        // যদি branchId "ALL" হয় বা না থাকে, তবে ফার্মেসির প্রথম ব্রাঞ্চটি খুঁজে বের করা
        if (!validBranchId || validBranchId === "ALL") {
          const defaultBranch = await prisma.pharmacyBranch.findFirst({
            where: { pharmacyId: medicine.pharmacyId }
          });
          if (defaultBranch) validBranchId = defaultBranch.id;
        }

        if (validBranchId) {
          const existingStock = await prisma.branchStock.findUnique({
            where: { branchId_medicineId: { branchId: validBranchId, medicineId: medicineId } }
          });
          
          const newStock = parseInt(stock) || 0;
          const prevStock = existingStock?.quantity || 0;
          const diff = newStock - prevStock;

          await prisma.branchStock.upsert({
            where: { branchId_medicineId: { branchId: validBranchId, medicineId: medicineId } },
            update: { quantity: newStock },
            create: { branchId: validBranchId, medicineId: medicineId, quantity: newStock }
          });

          if (diff !== 0) {
            await prisma.stockMovement.create({
              data: {
                pharmacyId: medicine.pharmacyId,
                medicineId: medicineId,
                type: 'ADJUSTMENT',
                quantity: diff,
                previousStock: prevStock,
                newStock: newStock,
                reason: 'Manual edit from inventory',
                userId: auth.user.id,
              }
            });
          }
        }
      }

      return NextResponse.json({ message: "Updated successfully!", medicine }, { status: 200 });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

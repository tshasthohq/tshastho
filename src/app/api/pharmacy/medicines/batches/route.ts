import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const medicineId = searchParams.get('medicineId');

  if (!medicineId) return NextResponse.json({ error: "Medicine ID required" }, { status: 400 });

  try {
    const batches = await prisma.batch.findMany({
      where: { medicineId },
      orderBy: { expiryDate: 'asc' }
    });
    return NextResponse.json({ success: true, batches });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { medicineId, batchNumber, expiryDate, quantity, purchasePrice, sellingPrice, branchId } = body;

    if (!medicineId || !quantity) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const med = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!med) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });

    // ১. নতুন ব্যাচ তৈরি করা
    const batchData: any = {
        pharmacyId: med.pharmacyId,
        medicineId,
        batchNumber: batchNumber || `B-${Date.now()}`,
        quantity: parseInt(quantity),
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
      };
      
      if (expiryDate) {
        batchData.expiryDate = new Date(expiryDate);
      }

      const batch = await prisma.batch.create({
        data: batchData
      });

    // ২. Medicine টেবিলের মোট স্টক বাড়ানো
    const addQty = parseInt(quantity);
    await prisma.medicine.update({ where: { id: medicineId }, data: { stock: { increment: addQty } } });
    await prisma.stockMovement.create({ data: { pharmacyId: med.pharmacyId, medicineId, batchId: batch.id, type: "PURCHASE" as any, quantity: addQty, previousStock: med.stock, newStock: med.stock + addQty, reason: "New batch added", userId: auth.user.id } });

    // ৩. ব্রাঞ্চ স্টক বাড়ানো (যদি ব্রাঞ্চ আইডি থাকে)
    if (branchId) {
      await prisma.branchStock.upsert({
        where: { branchId_medicineId: { branchId, medicineId } },
        update: { quantity: { increment: parseInt(quantity) } },
        create: { branchId, medicineId, quantity: parseInt(quantity) }
      });
    }

    return NextResponse.json({ success: true, batch });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add batch" }, { status: 500 });
  }
}

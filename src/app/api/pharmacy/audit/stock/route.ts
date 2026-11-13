import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { recordStockMovement } from '@/lib/pharmacy/stock';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { medicineId, actualStock, reason } = body;

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const med = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!med) return NextResponse.json({ message: "Medicine not found" }, { status: 404 });

    const diff = actualStock - med.stock;

    if (diff === 0) {
      return NextResponse.json({ message: "No variance found. Stock is accurate." }, { status: 400 });
    }

    // স্টক আপডেট এবং লগ তৈরি
    await prisma.$transaction(async (tx) => {
      // ১. স্টক মুভমেন্ট রেকর্ড (recordStockMovement হেল্পার ব্যবহার করে)
      await recordStockMovement({
        pharmacyId: pharmacy.id,
        medicineId: medicineId,
        type: 'ADJUSTMENT', // অডিটের জন্য ADJUSTMENT ব্যবহার করা হলো
        quantity: Math.abs(diff),
        reason: reason || `Physical Stock Audit (System: ${med.stock}, Actual: ${actualStock})`,
        userId: auth.user.id,
      });

      // ২. AuditLog তৈরি (যাতে অডিট পেজে দেখা যায়)
      await tx.pharmacyAuditLog.create({
        data: {
          pharmacyId: pharmacy.id,
          userId: auth.user.id,
          action: 'STOCK_AUDIT',
          resource: 'Medicine',
          resourceId: medicineId,
          details: {
            medicineName: med.name,
            systemStock: med.stock,
            actualStock: actualStock,
            variance: diff
          }
        }
      });
    });

    return NextResponse.json({ success: true, message: "Stock updated successfully", variance: diff });
  } catch (error) {
    console.error("Stock audit error:", error);
    return NextResponse.json({ message: "Failed to process stock audit" }, { status: 500 });
  }
}

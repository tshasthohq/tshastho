import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { medicineId, newStock, reason, type } = await req.json();

    if (!medicineId || newStock === undefined || !reason) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const med = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!med) return NextResponse.json({ message: "Medicine not found" }, { status: 404 });

    const diff = newStock - med.stock;

    await prisma.$transaction(async (tx) => {
      // ১. স্টক আপডেট
      await tx.medicine.update({
        where: { id: medicineId },
        data: { stock: newStock }
      });

      // ২. স্টক মুভমেন্ট হিস্ট্রি সেভ
      if (diff !== 0) {
        await tx.stockMovement.create({
          data: {
            pharmacyId: med.pharmacyId,
            medicineId: medicineId,
            type: type || 'ADJUSTMENT', // DAMAGE, EXPIRED, ADJUSTMENT, etc.
            quantity: diff,
            previousStock: med.stock,
            newStock: newStock,
            reason: reason,
            userId: auth.user.id,
          }
        });
      }
    });

    return NextResponse.json({ success: true, message: "Stock adjusted successfully" });
  } catch (error) {
    console.error("Adjustment error:", error);
    return NextResponse.json({ message: "Failed to adjust stock" }, { status: 500 });
  }
}

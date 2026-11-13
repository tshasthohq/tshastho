import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const requests = await prisma.expiryWriteOffBatch.findMany({
      where: { pharmacyId: pharmacy.id },
      include: {
        medicine: { select: { name: true } },
        batch: { select: { batchNumber: true, expiryDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Write-off fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { id, action } = await req.json();

    if (!id || !action) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    const writeOff = await prisma.expiryWriteOffBatch.findUnique({
      where: { id },
      include: { batch: true }
    });

    if (!writeOff) return NextResponse.json({ message: "Request not found" }, { status: 404 });

    if (action === 'APPROVE') {
      await prisma.expiryWriteOffBatch.update({
        where: { id },
        data: { status: 'APPROVED', reviewedById: auth.user.id, reviewedAt: new Date() }
      });
      return NextResponse.json({ success: true, message: "Approved" });
    }

    if (action === 'REJECT') {
      await prisma.expiryWriteOffBatch.update({
        where: { id },
        data: { status: 'REJECTED', reviewedById: auth.user.id, reviewedAt: new Date() }
      });
      return NextResponse.json({ success: true, message: "Rejected" });
    }

    if (action === 'COMPLETE') {
      if (writeOff.status !== 'APPROVED') {
        return NextResponse.json({ message: "Must be approved first" }, { status: 400 });
      }

      // ডাটাবেস ট্রানজেকশন শুরু (স্টক কমানো এবং স্ট্যাটাস আপডেট)
      await prisma.$transaction(async (tx) => {
        // ১. ব্যাচ থেকে স্টক কমানো
        if (writeOff.batch) {
          await tx.batch.update({
            where: { id: writeOff.batchId },
            data: { 
              quantity: { decrement: writeOff.quantity },
              isActive: false // ব্যাচটি ডিজেবল করে দেওয়া
            }
          });
        }

        // ২. মেডিসিন টেবিলের বর্তমান স্টক বের করা
        const med = await tx.medicine.findUnique({ where: { id: writeOff.medicineId } });
        if (!med) throw new Error("Medicine not found");
        
        const prevStock = med.stock;
        const newStock = prevStock - writeOff.quantity;

        // ৩. মেডিসিন টেবিলের মোট স্টক আপডেট করা
        await tx.medicine.update({
          where: { id: writeOff.medicineId },
          data: { stock: newStock }
        });

        // ৪. স্টক মুভমেন্ট হিস্ট্রি তৈরি (previousStock এবং newStock সহ)
        await tx.stockMovement.create({
          data: {
            pharmacyId: writeOff.pharmacyId,
            medicineId: writeOff.medicineId,
            type: 'EXPIRED',
            quantity: -writeOff.quantity,
            previousStock: prevStock,
            newStock: newStock,
            reason: `Expiry Write-off: ${writeOff.reason}`,
            userId: auth.user.id,
          }
        });

        // ৪. Write-off রিকোয়েস্ট স্ট্যাটাস আপডেট
        await tx.expiryWriteOffBatch.update({
          where: { id },
          data: { status: 'COMPLETED', reviewedById: auth.user.id, reviewedAt: new Date() }
        });
      });

      return NextResponse.json({ success: true, message: "Write-off completed and stock updated" });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Write-off action error:", error);
    return NextResponse.json({ message: "Failed to process action" }, { status: 500 });
  }
}

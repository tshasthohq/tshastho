import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { recordStockMovement } from '@/lib/pharmacy/stock';
import { logCashDrawer } from '@/lib/pharmacy/cash-drawer';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    
    const returnOrder = await prisma.returnOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!returnOrder) return NextResponse.json({ message: "Return not found" }, { status: 404 });
    if (returnOrder.status !== 'APPROVED') return NextResponse.json({ message: "Return must be approved first" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      // ১. স্টক আপডেট এবং মুভমেন্ট লগ
      for (const item of returnOrder.items) {
        if (returnOrder.type === 'CUSTOMER_RETURN' && item.isRestocked) {
          // 🔥 BranchStock এ সরাসরি স্টক যোগ করা হচ্ছে
          if (returnOrder.branchId) {
            await tx.branchStock.upsert({
              where: { branchId_medicineId: { branchId: returnOrder.branchId, medicineId: item.medicineId } },
              update: { quantity: { increment: item.quantity } },
              create: { branchId: returnOrder.branchId, medicineId: item.medicineId, quantity: item.quantity }
            });
          }

          // গ্লোবাল স্টক মুভমেন্ট লগ
          await recordStockMovement({
            pharmacyId: returnOrder.pharmacyId,
            medicineId: item.medicineId,
            type: 'RETURN_IN',
            quantity: item.quantity,
            referenceId: returnOrder.id,
            reason: `Customer Return: ${returnOrder.returnNumber}`,
            userId: auth.user.id,
          });
        } 
        else if (returnOrder.type === 'SUPPLIER_RETURN') {
           // সাপ্লায়ার রিটার্নের ক্ষেত্রে গ্লোবাল স্টক কমবে
           await tx.medicine.update({
             where: { id: item.medicineId },
             data: { stock: { decrement: item.quantity } }
           });
           if (returnOrder.branchId) {
              await tx.branchStock.updateMany({
                where: { branchId: returnOrder.branchId, medicineId: item.medicineId },
                data: { quantity: { decrement: item.quantity } }
              });
           }

           await recordStockMovement({
            pharmacyId: returnOrder.pharmacyId,
            medicineId: item.medicineId,
            type: 'RETURN_OUT',
            quantity: item.quantity,
            referenceId: returnOrder.id,
            reason: `Returned to Supplier: ${returnOrder.returnNumber}`,
            userId: auth.user.id,
          });
        }
      }

      // ২. স্ট্যাটাস আপডেট
      await tx.returnOrder.update({
        where: { id },
        data: { status: 'PROCESSED', processedById: auth.user.id, processedAt: new Date() }
      });
    });

    // ৩. 🔥 ক্যাশ রিফান্ড লজিক (Transaction-এর বাইরে, কারণ ক্যাশ ড্রয়ার আলাদা লগ)
    if (returnOrder.refundMethod === 'CASH' && Number(returnOrder.refundAmount) > 0) {
      await logCashDrawer({
        pharmacyId: returnOrder.pharmacyId,
        userId: auth.user.id,
        reason: 'REFUND',
        amount: -Number(returnOrder.refundAmount), // মাইনাস দিয়ে ক্যাশ আউট বোঝানো হচ্ছে
      }).catch(e => console.error('[DRAWER_LOG_RETURN]', e));
    }

    return NextResponse.json({ success: true, message: "Return processed and stock updated successfully" });
  } catch (error) {
    console.error("Return process error:", error);
    return NextResponse.json({ message: "Failed to process return" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const typeFilter = url.searchParams.get('type');
    const statusFilter = url.searchParams.get('status');
    const branchId = url.searchParams.get('branchId');

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const whereClause: any = { pharmacyId: pharmacy.id };
    if (typeFilter && typeFilter !== 'ALL') whereClause.type = typeFilter;
    if (statusFilter && statusFilter !== 'ALL') whereClause.status = statusFilter;
    if (branchId && branchId !== 'ALL') whereClause.branchId = branchId;

    const returns = await prisma.returnOrder.findMany({
      where: whereClause,
      include: { items: true, branch: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, returns });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { 
      type, customerName, customerPhone, refundMethod, originalSaleId, 
      items, totalAmount, refundAmount, branchId, reason, notes 
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "No items provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    let pharmacyId = user?.parentPharmacyId;
    if (!pharmacyId) {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user?.id } });
      pharmacyId = pharmacy?.id;
    }
    if (!pharmacyId) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const returnNumber = `RET-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
    const targetBranchId = branchId || null;

    const result = await prisma.$transaction(async (tx) => {
      // 🔥 Check if originalSaleId belongs to POS Sale or Online Order
      let validOriginalSaleId = null;
      let refId = null;
      let refType = null;

      if (originalSaleId) {
        const posSale = await tx.posSale.findUnique({ where: { id: originalSaleId } });
        if (posSale) {
          validOriginalSaleId = originalSaleId;
        } else {
          // এটি অনলাইন অর্ডার, তাই রেফারেন্সে সেভ করব
          refId = originalSaleId;
          refType = 'ONLINE_ORDER';
        }
      }
      // ১. Return Order তৈরি করা
      const returnOrder = await tx.returnOrder.create({
        data: {
          pharmacyId,
          branchId: targetBranchId,
          returnNumber,
          type: type || 'CUSTOMER_RETURN',
          status: 'PENDING',
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          refundMethod: refundMethod || 'CASH',
          originalSaleId: validOriginalSaleId,
          referenceId: refId,
          referenceType: refType,
          totalAmount: Number(totalAmount) || 0,
          refundAmount: Number(refundAmount) || 0,
          reason: reason || null,
          notes: notes || null,
          items: {
            create: items.map((i: any) => ({
              medicineId: i.medicineId,
              medicineName: i.medicineName || 'Unknown', 
              quantity: Number(i.quantity),
              unitPrice: Number(i.unitPrice) || 0,
              subtotal: (Number(i.quantity) * Number(i.unitPrice)) || 0,
              isRestocked: Boolean(i.isRestocked),
              reason: i.reason || null
            }))
          }
        }
      });

      // ২. স্টক রিস্টক করা (যদি isRestocked true থাকে এবং ব্রাঞ্চ সিলেক্ট করা থাকে)
      for (const item of items) {
        // 🔥 Fetch real medicine name if unknown
        let medName = item.medicineName;
        if (!medName || medName === 'Unknown') {
           const med = await tx.medicine.findUnique({ where: { id: item.medicineId }, select: { name: true } });
           if (med) medName = med.name;
        }
        
        if (item.isRestocked && targetBranchId) {
          await tx.branchStock.upsert({
            where: { branchId_medicineId: { branchId: targetBranchId, medicineId: item.medicineId } },
            update: { quantity: { increment: Number(item.quantity) } },
            create: { branchId: targetBranchId, medicineId: item.medicineId, quantity: Number(item.quantity) }
          });
        }
      }

      return returnOrder;
    });

    return NextResponse.json({ success: true, returnOrder: result });
  } catch (error) {
    console.error("Return create error:", error);
    return NextResponse.json({ message: "Failed to create return" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const invoiceNumber = url.searchParams.get('invoice');

    if (!invoiceNumber) {
      return NextResponse.json({ message: "Invoice number required" }, { status: 400 });
    }

    // 🔥 ১. প্রথমে POS সেলে খোঁজা
    const posSale = await prisma.posSale.findFirst({
      where: { saleNumber: invoiceNumber },
      include: {
        items: {
          include: {
            medicine: { select: { id: true, name: true, sellingPrice: true } }
          }
        }
      }
    });

    if (posSale) {
      return NextResponse.json({ success: true, sale: posSale });
    }

    // 🔥 ২. POS-এ না পেলে অনলাইন অর্ডারে খোঁজা
    const onlineOrder = await prisma.order.findFirst({
      where: { orderNumber: invoiceNumber },
      include: {
        patient: { select: { name: true, phone: true } },
        items: true
      }
    });

    if (onlineOrder) {
      // UI-এর ফরম্যাটের সাথে মিলিয়ে ডেটা পাঠানো হচ্ছে
      const mappedSale = {
        id: onlineOrder.id,
        saleNumber: onlineOrder.orderNumber,
        customerName: onlineOrder.patient?.name || "Online Customer",
        customerPhone: onlineOrder.deliveryPhone || onlineOrder.patient?.phone || "",
        branchId: onlineOrder.branchId,
        createdAt: onlineOrder.createdAt,
        items: onlineOrder.items.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          medicine: { 
            id: item.medicineId, 
            name: item.medicineName, 
            sellingPrice: item.unitPrice 
          }
        }))
      };
      return NextResponse.json({ success: true, sale: mappedSale });
    }

    return NextResponse.json({ message: "Invoice not found in POS or Online Orders" }, { status: 404 });

  } catch (error) {
    console.error("Invoice search error:", error);
    return NextResponse.json({ message: "Failed to search invoice" }, { status: 500 });
  }
}
